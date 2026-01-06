import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Lark AI 請求書作成 SaaS',
    description: 'Lark連携で音声・画像・テキストから請求書を自動作成',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
