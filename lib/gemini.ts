/**
 * Google Gemini API Client
 * 
 * This module provides functions to interact with Google Gemini API
 * for multimodal AI processing (text, image, audio).
 */

// Validate required environment variables
if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required');
}

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Invoice data structure extracted from AI
 */
export interface InvoiceData {
    // 請求書番号
    invoiceNumber?: string;

    // 発行日
    issueDate: string;

    // 支払期限
    dueDate?: string;

    // 宛先情報
    recipient: {
        name: string;
        address?: string;
        postalCode?: string;
    };

    // 発行者情報
    issuer: {
        name: string;
        address?: string;
        postalCode?: string;
        phone?: string;
        email?: string;
    };

    // 品目リスト
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
    }>;

    // 小計
    subtotal: number;

    // 消費税
    tax: number;

    // 合計金額
    total: number;

    // 備考
    notes?: string;
}


/**
 * Get default issuer information from environment variables
 */
function getDefaultIssuerInfo() {
    return {
        name: process.env.DEFAULT_ISSUER_NAME || '株式会社サンプル',
        address: process.env.DEFAULT_ISSUER_ADDRESS || '東京都渋谷区〇〇1-2-3',
        postalCode: process.env.DEFAULT_ISSUER_POSTAL_CODE || '150-0001',
        phone: process.env.DEFAULT_ISSUER_PHONE || '03-1234-5678',
        email: process.env.DEFAULT_ISSUER_EMAIL || 'info@example.com',
    };
}

/**
 * System prompt for invoice extraction
 */
const getInvoiceExtractionPrompt = () => {
    return `あなたは請求書作成アシスタントです。
ユーザーからの入力（テキスト、画像、音声）から請求書に必要な情報を抽出し、JSON形式で返してください。

必ず以下のJSON形式で返してください（他の説明は不要です）：

{
  "invoiceNumber": "請求書番号または空文字列",
  "issueDate": "YYYY-MM-DD形式の日付",
  "dueDate": "YYYY-MM-DD形式の日付または空文字列",
  "recipient": {
    "name": "宛先名",
    "address": "住所または空文字列",
    "postalCode": "郵便番号または空文字列"
  },
  "issuer": {
    "name": "",
    "address": "",
    "postalCode": "",
    "phone": "",
    "email": ""
  },
  "items": [
    {
      "description": "品目名",
      "quantity": 1,
      "unitPrice": 0,
      "amount": 0
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "notes": ""
}

重要な注意事項：
- 日付は必ずYYYY-MM-DD形式（例: 2023-10-27）
- 金額は数値型（カンマなし）
- 発行日が不明な場合は今日の日付
- 発行者情報（issuer）は必ず空文字列のまま
- 情報がない項目は空文字列または0
- 必ず有効なJSONのみを返す（説明文は不要）`;
};

/**
 * Extract invoice data from text using Gemini API
 * 
 * @param text - Input text
 * @returns Extracted invoice data
 */
export async function extractInvoiceFromText(text: string): Promise<InvoiceData> {
    const INVOICE_EXTRACTION_PROMPT = getInvoiceExtractionPrompt();

    const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: INVOICE_EXTRACTION_PROMPT },
                            { text: `\n\nユーザー入力:\n${text}` },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    // Extract JSON from response
    const generatedText = data.candidates[0].content.parts[0].text;
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Gemini response');
    }

    const invoiceData = JSON.parse(jsonMatch[0]);
    return invoiceData as InvoiceData;
}

/**
 * Extract invoice data from image using Gemini Vision API
 * 
 * @param imageBuffer - Image buffer
 * @param mimeType - Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns Extracted invoice data
 */
export async function extractInvoiceFromImage(
    imageBuffer: Buffer,
    mimeType: string
): Promise<InvoiceData> {
    const INVOICE_EXTRACTION_PROMPT = getInvoiceExtractionPrompt();
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: INVOICE_EXTRACTION_PROMPT },
                            {
                                text: '\n\n画像から請求書情報を抽出してください。',
                            },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64Image,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    // Remove markdown code blocks if present
    let cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to extract JSON object (may be incomplete)
    let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

    // If no complete JSON found, try to extract from opening brace to end
    if (!jsonMatch) {
        const startIndex = cleanedText.indexOf('{');
        if (startIndex !== -1) {
            jsonMatch = [cleanedText.substring(startIndex)];
            console.log('Extracted incomplete JSON, will attempt to fix');
        }
    }

    if (!jsonMatch) {
        console.error('Failed to extract JSON. Generated text:', generatedText);
        throw new Error('Failed to extract JSON from Gemini response');
    }

    let jsonString = jsonMatch[0];

    // Try to parse JSON with multiple fallback strategies
    const parseStrategies = [
        // Strategy 1: Parse as-is
        () => JSON.parse(jsonString),

        // Strategy 2: Remove trailing commas
        () => JSON.parse(jsonString.replace(/,(\s*[}\]])/g, '$1')),

        // Strategy 3: Fix unterminated strings and add missing brackets
        () => {
            let fixed = jsonString;

            // Fix unterminated strings (add closing quote before newline or end)
            fixed = fixed.replace(/"([^"]*?)$/gm, '"$1"');

            // Count opening and closing brackets
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;

            // Add missing closing brackets
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                fixed += ']';
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
                fixed += '}';
            }

            return JSON.parse(fixed);
        },

        // Strategy 4: Try to fix incomplete JSON by adding missing closing brackets
        () => {
            let fixed = jsonString;
            // Count opening and closing brackets
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;

            // Add missing closing brackets
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                fixed += ']';
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
                fixed += '}';
            }

            return JSON.parse(fixed);
        },

        // Strategy 5: Combine all fixes
        () => {
            let fixed = jsonString
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .replace(/"([^"]*?)$/gm, '"$1"'); // Fix unterminated strings

            // Add missing closing brackets
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;

            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                fixed += ']';
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
                fixed += '}';
            }

            return JSON.parse(fixed);
        },
    ];

    for (let i = 0; i < parseStrategies.length; i++) {
        try {
            const invoiceData = parseStrategies[i]();
            if (i > 0) {
                console.log(`JSON parsed successfully using strategy ${i + 1}`);
            }
            return invoiceData as InvoiceData;
        } catch (error) {
            if (i === parseStrategies.length - 1) {
                // All strategies failed
                console.error('JSON parse error:', error);
                console.error('Attempted to parse:', jsonString);
                console.error('Full generated text:', generatedText);
                throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            // Try next strategy
            continue;
        }
    }

    // This should never be reached
    throw new Error('Failed to parse JSON with all strategies');
}

/**
 * Extract invoice data from audio using Gemini Audio API
 * 
 * @param audioBuffer - Audio buffer
 * @param mimeType - Audio MIME type (e.g., 'audio/wav', 'audio/mp3')
 * @returns Extracted invoice data
 */
export async function extractInvoiceFromAudio(
    audioBuffer: Buffer,
    mimeType: string
): Promise<InvoiceData> {
    const INVOICE_EXTRACTION_PROMPT = getInvoiceExtractionPrompt();
    const base64Audio = audioBuffer.toString('base64');

    const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: INVOICE_EXTRACTION_PROMPT },
                            {
                                text: '\n\n音声メッセージから請求書情報を抽出してください。',
                            },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64Audio,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Gemini response');
    }

    const invoiceData = JSON.parse(jsonMatch[0]);
    return invoiceData as InvoiceData;
}

export default {
    extractInvoiceFromText,
    extractInvoiceFromImage,
    extractInvoiceFromAudio,
};
