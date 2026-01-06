# Lark AI 請求書作成 SaaS

Lark（チャットツール）上でユーザーと自然言語（音声・テキスト・画像）で対話し、請求書情報を自動抽出。Webブラウザ上で編集・確認を行った後、PDF化してLarkチャットに自動返信・保存するアプリケーション。

## 技術スタック

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes / Server Actions
- **Database**: Turso (SQLite based, Edge対応)
- **Auth**: Better Auth
- **Storage**: Cloudflare R2 (AWS S3互換)
- **AI**: Google Gemini API (マルチモーダル解析)
- **Integration**: Lark Open Platform
- **Deploy**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして、必要な値を設定してください。

```bash
cp .env.local.example .env.local
```

### 3. Turso データベースのセットアップ

```bash
# Turso CLI をインストール
winget install turso

# ログイン
turso auth login

# データベースを作成
turso db create lark-invoice-saas

# データベース URL を取得
turso db show lark-invoice-saas

# 認証トークンを作成
turso db tokens create lark-invoice-saas

# スキーマを適用
npm run db:push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## プロジェクト構成

```
.
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ
│   └── globals.css        # グローバルスタイル
├── lib/                   # ユーティリティとヘルパー
│   ├── db.ts             # Turso データベースクライアント
│   ├── auth.ts           # Better Auth 設定
│   └── auth-types.ts     # 認証関連の型定義
├── schema.sql            # データベーススキーマ
├── .env.local.example    # 環境変数テンプレート
└── package.json          # プロジェクト依存関係

```

## 開発フロー

詳細な実装タスクは `Implementation Tasks.md` を参照してください。

## ドキュメント

- [プロジェクト要件](Project%20Requirements%20Lark連携%20AI請求書作成.md)
- [実装タスク](Implementation%20Tasks.md)
- [Cursor AI ルール](Cursor%20AI%20Rules%20for%20This%20Project.md)

## ライセンス

Private
