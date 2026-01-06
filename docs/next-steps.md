# 次のステップ - ボットのテスト準備

Webhook設定が完了しました！次は、ボットを実際にテストするための準備を行います。

## 必要な環境変数の設定

現在、以下の環境変数が必要です：

### 1. Turso Database（必須）

請求書データを保存するために必要です。

**セットアップ手順:**

```bash
# Turso CLIをインストール（まだの場合）
winget install turso

# ログイン
turso auth login

# データベースを作成
turso db create lark-invoice-saas

# データベースURLを取得
turso db show lark-invoice-saas

# 認証トークンを作成
turso db tokens create lark-invoice-saas

# スキーマを適用
npm run db:push
```

取得した`TURSO_DATABASE_URL`と`TURSO_AUTH_TOKEN`を`.env.local`に追加してください。

### 2. Google Gemini API（必須）

AI解析のために必要です。

**セットアップ手順:**

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. **「Create API Key」** をクリック
3. APIキーをコピー
4. `.env.local`に`GOOGLE_AI_API_KEY`として追加

### 3. Cloudflare R2（オプション - Phase 5）

PDF保存のために必要ですが、後で設定可能です。

## 現在の`.env.local`に追加すべき内容

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# Google Gemini API
GOOGLE_AI_API_KEY=your-gemini-api-key
```

## テスト手順

環境変数を設定したら：

1. 開発サーバーを再起動（Ctrl+C → `npm run dev`）
2. Larkアプリでボットを検索
3. ボットとチャットを開始
4. テストメッセージを送信:
   ```
   宛先: 株式会社テスト
   品目: Webサイト制作
   金額: 100,000円
   ```

5. ボットが請求書の下書きURLを返信することを確認

## トラブルシューティング

### エラー: `TURSO_DATABASE_URL environment variable is required`

→ Tursoデータベースをセットアップして、`.env.local`に追加してください

### エラー: `GOOGLE_AI_API_KEY environment variable is required`

→ Google AI StudioでAPIキーを取得して、`.env.local`に追加してください

### ボットが応答しない

→ ngrokとNext.jsの開発サーバーが両方起動していることを確認してください
