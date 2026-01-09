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
        bankInfo?: string;
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
function getInvoiceExtractionPrompt(): string {
    return `あなたは請求書データ抽出の専門家です。以下の例を参考に、テキストから請求書情報をJSON形式で抽出してください。

【抽出例】
入力テキスト:
"""
請求先: 株式会社ABC
住所: 〒150-0042 東京都渋谷区宇田川町1-2-3
請求日: 2025年12月31日
支払期限: 2026年1月31日

明細:
| 品目 | 単価 | 数量 | 金額(税込) |
| コンサルティング費用 | ¥100,000 | 2 | ¥200,000 |
| システム開発費 | ¥50,000 | 3 | ¥150,000 |
| 合計 | | | ¥350,000 |
"""

出力JSON:
{
  "invoiceNumber": "",
  "issueDate": "2025-12-31",
  "dueDate": "2026-01-31",
  "recipient": {
    "name": "株式会社ABC",
    "address": "東京都渋谷区宇田川町1-2-3",
    "postalCode": "1500042"
  },
  "issuer": {
    "name": "",
    "company": "",
    "address": "",
    "postalCode": "",
    "phone": "",
    "email": "",
    "bankInfo": ""
  },
  "items": [
    {
      "description": "コンサルティング費用",
      "quantity": 2,
      "unitPrice": 90909,
      "amount": 181818
    },
    {
      "description": "システム開発費",
      "quantity": 3,
      "unitPrice": 45455,
      "amount": 136365
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "notes": ""
}

【重要ルール】
1. 表の各データ行を個別の明細として抽出（ヘッダー行と合計行は除外）
2. 税込金額は1.1で割って税抜に変換
3. 日付はYYYY-MM-DD形式に変換
4. 金額から¥や,を除去
5. マイナス金額も対応（例: -12000）
6. 発行者情報（issuer）は空のまま
7. 必ず有効なJSONのみ返す

それでは、以下のテキストから同じ形式でJSONを抽出してください:`;
}

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
    console.log('Gemini response length:', generatedText.length);
    console.log('Gemini response preview:', generatedText.substring(0, 200));

    // Remove markdown code blocks if present
    let cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to find JSON object
    let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

    // If no complete JSON found, try to extract from opening brace to end
    if (!jsonMatch) {
        const startIndex = cleanedText.indexOf('{');
        if (startIndex !== -1) {
            jsonMatch = [cleanedText.substring(startIndex)];
            console.log('Extracted incomplete JSON from position', startIndex);
        }
    }

    if (!jsonMatch) {
        console.error('Failed to extract JSON. Generated text:', generatedText);
        console.error('Cleaned text:', cleanedText);
        throw new Error('Failed to extract JSON from Gemini response');
    }

    let jsonString = jsonMatch[0];

    // Try to parse JSON with multiple fallback strategies
    const parseStrategies = [
        // Strategy 1: Parse as-is
        () => JSON.parse(jsonString),

        // Strategy 2: Remove trailing commas
        () => JSON.parse(jsonString.replace(/,([\s]*[}\]])/g, '$1')),

        // Strategy 3: Fix unterminated strings and add missing brackets
        () => {
            let fixed = jsonString
                .replace(/,([\s]*[}\]])/g, '$1'); // Remove trailing commas

            // Fix unterminated strings (add closing quote before newline or end)
            // This regex finds strings that start with " but don't have a closing "
            fixed = fixed.replace(/"([^"]*?)$/gm, '"$1"');

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

        // Strategy 4: More aggressive string fixing
        () => {
            let fixed = jsonString;

            // Remove trailing commas
            fixed = fixed.replace(/,([\s]*[}\]])/g, '$1');

            // Fix unterminated strings by adding closing quotes before newlines
            const lines = fixed.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Count quotes in the line
                const quoteCount = (line.match(/"/g) || []).length;
                // If odd number of quotes, add a closing quote at the end
                if (quoteCount % 2 !== 0 && !line.trim().endsWith('"')) {
                    lines[i] = line + '"';
                }
            }
            fixed = lines.join('\n');

            // Balance brackets
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
