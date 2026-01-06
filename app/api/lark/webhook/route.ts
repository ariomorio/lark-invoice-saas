/**
 * Lark Webhook Endpoint
 * 
 * This endpoint receives webhook events from Lark (Feishu) and processes them.
 * It handles URL verification, message events, and AI-powered invoice extraction.
 * Supports both Lark API v1.0 and v2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage } from '@/lib/lark';
// import '@/lib/init-db'; // Removed auto-initialization to prevent Vercel errors
import { startConversationCleanup } from '@/lib/conversation-timeout';

// 処理済みイベントIDを保存（メモリキャッシュ）
const processedEvents = new Set<string>();
// 処理済みメッセージIDを保存（重複メッセージ防止）
const processedMessages = new Set<string>();
const MAX_CACHE_SIZE = 1000;

// Start conversation timeout cleanup
let cleanupInterval: NodeJS.Timeout | null = null;
if (!cleanupInterval) {
    cleanupInterval = startConversationCleanup();
    console.log('Conversation timeout cleanup started');
}

/**
 * POST /api/lark/webhook
 * 
 * Handles incoming webhook events from Lark
 */
export async function POST(request: NextRequest) {
    try {
        try {
            // Get raw body
            const rawBody = await request.text();

            // Parse JSON
            let body;
            try {
                body = JSON.parse(rawBody);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                return NextResponse.json(
                    { error: 'Invalid JSON' },
                    { status: 400 }
                );
            }

            // Handle URL verification challenge (v1.0) - FAST PATH
            // 最優先で処理し、ログ出力などのオーバーヘッドを避ける
            if (body.type === 'url_verification') {
                return NextResponse.json({
                    challenge: body.challenge,
                });
            }

            // Log incoming request after verification check
            console.log('Webhook received:', request.method, request.url);
            console.log('Parsed body:', JSON.stringify(body, null, 2));
        }

        // Handle Lark API v2.0 events
        if (body.schema === '2.0' && body.header) {
            const eventType = body.header.event_type;
            const eventId = body.header.event_id;

            console.log('Event type (v2.0):', eventType);
            console.log('Event ID:', eventId);

            // Check if event has already been processed
            if (eventId && processedEvents.has(eventId)) {
                console.log('Duplicate event detected, skipping:', eventId);
                return NextResponse.json({ success: true, message: 'Duplicate event' });
            }

            // Add to processed events
            if (eventId) {
                processedEvents.add(eventId);

                // Limit cache size
                if (processedEvents.size > MAX_CACHE_SIZE) {
                    const firstItem = processedEvents.values().next().value;
                    if (firstItem) {
                        processedEvents.delete(firstItem);
                    }
                }
            }

            // Handle message received event
            if (eventType === 'im.message.receive_v1') {
                await handleMessageReceived(body.event);
            }

            // Return success response immediately
            return NextResponse.json({ success: true });
        }

        // Handle Lark API v1.0 event callback
        if (body.type === 'event_callback') {
            const event = body.event;

            // Handle message received event
            if (event.type === 'message.receive_v1') {
                await handleMessageReceived(event);
            }

            // Return success response immediately
            return NextResponse.json({ success: true });
        }

        // Unknown event type
        console.log('Unknown event type:', body.type || body.header?.event_type);
        return NextResponse.json(
            { error: 'Unknown event type' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * Handle message received event
 */
async function handleMessageReceived(event: any) {
    try {
        const message = event.message;
        const chatId = message.chat_id;
        const messageId = message.message_id;
        const messageType = message.message_type;

        console.log(`Received ${messageType} message in chat ${chatId}`);

        // Check if this message has already been processed
        if (processedMessages.has(messageId)) {
            console.log('Duplicate message detected, skipping:', messageId);
            return;
        }

        // Add to processed messages
        processedMessages.add(messageId);

        // Limit cache size
        if (processedMessages.size > MAX_CACHE_SIZE) {
            const firstItem = processedMessages.values().next().value;
            if (firstItem) {
                processedMessages.delete(firstItem);
            }
        }

        // Handle different message types
        if (messageType === 'text') {
            await handleTextMessage(chatId, messageId, message);
        } else if (messageType === 'image') {
            await handleImageMessage(chatId, messageId, message);
        } else if (messageType === 'audio') {
            await handleAudioMessage(chatId, messageId, message);
        } else {
            console.log(`Unsupported message type: ${messageType}`);
            await sendTextMessage(
                chatId,
                'このメッセージタイプはサポートされていません。テキスト、画像、または音声メッセージを送信してください。',
                messageId
            );
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

/**
 * Handle text message
 */
async function handleTextMessage(chatId: string, messageId: string, message: any) {
    try {
        // Parse message content
        const content = JSON.parse(message.content);
        const text = content.text.trim();

        console.log('Text message content:', text);

        // Check if this is a response to issuer selection (1 or 2)
        if (text === '1' || text === '2') {
            const { getConversationStateByChatId, deleteConversationState } = await import('@/lib/conversation-state');
            const conversationState = await getConversationStateByChatId(chatId);

            if (conversationState && conversationState.state === 'awaiting_issuer_selection') {
                // User selected an issuer pattern
                await handleIssuerSelection(chatId, messageId, parseInt(text), conversationState);

                // Delete conversation state
                await deleteConversationState(conversationState.id);
                return;
            }
        }

        // Normal flow: extract invoice data
        // Send acknowledgment
        await sendTextMessage(
            chatId,
            '請求書情報を解析中...',
            messageId
        );

        // Extract invoice data using Gemini API
        const { extractInvoiceFromText } = await import('@/lib/gemini');
        const invoiceData = await extractInvoiceFromText(text);

        // Ask user to select issuer pattern
        await askIssuerSelection(chatId, messageId, invoiceData);

    } catch (error) {
        console.error('Error handling text message:', error);
        await sendTextMessage(
            chatId,
            `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            messageId
        );
    }
}

/**
 * Ask user to select issuer pattern
 */
async function askIssuerSelection(chatId: string, messageId: string, invoiceData: any) {
    const { createConversationState } = await import('@/lib/conversation-state');
    const { getIssuerSelectionMessage } = await import('@/lib/issuer-patterns');

    // Save conversation state
    await createConversationState(
        chatId,
        messageId,
        'awaiting_issuer_selection',
        invoiceData,
        5 // expires in 5 minutes
    );

    // Send selection message
    const selectionMessage = getIssuerSelectionMessage();
    await sendTextMessage(chatId, selectionMessage, messageId);
}

/**
 * Handle issuer selection
 */
async function handleIssuerSelection(
    chatId: string,
    messageId: string,
    patternNumber: number,
    conversationState: any
) {
    try {
        const { getIssuerPattern } = await import('@/lib/issuer-patterns');
        const issuerInfo = getIssuerPattern(patternNumber);

        // Parse saved invoice data
        const invoiceData = JSON.parse(conversationState.data);

        // Apply selected issuer pattern
        invoiceData.issuer = {
            name: issuerInfo.company, // 会社名のみ
            address: issuerInfo.address,
            postalCode: issuerInfo.postalCode,
            phone: issuerInfo.phone,
            email: issuerInfo.email,
        };

        // Add bank info to notes (振込先情報は備考欄のみ)
        const bankInfoText = `${issuerInfo.bankInfo}\n\n担当者: ${issuerInfo.name}`;

        if (invoiceData.notes && invoiceData.notes.trim()) {
            // 既存の備考がある場合は追加
            invoiceData.notes = `${invoiceData.notes}\n\n${bankInfoText}`;
        } else {
            // 備考がない場合は新規作成
            invoiceData.notes = bankInfoText;
        }

        // Save to database
        const { createInvoiceDraft } = await import('@/lib/invoice');
        const invoiceId = await createInvoiceDraft(chatId, conversationState.message_id, invoiceData);

        // Generate edit URL
        const editUrl = `${process.env.BETTER_AUTH_URL}/invoice/${invoiceId}`;

        // Send response with edit link
        await sendTextMessage(
            chatId,
            `パターン${patternNumber}で請求書の下書きを作成しました！\n\n以下のURLから編集できます:\n${editUrl}`,
            messageId
        );
    } catch (error) {
        console.error('Error handling issuer selection:', error);
        await sendTextMessage(
            chatId,
            `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            messageId
        );
    }
}

/**
 * Handle image message
 */
async function handleImageMessage(chatId: string, messageId: string, message: any) {
    try {
        // Parse message content
        const content = JSON.parse(message.content);
        const imageKey = content.image_key;

        console.log('Image message, key:', imageKey);

        // Send acknowledgment
        await sendTextMessage(
            chatId,
            '画像から請求書情報を解析中...',
            messageId
        );

        // Download image (requires both messageId and imageKey)
        const { downloadImage } = await import('@/lib/lark');
        const imageBuffer = await downloadImage(messageId, imageKey);

        // Extract invoice data using Gemini Vision API
        const { extractInvoiceFromImage } = await import('@/lib/gemini');
        const invoiceData = await extractInvoiceFromImage(imageBuffer, 'image/jpeg');

        // Ask user to select issuer pattern (same as text message)
        await askIssuerSelection(chatId, messageId, invoiceData);

    } catch (error) {
        console.error('Error handling image message:', error);
        await sendTextMessage(
            chatId,
            `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            messageId
        );
    }
}

/**
 * Handle audio message
 */
async function handleAudioMessage(chatId: string, messageId: string, message: any) {
    try {
        // Parse message content
        const content = JSON.parse(message.content);
        const fileKey = content.file_key;

        console.log('Audio message, key:', fileKey);

        // Send acknowledgment
        await sendTextMessage(
            chatId,
            '音声から請求書情報を解析中...',
            messageId
        );

        // Download audio
        const { downloadFile } = await import('@/lib/lark');
        const audioBuffer = await downloadFile(fileKey);

        // Extract invoice data using Gemini Audio API
        const { extractInvoiceFromAudio } = await import('@/lib/gemini');
        const invoiceData = await extractInvoiceFromAudio(audioBuffer, 'audio/mpeg');

        // Save to database
        const { createInvoiceDraft } = await import('@/lib/invoice');
        const invoiceId = await createInvoiceDraft(chatId, messageId, invoiceData);

        // Generate edit URL
        const editUrl = `${process.env.BETTER_AUTH_URL}/invoice/${invoiceId}`;

        // Send response with edit link
        await sendTextMessage(
            chatId,
            `音声から請求書の下書きを作成しました！\n\n以下のURLから編集できます:\n${editUrl}`,
            messageId
        );
    } catch (error) {
        console.error('Error handling audio message:', error);
        await sendTextMessage(
            chatId,
            `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            messageId
        );
    }
}
