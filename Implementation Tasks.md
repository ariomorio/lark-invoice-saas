Implementation Tasks

Phase 1: 初期設定と環境構築

[ ] Next.js (App Router) プロジェクトのセットアップ

[ ] Tailwind CSS, Lucide React の導入

[ ] Turso (Database) のセットアップと接続設定

[ ] Better Auth の導入と認証スキーマの定義

[ ] requirements.md に基づくDBスキーマ (schema.sql or ORM definition) の作成

Phase 2: Lark連携基盤の実装 (Webhook)

[ ] Lark Developers でアプリ作成 (App ID, Secret取得)

[ ] パブリックURLの確保 (ngrok または Vercel Dev URL)

[ ] POST /api/lark/webhook エンドポイントの実装

[ ] URL Verification (Larkの仕様準拠)

[ ] イベント受信処理 (Message Receive)

[ ] Larkへのメッセージ送信関数の実装 (Text, File)

Phase 3: AI解析とデータ処理 (Gemini API)

[ ] Google AI Studio で API Key 取得

[ ] Gemini API 連携関数の実装

[ ] テキストからのJSON抽出プロンプト設計

[ ] 画像 (Vision) からのJSON抽出

[ ] 音声 (Audio) からのテキスト変換・抽出

[ ] 抽出データを Turso に保存するロジックの実装

Phase 4: フロントエンド (請求書編集画面)

[ ] 既存の React Invoice Component (InvoiceGeneratorMobile.jsx ベース) の移植

[ ] Dynamic Route /invoice/[id] の作成

[ ] DBから初期データを fetch して表示する処理

[ ] 編集内容を DB に update する Server Action

[ ] 「PDF送信」ボタンの UI 実装

Phase 5: PDF生成とストレージ (Cloudflare R2)

[ ] Cloudflare R2 バケット作成とAPIキー設定

[ ] PDF生成ロジックの実装 (Puppeteer または html2pdf.js + Server Action)

[ ] 生成PDFの R2 アップロード処理

[ ] R2 の URL (またはファイル実体) を Lark API 経由で返信する処理

Phase 6: デプロイと仕上げ

[ ] Vercel へのデプロイ設定

[ ] 環境変数 (Env Vars) の Vercel への登録

[ ] 本番用 Lark Webhook URL の更新

[ ] 動作テスト (音声・画像・テキスト)

(Optional) Phase 7: SaaS化機能 (Polar)

[ ] Polar アカウント設定

[ ] Webhook 設定とサブスクリプション状態の管理