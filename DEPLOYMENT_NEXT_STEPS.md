# Vercelデプロイ - 次のステップ

## ✅ 完了したステップ

1. ✅ Gitリポジトリの初期化
2. ✅ GitHubへのプッシュ（https://github.com/ariomorio/lark-invoice-saas）

## 📋 次のステップ

### 1. Vercelでプロジェクトを作成

1. https://vercel.com にアクセスしてログイン
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリ「ariomorio/lark-invoice-saas」を選択
4. 「Import」をクリック

### 2. 環境変数を設定

**重要**: デプロイする前に、以下の環境変数を設定してください。

「Environment Variables」セクションで、以下を追加：

```
LARK_APP_ID=（あなたのLark App ID）
LARK_APP_SECRET=（あなたのLark App Secret）
BETTER_AUTH_SECRET=（ランダムな32文字以上の文字列）
BETTER_AUTH_URL=https://your-project.vercel.app
TURSO_DATABASE_URL=（あなたのTurso Database URL）
TURSO_AUTH_TOKEN=（あなたのTurso Auth Token）
GOOGLE_AI_API_KEY=（あなたのGemini API Key）
```

**発行者情報（オプション）**:
```
DEFAULT_ISSUER_1_NAME=
DEFAULT_ISSUER_1_COMPANY=
DEFAULT_ISSUER_1_ADDRESS=
DEFAULT_ISSUER_1_POSTAL_CODE=
DEFAULT_ISSUER_1_PHONE=
DEFAULT_ISSUER_1_EMAIL=
DEFAULT_ISSUER_1_BANK_INFO=

DEFAULT_ISSUER_2_NAME=
DEFAULT_ISSUER_2_COMPANY=
DEFAULT_ISSUER_2_ADDRESS=
DEFAULT_ISSUER_2_POSTAL_CODE=
DEFAULT_ISSUER_2_PHONE=
DEFAULT_ISSUER_2_EMAIL=
DEFAULT_ISSUER_2_BANK_INFO=
```

### 3. デプロイ

1. 「Deploy」ボタンをクリック
2. デプロイが完了するまで待機（約2-3分）
3. デプロイURLをコピー（例: `https://lark-invoice-saas-xxx.vercel.app`）

### 4. BETTER_AUTH_URLを更新

1. Vercelプロジェクトの「Settings」→「Environment Variables」
2. `BETTER_AUTH_URL`を編集
3. 値をデプロイURLに変更
4. 「Save」→「Deployments」→最新のデプロイで「Redeploy」

### 5. Lark Webhook URLを更新

1. Lark開発者コンソール（https://open.larksuite.com/app）
2. アプリを選択→「イベント購読」
3. Webhook URLを更新:
   ```
   https://your-vercel-url.vercel.app/api/lark/webhook
   ```
4. 「保存」をクリック

### 6. テスト

1. Larkグループチャットで画像を送信
2. 発行者選択の質問が表示されることを確認
3. 「1」または「2」を入力
4. 請求書URLが送信されることを確認

## 🔧 トラブルシューティング

問題が発生した場合は、`docs/vercel-deployment-guide.md`を参照してください。
