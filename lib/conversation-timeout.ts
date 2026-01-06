/**
 * Conversation Timeout Handler
 * 
 * Checks for expired conversation states and notifies users
 */

import { db, query } from './db';
import { sendTextMessage } from './lark';

export interface ExpiredConversation {
    id: string;
    chat_id: string;
    message_id: string;
    state: string;
    expires_at: number;
}

// Track notified chats to avoid duplicate messages
const notifiedChats = new Set<string>();

/**
 * Check and handle expired conversations
 * Sends timeout message and deletes expired states
 */
export async function handleExpiredConversations(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    // Get expired conversations
    const expiredConversations = await query<ExpiredConversation>(
        `SELECT * FROM conversation_states WHERE expires_at <= ?`,
        [now]
    );

    if (expiredConversations.length === 0) {
        return;
    }

    // Group by chat_id to send only one message per chat
    const chatGroups = new Map<string, ExpiredConversation[]>();
    for (const conversation of expiredConversations) {
        if (!chatGroups.has(conversation.chat_id)) {
            chatGroups.set(conversation.chat_id, []);
        }
        chatGroups.get(conversation.chat_id)!.push(conversation);
    }

    // Notify users and delete expired states
    for (const [chatId, conversations] of chatGroups) {
        try {
            // Check if already notified this chat
            if (!notifiedChats.has(chatId)) {
                // Send timeout message once per chat
                await sendTextMessage(
                    chatId,
                    '⏱️ 一定時間操作がなかったため、処理を中断しました。\n\n新しく請求書を作成する場合は、再度メッセージを送信してください。',
                    conversations[0].message_id
                );

                // Mark as notified
                notifiedChats.add(chatId);

                // Remove from notified set after 5 minutes
                setTimeout(() => {
                    notifiedChats.delete(chatId);
                }, 5 * 60 * 1000);
            }

            // Delete all expired states for this chat
            for (const conversation of conversations) {
                await db.execute({
                    sql: 'DELETE FROM conversation_states WHERE id = ?',
                    args: [conversation.id],
                });
            }

            console.log(`Expired conversations cleaned up for chat ${chatId}: ${conversations.length} states`);
        } catch (error) {
            console.error(`Error handling expired conversations for chat ${chatId}:`, error);
        }
    }
}

/**
 * Start periodic cleanup of expired conversations
 * Runs every minute
 */
export function startConversationCleanup(): NodeJS.Timeout {
    const interval = setInterval(async () => {
        try {
            await handleExpiredConversations();
        } catch (error) {
            console.error('Error in conversation cleanup:', error);
        }
    }, 60000); // Check every minute

    return interval;
}
