/**
 * Conversation State Management
 * 
 * Manages conversation states for interactive flows
 */

import { db, query } from './db';
import { randomUUID } from 'crypto';

export interface ConversationState {
    id: string;
    chat_id: string;
    message_id: string;
    state: string;
    data: string; // JSON string
    created_at: number;
    expires_at: number;
}

/**
 * Create a new conversation state
 */
export async function createConversationState(
    chatId: string,
    messageId: string,
    state: string,
    data: any,
    expiresInMinutes: number = 30
): Promise<string> {
    const id = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (expiresInMinutes * 60);

    await db.execute({
        sql: `INSERT INTO conversation_states (id, chat_id, message_id, state, data, created_at, expires_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, chatId, messageId, state, JSON.stringify(data), now, expiresAt],
    });

    return id;
}

/**
 * Get conversation state by chat ID
 */
export async function getConversationStateByChatId(chatId: string): Promise<ConversationState | null> {
    const now = Math.floor(Date.now() / 1000);

    const results = await query<ConversationState>(
        `SELECT * FROM conversation_states 
         WHERE chat_id = ? AND expires_at > ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [chatId, now]
    );

    if (results.length === 0) {
        return null;
    }

    return results[0];
}

/**
 * Delete conversation state
 */
export async function deleteConversationState(id: string): Promise<void> {
    await db.execute({
        sql: 'DELETE FROM conversation_states WHERE id = ?',
        args: [id],
    });
}

/**
 * Delete expired conversation states
 */
export async function deleteExpiredConversationStates(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    await db.execute({
        sql: 'DELETE FROM conversation_states WHERE expires_at <= ?',
        args: [now],
    });
}
