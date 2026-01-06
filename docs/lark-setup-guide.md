# Lark アプリケーション セットアップガイド

このガイドでは、Lark（Feishu）でアプリケーションを作成し、Webhookを設定する手順を説明します。

## 前提条件

- Larkアカウント（個人または企業）
- 開発環境でアプリケーションが起動していること

## ステップ 1: Lark Developers でアプリを作成

1. [Lark Open Platform](https://open.feishu.cn/app) にアクセスしてログイン

2. **「アプリを作成」** をクリック

3. アプリ情報を入力:
   - **アプリ名**: `AI請求書作成アシスタント`
   - **アプリの説明**: `音声・画像・テキストから請求書を自動作成`
   - **アイコン**: 任意の画像をアップロード

4. アプリを作成後、**App ID** と **App Secret** を取得:
   - 左メニューの **「認証情報」** をクリック
   - `App ID` と `App Secret` をコピー
   - `.env.local` ファイルに以下を追加:
     ```
     LARK_APP_ID=cli_a9d16a897438de1c
     LARK_APP_SECRET=5kZEh5pUNOVV9DcjEozCKFOt5pCrpJNa
     ```

## ステップ 2: 権限の設定

1. 左メニューの **「権限管理」** をクリック

2. 以下の権限を有効化:
   - **メッセージと会話** セクション:
     - `im:message` - メッセージの読み取り（readonly）
     - `im:message:send_as_bot` - ボットとしてメッセージ送信
   - **ドライブ** セクション:
     - `drive:drive` - ファイルのアップロード・ダウンロード

3. **「保存」** をクリック

> **注意**: 
> - 一部の権限は読み取り専用（readonly）として表示されます。これは正常な動作です。
> - `im:file:download`や`im:file:upload`が見つからない場合は、`drive:drive`を使用してください。これで同等の機能が利用できます。

## ステップ 3: パブリックURLの確保

開発環境でWebhookをテストするには、パブリックURLが必要です。

### オプション A: ngrok を使用（推奨）

1. [ngrok](https://ngrok.com/) をダウンロードしてインストール

2. ローカルサーバーを起動:
   ```bash
   npm run dev
   ```

3. 別のターミナルでngrokを起動:
   ```bash
   ngrok http 3000
   ```

4. ngrokが表示するHTTPS URLをコピー（例: `https://abc123.ngrok.io`）

### オプション B: Vercel Dev URL を使用

1. Vercelにデプロイ:
   ```bash
   vercel
   ```

2. Vercelが提供するプレビューURLを使用

## ステップ 4: Webhook の設定

1. Lark Developers の左メニューで **「Events and callbacks」**（イベントとコールバック）をクリック

2. **「Event Configuration」** タブを選択（デフォルトで選択されています）

3. **「Subscription mode」** セクションで:
   - **「Send notifications to developer's server」** が選択されていることを確認

4. **「Request URL」** フィールドに以下を入力:
   ```
   https://your-public-url/api/lark/webhook
   ```
   - 例: `https://abc123.ngrok.io/api/lark/webhook`
   - ngrokを使用している場合は、ngrokが表示したHTTPS URLを使用してください

5. **「Save」** ボタンをクリック
   - アプリケーションが正しく起動していれば、Larkが自動的にURLを検証します
   - 検証が成功すると、URLが保存されます

6. **「Events added」** セクションの **「Add Events」** ボタンをクリック

7. イベント追加画面で以下を検索して追加:
   - **「Receive message」** または **「im.message.receive_v1」** を検索
   - チェックボックスをオンにして選択
   - **「Confirm」** または **「OK」** をクリック

8. イベントが追加されたことを確認:
   - 「Events added」セクションに「im.message.receive_v1」が表示されます
   - 「Required scopes」列に必要な権限が表示されます

9. 最後に **「Save」** ボタンをクリックして設定を保存

> **重要**: 
> - Request URLを保存する前に、必ず `npm run dev` でアプリケーションを起動してください
> - ngrokも起動している必要があります
> - URLの検証が失敗する場合は、アプリケーションのログを確認してください

## ステップ 5: ボットを有効化

1. 左メニューの **「ボット」** をクリック

2. **「ボットを有効化」** をクリック

3. ボット機能を設定:
   - **メッセージカード**: 有効
   - **グループチャット**: 有効
   - **個人チャット**: 有効

## ステップ 6: アプリを公開（テスト用）

1. 左メニューの **「Version Management & Release」**（バージョン管理と公開）をクリック

2. **「Create a version」** または **「Unreleased Features」** セクションを確認

3. **「Create Test Version」** または **「Apply for Release」** をクリック

4. バージョン情報を入力:
   - **Version number**: 1.0.0
   - **Update notes**: Initial test version

5. **「Availability」** セクションで:
   - **「Available to all members」** を選択
   - または、特定のユーザー/グループを追加

6. **「Save」** または **「Submit」** をクリック

> **注意**: テストバージョンは組織内のメンバーのみが利用できます。一般公開する場合は、正式リリースの申請が必要です。

## ステップ 7: ボットをテスト

1. Larkアプリを開く

2. ボットを検索して追加:
   - 検索バーでアプリ名を検索
   - ボットをクリックして会話を開始

3. テストメッセージを送信:
   - **テキスト**: `宛先: 株式会社テスト、品目: Webサイト制作、金額: 100,000円`
   - **画像**: 領収書や請求書の画像
   - **音声**: 請求書情報を読み上げた音声メッセージ

4. ボットが請求書の下書きURLを返信することを確認

## トラブルシューティング

### Webhook検証が失敗する

- アプリケーションが起動していることを確認
- ngrokが正しく動作していることを確認
- Webhook URLが正しいことを確認（`/api/lark/webhook`）

### メッセージが受信されない

- イベントサブスクリプションが有効になっていることを確認
- 権限が正しく設定されていることを確認
- ボットがテストバージョンとして公開されていることを確認

### エラーメッセージが返される

- `.env.local` の環境変数が正しく設定されていることを確認
- Gemini API キーが有効であることを確認
- Tursoデータベースが正しく設定されていることを確認

## 次のステップ

Webhookが正しく動作したら、Phase 4（フロントエンド実装）に進みます。
