/**
 * Lark (Feishu) API Client
 * 
 * This module provides functions to interact with the Lark Open Platform API.
 * It handles authentication, message sending, and webhook verification.
 */

// Validate required environment variables
if (!process.env.LARK_APP_ID) {
    throw new Error('LARK_APP_ID environment variable is required');
}

if (!process.env.LARK_APP_SECRET) {
    throw new Error('LARK_APP_SECRET environment variable is required');
}

const LARK_APP_ID = process.env.LARK_APP_ID;
const LARK_APP_SECRET = process.env.LARK_APP_SECRET;

// Lark API endpoints
const LARK_API_BASE = 'https://open.feishu.cn/open-apis';

/**
 * Lark access token cache
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Lark tenant access token
 * 
 * @returns Access token for API calls
 */
export async function getLarkAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.token;
    }

    // Request new token
    const response = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            app_id: LARK_APP_ID,
            app_secret: LARK_APP_SECRET,
        }),
    });

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`Failed to get Lark access token: ${data.msg}`);
    }

    // Cache token (expires in 2 hours, we'll refresh 5 minutes early)
    cachedToken = {
        token: data.tenant_access_token,
        expiresAt: Date.now() + (data.expire - 300) * 1000,
    };

    return cachedToken.token;
}

/**
 * Send a text message to a Lark chat
 * 
 * @param chatId - Lark chat ID
 * @param text - Message text
 * @param messageId - Optional message ID to reply to
 * @returns Message send result
 */
export async function sendTextMessage(
    chatId: string,
    text: string,
    messageId?: string
): Promise<any> {
    const token = await getLarkAccessToken();

    const body: any = {
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text }),
    };

    // Add reply context if messageId provided
    if (messageId) {
        body.reply_message_id = messageId;
    }

    const response = await fetch(`${LARK_API_BASE}/im/v1/messages?receive_id_type=chat_id`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`Failed to send Lark message: ${data.msg}`);
    }

    return data.data;
}

/**
 * Send a file to a Lark chat
 * 
 * @param chatId - Lark chat ID
 * @param fileKey - Lark file key (from upload)
 * @param messageId - Optional message ID to reply to
 * @returns Message send result
 */
export async function sendFileMessage(
    chatId: string,
    fileKey: string,
    messageId?: string
): Promise<any> {
    const token = await getLarkAccessToken();

    const body: any = {
        receive_id: chatId,
        msg_type: 'file',
        content: JSON.stringify({ file_key: fileKey }),
    };

    if (messageId) {
        body.reply_message_id = messageId;
    }

    const response = await fetch(`${LARK_API_BASE}/im/v1/messages?receive_id_type=chat_id`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`Failed to send Lark file: ${data.msg}`);
    }

    return data.data;
}

/**
 * Upload a file to Lark
 * 
 * @param file - File buffer
 * @param fileName - File name
 * @param fileType - File type (e.g., 'pdf', 'image')
 * @returns File key for sending
 */
export async function uploadFile(
    file: Buffer,
    fileName: string,
    fileType: string
): Promise<string> {
    const token = await getLarkAccessToken();

    const formData = new FormData();
    formData.append('file_type', fileType);
    formData.append('file_name', fileName);
    formData.append('file', new Blob([file]), fileName);

    const response = await fetch(`${LARK_API_BASE}/im/v1/files`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`Failed to upload file to Lark: ${data.msg}`);
    }

    return data.data.file_key;
}

/**
 * Download a file from Lark
 * 
 * @param fileKey - Lark file key
 * @returns File buffer
 */
export async function downloadFile(fileKey: string): Promise<Buffer> {
    const token = await getLarkAccessToken();

    const response = await fetch(`${LARK_API_BASE}/im/v1/files/${fileKey}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to download file from Lark: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Download an image from Lark message
 * 
 * @param messageId - Lark message ID
 * @param imageKey - Lark image key
 * @returns Image buffer
 */
export async function downloadImage(messageId: string, imageKey: string): Promise<Buffer> {
    const token = await getLarkAccessToken();

    // Use the correct endpoint for downloading message resources
    const response = await fetch(
        `${LARK_API_BASE}/im/v1/messages/${messageId}/resources/${imageKey}?type=image`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Lark image download error:', errorText);
        throw new Error(`Failed to download image from Lark: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Get message content (for text, image, audio messages)
 * 
 * @param messageId - Lark message ID
 * @returns Message content
 */
export async function getMessageContent(messageId: string): Promise<any> {
    const token = await getLarkAccessToken();

    const response = await fetch(`${LARK_API_BASE}/im/v1/messages/${messageId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (data.code !== 0) {
        throw new Error(`Failed to get message content: ${data.msg}`);
    }

    return data.data;
}

/**
 * Verify Lark webhook request signature
 * 
 * @param timestamp - Request timestamp
 * @param nonce - Request nonce
 * @param encryptKey - Encrypt key from Lark app settings
 * @param body - Request body
 * @param signature - Signature to verify
 * @returns Whether signature is valid
 */
export function verifyWebhookSignature(
    timestamp: string,
    nonce: string,
    encryptKey: string,
    body: string,
    signature: string
): boolean {
    // Lark uses HMAC-SHA256 for signature verification
    const crypto = require('crypto');
    const message = `${timestamp}${nonce}${encryptKey}${body}`;
    const hash = crypto.createHmac('sha256', encryptKey).update(message).digest('hex');

    return hash === signature;
}

export default {
    getLarkAccessToken,
    sendTextMessage,
    sendFileMessage,
    uploadFile,
    downloadFile,
    downloadImage,
    getMessageContent,
    verifyWebhookSignature,
};
