/**
 * Lark Webhook Endpoint
 * 
 * This endpoint receives webhook events from Lark (Feishu) and processes them.
 * It handles URL verification, message events, and AI-powered invoice extraction.
 * Supports both Lark API v1.0 and v2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage, downloadImage } from '@/lib/lark';
// import '@/lib/init-db'; // Removed auto-initialization to prevent Vercel errors
import { startConversationCleanup } from '@/lib/conversation-timeout';
import {
    createConversationState,
    getConversationStateByChatId,
    deleteConversationState
} from '@/lib/conversation-state';
import { extractInvoiceFromText, extractInvoiceFromImage, extractInvoiceFromAudio, InvoiceData } from '@/lib/gemini';
import { createInvoiceDraft } from '@/lib/invoice';
import { getIssuerPattern } from '@/lib/issuer-patterns';

// Cache for processed event IDs and message IDs
const processedEvents = new Set<string>();
const processedMessages = new Set<string>();
const MAX_CACHE_SIZE = 1000;

// Start conversation timeout cleanup
let cleanupInterval: NodeJS.Timeout | null = null;
if (!cleanupInterval) {
    cleanupInterval = startConversationCleanup();
    console.log('Conversation timeout cleanup started');
}

// GET endpoint for health check
export async function GET(request: NextRequest) {
    return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is active' });
}

/**
 * POST /api/lark/webhook
 */
export async function POST(request: NextRequest) {
    try {
        // Get raw body
        const rawBody = await request.text();
        console.log('Webhook raw body length:', rawBody.length);

        // Parse JSON
        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        // Basic validation
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid body format' }, { status: 400 });
        }

        // --- URL Verification (Fast Path) ---
        if ('type' in body && body.type === 'url_verification') {
            console.log('Handling URL verification challenge');
            return NextResponse.json({ challenge: body.challenge });
        }

        // Check for encryption
        if ('encrypt' in body) {
            console.error('Received encrypted event. Please disable encryption.');
            return NextResponse.json({ error: 'Encryption not supported' }, { status: 400 });
        }

        // Log request info
        console.log('Webhook received:', request.method, request.url);

        // Handle Lark API v2.0 events
        if (body.schema === '2.0' && body.header) {
            const eventType = body.header.event_type;
            const eventId = body.header.event_id;

            console.log('Event type (v2.0):', eventType);

            // Deduplication (Event ID)
            if (processedEvents.has(eventId)) {
                console.log('Duplicate event detected, skipping:', eventId);
                return NextResponse.json({ status: 'ok', message: 'duplicate_skipped' });
            }
            if (eventId) {
                processedEvents.add(eventId);
                if (processedEvents.size > MAX_CACHE_SIZE) {
                    const firstItem = processedEvents.values().next().value;
                    if (firstItem) processedEvents.delete(firstItem);
                }
            }

            // Dispatch Event
            if (eventType === 'im.message.receive_v1') {
                // Background execution to return status ok quickly (?)
                // Vercel serverless has a limit, but we await here to ensure execution.
                // In a robust system, this would push to a queue.
                await handleMessageReceived(body.event);
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Handle message received event
 */
async function handleMessageReceived(event: any) {
    try {
        const { message } = event;
        const chatId = message.chat_id;
        const messageId = message.message_id;
        const messageType = message.message_type;

        console.log(`Received ${messageType} message in chat ${chatId}`);

        // Deduplication (Message ID)
        if (processedMessages.has(messageId)) {
            console.log('Duplicate message detected, skipping:', messageId);
            return;
        }
        processedMessages.add(messageId);
        if (processedMessages.size > MAX_CACHE_SIZE) {
            const firstItem = processedMessages.values().next().value;
            if (firstItem) processedMessages.delete(firstItem);
        }

        // Dispatch Message Type
        if (messageType === 'text') {
            await handleTextMessage(chatId, messageId, message);
        } else if (messageType === 'image') {
            await handleImageMessage(chatId, messageId, message);
        } else if (messageType === 'audio') {
            await handleAudioMessage(chatId, messageId, message);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

/**
 * Handle Text Message
 */
async function handleTextMessage(chatId: string, messageId: string, message: any) {
    try {
        const content = JSON.parse(message.content);
        let text = content.text as string;

        // Remove mentions (e.g., @_user_1)
        text = text.replace(/@_user_\d+/g, '').trim();

        if (!text) return;

        // Ignore URL preview messages (Lark automatically sends these)
        // These messages typically contain only URLs without user input
        const urlOnlyPattern = /^https?:\/\/[^\s]+$/;
        if (urlOnlyPattern.test(text)) {
            console.log('Ignoring URL-only message (likely preview)');
            return;
        }

        // Ignore timeout messages and bot's own messages
        if (text.includes('一定時間操作がなかったため') ||
            text.includes('処理を中断しました') ||
            text.includes('新しく請求書を作成する場合は') ||
            text.includes('請求書の下書きを作成しました') ||
            text.includes('発行者を選択してください')) {
            console.log('Ignoring system/bot message');
            return;
        }

        // 1. Check conversation state
        const state = await getConversationStateByChatId(chatId);

        if (state && state.state === 'awaiting_issuer_selection') {
            // Check user input for issuer selection
            const selection = text.trim();
            let selectedPattern = 0;

            if (selection === '1' || selection === '1.') selectedPattern = 1;
            if (selection === '2' || selection === '2.') selectedPattern = 2;

            if (selectedPattern !== 0) {
                // Valid selection
                const issuer = getIssuerPattern(selectedPattern);
                let invoiceData: InvoiceData;

                try {
                    invoiceData = JSON.parse(state.data);
                } catch (e) {
                    console.error('Failed to parse saved invoice data', e);
                    await sendTextMessage(chatId, 'エラー: 保存されたデータの読み込みに失敗しました。もう一度はじめからやり直してください。');
                    await deleteConversationState(chatId);
                    return;
                }

                // Create Invoice Draft
                await sendTextMessage(chatId, `「${issuer.name}」として請求書を作成中...`);

                // Merge issuer info into invoice data
                const finalInvoiceData = {
                    ...invoiceData,
                    issuer: {
                        name: issuer.name,
                        address: issuer.address,
                        postalCode: issuer.postalCode,
                        phone: issuer.phone,
                        email: issuer.email,
                        bankInfo: issuer.bankInfo
                    }
                };

                const invoiceId = await createInvoiceDraft(chatId, messageId, finalInvoiceData);

                // Response with Edit URL
                const editUrl = `${process.env.BETTER_AUTH_URL}/invoice/${invoiceId}`;
                await sendTextMessage(chatId, `請求書の下書きを作成しました！\n以下のリンクから編集・確認してください：\n${editUrl}`);

                // Clear state
                await deleteConversationState(state.id);
            } else {
                // Invalid selection
                await sendTextMessage(chatId, '無効な選択です。1 または 2 を入力してください。\nキャンセルする場合は「キャンセル」と入力してください。');
                // State remains
            }

            // Handle cancellation
            if (text.includes('キャンセル') || text.toLowerCase() === 'cancel') {
                await sendTextMessage(chatId, '処理をキャンセルしました。');
                await deleteConversationState(chatId);
            }
            return;
        }

        // 2. No active state, start new extraction flow
        await sendTextMessage(chatId, 'テキストから請求書情報を抽出しています...');
        const invoiceData = await extractInvoiceFromText(text);

        // Save state and ask for issuer
        const issuers = [getIssuerPattern(1), getIssuerPattern(2)];
        await createConversationState(chatId, messageId, 'awaiting_issuer_selection', invoiceData);

        const messageText = `請求書情報を抽出しました！\n発行者を選択してください（番号を入力）：\n1. ${issuers[0].name} (${issuers[0].company})\n2. ${issuers[1].name} (${issuers[1].company})`;
        await sendTextMessage(chatId, messageText);

    } catch (error) {
        console.error('Error in handleTextMessage:', error);
        await sendTextMessage(chatId, 'エラーが発生しました。もう一度お試しください。');
    }
}

/**
 * Handle Image Message
 */
async function handleImageMessage(chatId: string, messageId: string, message: any) {
    try {
        const imageKey = message.image_key;
        if (!imageKey) return;

        await sendTextMessage(chatId, '画像を解析中...');

        // Download image
        const imageBuffer = await downloadImage(messageId, imageKey); // Requires messageId now
        if (!imageBuffer) {
            await sendTextMessage(chatId, '画像のダウンロードに失敗しました。');
            return;
        }

        // Analysis (Lark images are typically PNG/JPEG)
        const invoiceData = await extractInvoiceFromImage(imageBuffer, 'image/png');

        // Save state and ask for issuer
        const issuers = [getIssuerPattern(1), getIssuerPattern(2)];
        await createConversationState(chatId, messageId, 'awaiting_issuer_selection', invoiceData);

        const messageText = `画像を解析しました！\n発行者を選択してください（番号を入力）：\n1. ${issuers[0].name} (${issuers[0].company})\n2. ${issuers[1].name} (${issuers[1].company})`;
        await sendTextMessage(chatId, messageText);

    } catch (error: any) {
        console.error('Error in handleImageMessage:', error);
        await sendTextMessage(chatId, `画像の処理中にエラーが発生しました: ${error.message}`);
    }
}

/**
 * Handle Audio Message
 */
async function handleAudioMessage(chatId: string, messageId: string, message: any) {
    try {
        const fileKey = message.file_key;
        if (!fileKey) return;

        await sendTextMessage(chatId, '音声を解析中...');

        const audioBuffer = await downloadImage(messageId, fileKey); // Reusing generic download function
        if (!audioBuffer) {
            await sendTextMessage(chatId, '音声ファイルのダウンロードに失敗しました。');
            return;
        }

        // Analysis (Lark audio messages are typically opus/wav)
        const invoiceData = await extractInvoiceFromAudio(audioBuffer, 'audio/opus');

        // Save state and ask for issuer
        const issuers = [getIssuerPattern(1), getIssuerPattern(2)];
        await createConversationState(chatId, messageId, 'awaiting_issuer_selection', invoiceData);

        const messageText = `音声を解析しました！\n発行者を選択してください（番号を入力）：\n1. ${issuers[0].name} (${issuers[0].company})\n2. ${issuers[1].name} (${issuers[1].company})`;
        await sendTextMessage(chatId, messageText);

    } catch (error: any) {
        console.error('Error in handleAudioMessage:', error);
        await sendTextMessage(chatId, `音声の処理中にエラーが発生しました: ${error.message}`);
    }
}
