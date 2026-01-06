/**
 * Issuer Pattern Management
 * 
 * Manages multiple issuer information patterns
 */

export interface IssuerInfo {
    name: string;
    company: string;
    address: string;
    postalCode: string;
    phone: string;
    email: string;
    bankInfo: string;
}

/**
 * Get issuer pattern by number (1 or 2)
 */
export function getIssuerPattern(patternNumber: number): IssuerInfo {
    if (patternNumber === 1) {
        return {
            name: process.env.DEFAULT_ISSUER_1_NAME || '',
            company: process.env.DEFAULT_ISSUER_1_COMPANY || '',
            address: process.env.DEFAULT_ISSUER_1_ADDRESS || '',
            postalCode: process.env.DEFAULT_ISSUER_1_POSTAL_CODE || '',
            phone: process.env.DEFAULT_ISSUER_1_PHONE || '',
            email: process.env.DEFAULT_ISSUER_1_EMAIL || '',
            bankInfo: process.env.DEFAULT_ISSUER_1_BANK_INFO || '',
        };
    } else {
        return {
            name: process.env.DEFAULT_ISSUER_2_NAME || '',
            company: process.env.DEFAULT_ISSUER_2_COMPANY || '',
            address: process.env.DEFAULT_ISSUER_2_ADDRESS || '',
            postalCode: process.env.DEFAULT_ISSUER_2_POSTAL_CODE || '',
            phone: process.env.DEFAULT_ISSUER_2_PHONE || '',
            email: process.env.DEFAULT_ISSUER_2_EMAIL || '',
            bankInfo: process.env.DEFAULT_ISSUER_2_BANK_INFO || '',
        };
    }
}

/**
 * Get issuer selection message
 */
export function getIssuerSelectionMessage(): string {
    const pattern1 = getIssuerPattern(1);
    const pattern2 = getIssuerPattern(2);

    return `請求書の発行者情報を選択してください：

**パターン1**
名前: ${pattern1.name}
会社: ${pattern1.company}
住所: ${pattern1.address}
${pattern1.bankInfo}

**パターン2**
名前: ${pattern2.name}
会社: ${pattern2.company}
住所: ${pattern2.address}
${pattern2.bankInfo}

「1」または「2」を入力してください。`;
}
