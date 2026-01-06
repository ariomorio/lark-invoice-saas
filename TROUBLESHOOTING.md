# 振込先情報とPDF送信の問題について

## 問題1: 振込先情報が表示されない

### 確認事項
1. **Vercelの環境変数が正しく設定されているか**
   - `DEFAULT_ISSUER_1_BANK_INFO`
   - `DEFAULT_ISSUER_2_BANK_INFO`

2. **環境変数設定後に再デプロイしたか**
   - 環境変数を追加/変更した後は、必ず「Redeploy」が必要です

### デバッグ方法
Vercelのログで以下を確認してください：
```
Creating invoice with issuer info: { ... "bankInfo": "..." }
```

このログに`bankInfo`が含まれていない場合、環境変数が読み込まれていません。

---

## 問題2: PDF送信が動作しない

### 原因
Vercel環境では標準のPuppeteerが動作しません。Vercelのサーバーレス環境用に最適化された`@sparticuz/chromium`が必要です。

### 解決方法

#### 1. 依存関係の追加
```bash
npm install @sparticuz/chromium puppeteer-core
npm uninstall puppeteer
```

#### 2. `lib/pdf.ts`の修正
Puppeteerの代わりに`puppeteer-core`と`@sparticuz/chromium`を使用するように変更が必要です。

---

## 次のステップ

### 振込先情報
1. Vercelダッシュボード → Environment Variables で環境変数を確認
2. 値が正しく設定されていることを確認
3. 「Redeploy」を実行
4. Vercelのログで`Creating invoice with issuer info`を確認

### PDF送信
現在、Vercel環境では動作しません。修正が必要です。
ローカル環境（`npm run dev`）では正常に動作するはずです。

Vercel対応のPDF生成を実装する場合は、お知らせください。
