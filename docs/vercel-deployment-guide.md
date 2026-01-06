# Vercelデプロイガイド

このガイドでは、Lark Invoice SaaSアプリケーションをVercelにデプロイする手順を説明します。

## 前提条件

- Vercelアカウント（https://vercel.com）
- GitHubアカウント
- プロジェクトがGitHubリポジトリにプッシュされていること
- Tursoデータベースが作成済み
- Gemini APIキーが取得済み
- Larkアプリが作成済み

## ステップ1: GitHubにプッシュ

まだプッシュしていない場合：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lark-invoice-saas.git
git push -u origin main
```

## ステップ2: Vercelプロジェクトの作成

1. https://vercel.com にアクセスしてログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を入力（例: `lark-invoice-saas`）
5. **まだデプロイしない**（環境変数を先に設定）

## ステップ3: 環境変数の設定

Vercelプロジェクトの設定画面で、以下の環境変数を追加：

### 必須の環境変数

```bash
# Lark API
LARK_APP_ID=cli_xxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxx

# Better Auth
BETTER_AUTH_SECRET=ランダムな文字列（32文字以上推奨）
BETTER_AUTH_URL=https://your-project.vercel.app

# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# Google Gemini API
GOOGLE_AI_API_KEY=your-gemini-api-key
```

### 発行者情報（オプション）

```bash
# パターン1
DEFAULT_ISSUER_1_NAME=山田太郎
DEFAULT_ISSUER_1_COMPANY=株式会社サンプル
DEFAULT_ISSUER_1_ADDRESS=〒150-0001 東京都渋谷区神宮前1-2-3
DEFAULT_ISSUER_1_POSTAL_CODE=150-0001
DEFAULT_ISSUER_1_PHONE=03-1234-5678
DEFAULT_ISSUER_1_EMAIL=yamada@example.com
DEFAULT_ISSUER_1_BANK_INFO=振込先: 三菱UFJ銀行 渋谷支店 普通 1234567

# パターン2
DEFAULT_ISSUER_2_NAME=佐藤花子
DEFAULT_ISSUER_2_COMPANY=合同会社テスト
DEFAULT_ISSUER_2_ADDRESS=〒100-0001 東京都千代田区千代田1-1-1
DEFAULT_ISSUER_2_POSTAL_CODE=100-0001
DEFAULT_ISSUER_2_PHONE=03-9876-5432
DEFAULT_ISSUER_2_EMAIL=sato@test.co.jp
DEFAULT_ISSUER_2_BANK_INFO=振込先: みずほ銀行 東京支店 普通 9876543
```

> **重要**: `BETTER_AUTH_URL`は後でVercelのデプロイURLに更新します

## ステップ4: デプロイ

1. 「Deploy」ボタンをクリック
2. デプロイが完了するまで待機（約2-3分）
3. デプロイURLをコピー（例: `https://lark-invoice-saas.vercel.app`）

## ステップ5: BETTER_AUTH_URLの更新

1. Vercelプロジェクトの「Settings」→「Environment Variables」
2. `BETTER_AUTH_URL`を編集
3. 値をデプロイURL（例: `https://lark-invoice-saas.vercel.app`）に変更
4. 「Save」をクリック
5. 「Deployments」タブに移動
6. 最新のデプロイの「...」→「Redeploy」をクリック

## ステップ6: Lark Webhook URLの更新

1. Lark開発者コンソール（https://open.larksuite.com/app）にアクセス
2. アプリを選択
3. 「イベント購読」→「イベント購読を追加」
4. Webhook URLを更新:
   ```
   https://your-project.vercel.app/api/lark/webhook
   ```
5. 「保存」をクリック

## ステップ7: 動作確認

1. Larkグループチャットでボットをメンション
2. 画像を送信してテスト
3. 発行者選択の質問が表示されることを確認
4. 「1」または「2」を入力
5. 請求書の編集URLが送信されることを確認
6. URLを開いて請求書が正しく表示されることを確認

## トラブルシューティング

### デプロイエラー

**エラー**: `Build failed`

**解決策**:
- Vercelのビルドログを確認
- `package.json`の`dependencies`にすべての必要なパッケージが含まれているか確認
- ローカルで`npm run build`を実行してエラーを確認

### Webhook接続エラー

**エラー**: Larkからメッセージが届かない

**解決策**:
1. Webhook URLが正しいか確認
2. Vercelのログを確認（「Deployments」→デプロイを選択→「Functions」タブ）
3. 環境変数が正しく設定されているか確認

### データベース接続エラー

**エラー**: `Failed to connect to database`

**解決策**:
1. `TURSO_DATABASE_URL`と`TURSO_AUTH_TOKEN`が正しいか確認
2. Tursoダッシュボードでデータベースが有効か確認
3. Tursoの接続制限を確認

### Gemini APIエラー

**エラー**: `API key not valid`

**解決策**:
1. `GOOGLE_AI_API_KEY`が正しいか確認
2. Google AI Studioでキーが有効か確認
3. APIキーの使用制限を確認

## 本番環境での注意事項

### セキュリティ

- `.env.local`ファイルは絶対にGitにコミットしない
- 環境変数はVercelの設定画面でのみ管理
- `BETTER_AUTH_SECRET`は強力なランダム文字列を使用

### パフォーマンス

- Gemini APIのレート制限に注意（無料枠: 20リクエスト/分）
- 必要に応じて有料プランへのアップグレードを検討

### モニタリング

- Vercelのログを定期的に確認
- エラーが発生した場合はすぐに対応

## 次のステップ

デプロイが成功したら：

1. 本番環境でテスト
2. ユーザーに共有
3. フィードバックを収集
4. 必要に応じて機能を追加

## サポート

問題が発生した場合：

- Vercelドキュメント: https://vercel.com/docs
- Larkドキュメント: https://open.larksuite.com/document
- Tursoドキュメント: https://docs.turso.tech
- Gemini APIドキュメント: https://ai.google.dev/docs
