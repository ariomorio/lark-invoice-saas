# Google Gemini API セットアップガイド

Google Gemini APIは、テキスト、画像、音声から請求書情報を抽出するために使用します。

## ステップ 1: Google AI Studioにアクセス

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス

2. Googleアカウントでログイン

## ステップ 2: APIキーの作成

1. **「Get API key」** または **「Create API key」** ボタンをクリック

2. プロジェクトを選択:
   - 既存のGoogle Cloud Projectがある場合は選択
   - ない場合は **「Create API key in new project」** を選択

3. APIキーが生成されます（例: `AIzaSyD...`）

4. **「Copy」** ボタンでAPIキーをコピー

> **重要**: APIキーは一度しか表示されないので、必ずコピーして安全な場所に保存してください

## ステップ 3: `.env.local`に追加

コピーしたAPIキーを`.env.local`ファイルに追加:

```env
# Google Gemini API
GOOGLE_AI_API_KEY=AIzaSyD...your-api-key-here
```

## ステップ 4: 開発サーバーを再起動

環境変数を読み込むために、開発サーバーを再起動:

```bash
# Ctrl+C で停止
npm run dev
```

## ステップ 5: 動作確認

開発サーバーが起動したら、エラーが出ないことを確認してください。

以下のようなログが表示されれば成功です:

```
✓ Ready in 1302ms
- Environments: .env.local
```

## 使用制限について

Google Gemini APIの無料枠:
- **Gemini 1.5 Flash**: 15 RPM (requests per minute)
- **Gemini 1.5 Pro**: 2 RPM

開発・テスト用には十分な制限です。

## 次のステップ

これで、すべての環境変数が設定されました！

次は、実際にLarkボットをテストしてみましょう：

1. Larkアプリを開く
2. ボットを検索（アプリ名で検索）
3. ボットとチャットを開始
4. テストメッセージを送信:
   ```
   宛先: 株式会社テスト
   品目: Webサイト制作
   金額: 100,000円
   ```

5. ボットが請求書の下書きURLを返信することを確認

## トラブルシューティング

### エラー: `GOOGLE_AI_API_KEY environment variable is required`

→ `.env.local`にAPIキーを追加したか確認
→ 開発サーバーを再起動したか確認

### エラー: `Gemini API error: API key not valid`

→ APIキーが正しくコピーされているか確認
→ Google AI Studioで新しいAPIキーを作成

### ボットが応答しない

→ ngrokが起動しているか確認
→ 開発サーバーのログを確認
→ Larkのイベントが正しく設定されているか確認
