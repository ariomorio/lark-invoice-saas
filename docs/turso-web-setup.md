# Turso Database セットアップガイド（Web版）

Turso CLIのインストールが難しい場合は、Webブラウザから直接データベースを作成できます。

## ステップ 1: Tursoアカウントの作成

1. [Turso公式サイト](https://turso.tech/) にアクセス

2. **「Sign Up」** または **「Get Started」** をクリック

3. GitHubアカウントでサインアップ（推奨）

## ステップ 2: データベースの作成

1. ダッシュボードで **「Create Database」** をクリック

2. データベース情報を入力:
   - **Database name**: `lark-invoice-saas`
   - **Region**: Japan (Tokyo) または最寄りのリージョン

3. **「Create」** をクリック

## ステップ 3: 接続情報の取得

1. 作成したデータベースをクリック

2. **「Connection」** または **「Settings」** タブを開く

3. 以下の情報をコピー:
   - **Database URL**: `libsql://lark-invoice-saas-xxxxx.turso.io`
   - **Auth Token**: **「Create Token」** をクリックして生成

## ステップ 4: `.env.local`に追加

コピーした情報を`.env.local`ファイルに追加:

```env
# Turso Database
TURSO_DATABASE_URL=libsql://lark-invoice-saas-xxxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

## ステップ 5: スキーマの適用

### オプション A: Turso Web Console（推奨）

1. Tursoダッシュボードで **「SQL Console」** または **「Query」** タブを開く

2. `schema.sql`ファイルの内容をコピー

3. SQLコンソールに貼り付けて実行

### オプション B: Turso CLI（インストール済みの場合）

```bash
turso db shell lark-invoice-saas < schema.sql
```

### オプション C: npm スクリプト（Turso CLI必要）

```bash
npm run db:push
```

## ステップ 6: 接続テスト

開発サーバーを再起動して、接続をテスト:

```bash
# Ctrl+C で停止
npm run dev
```

エラーが出なければ、Tursoデータベースの接続が成功しています！

## トラブルシューティング

### エラー: `Failed to connect to database`

- Database URLが正しいか確認
- Auth Tokenが有効か確認
- `.env.local`ファイルを保存したか確認
- 開発サーバーを再起動したか確認

### SQLコンソールでエラーが出る

- `schema.sql`の内容を一つずつ実行してみる
- テーブルが既に存在する場合は、`DROP TABLE IF EXISTS`を先に実行

## 次のステップ

Tursoデータベースのセットアップが完了したら、次はGoogle Gemini APIキーを取得してください。

詳細は `docs/next-steps.md` を参照してください。
