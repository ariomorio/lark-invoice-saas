Project Requirements: Lark連携 AI請求書作成 SaaS

1. プロジェクト概要

Lark（チャットツール）上でユーザーと自然言語（音声・テキスト・画像）で対話し、請求書情報を自動抽出。Webブラウザ上で編集・確認を行った後、PDF化してLarkチャットに自動返信・保存するアプリケーション。
「バイブコーディング（AI駆動開発）」手法を用い、ドキュメント駆動で開発を進める。

2. 技術スタック (Modern & Personal Dev Friendly)

Editor: Cursor (AI Editor) - バイブコーディング実践

Frontend: Next.js 15 (App Router), React, Tailwind CSS, Lucide React

Backend: Next.js API Routes (Serverless) / Server Actions

Database: Turso (SQLite based, Edge対応)

Auth: Better Auth (NextAuth代替, 軽量)

Storage: Cloudflare R2 (AWS S3互換, 転送量無料) - PDFおよび解析画像の保存

AI: Google Gemini API (Gemini 1.5 Pro/Flash) - マルチモーダル（画像・音声・テキスト）解析に使用

Integration: Lark Open Platform (Webhook, Message API)

Payment: Polar (将来的なSaaS化を見据えた決済基盤, MCP対応) ※今回は基盤のみ考慮

Deploy: Vercel

3. ユーザー体験 (UX Flow)

Capture (Lark):

ユーザーがLarkでボットに「請求書作成」と話しかける、または「領収書画像」を送信する。

ボイスメッセージ（音声）で「宛先は株式会社〇〇、金額は...」と指示する場合もある。

Process (AI & Server):

Lark Webhookがイベントを受信。

Gemini APIが画像・音声を解析し、JSONデータ（宛名, 品目, 金額, 日付等）を抽出。

Turso DBにドラフトデータを作成し、編集用の一意なURLを発行。

Edit (Web App):

ボットが「下書きを作成しました。こちらで確認・編集してください: [URL]」と返信。

ユーザーはWeb画面（Next.js）で内容を微修正。

Complete (PDF & Store):

Web画面で「PDF発行して送信」ボタンを押下。

サーバーサイドでPDF生成 -> Cloudflare R2へアップロード。

ボットがLarkチャットにPDFファイルを送信。

4. データモデル (Turso Schema Idea)

users: アプリ利用者（Better Auth管理）

invoices:

id: UUID

lark_chat_id: String (Larkの返信先)

lark_message_id: String (スレッドID)

status: 'draft' | 'completed'

data: JSON (請求書の中身)

pdf_url: String (R2のURL)

created_at: DateTime

5. 開発ルール

ドキュメント駆動: 実装前に必ず tasks.md を確認・更新する。

エラー駆動: エラーログはそのままAIに読み込ませて修正案を出させる。

MCP活用: 可能な限りCursorのMCP機能（Turso, Polar等）を活用して外部リソースを操作する。