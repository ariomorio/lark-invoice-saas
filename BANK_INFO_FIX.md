# 振込先情報とURLプレビュー問題の修正

## 問題1: 振込先情報が反映されない

### 原因
環境変数 `DEFAULT_ISSUER_1_BANK_INFO` と `DEFAULT_ISSUER_2_BANK_INFO` がVercelに設定されていない可能性があります。

### 解決方法

**Vercelの環境変数設定:**

1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. 以下の環境変数を追加してください:

```
DEFAULT_ISSUER_1_BANK_INFO=振込先: 三菱UFJ銀行 渋谷支店 普通 1234567 カ)サンプル
DEFAULT_ISSUER_2_BANK_INFO=振込先: みずほ銀行 東京支店 普通 9876543 ゴウドウガイシャテスト
```

3. 「Save」をクリック
4. 「Redeploy」をクリックして再デプロイ

**ローカル環境（`.env.local`）:**

`.env.local`ファイルに以下を追加してください:

```env
DEFAULT_ISSUER_1_BANK_INFO=振込先: 三菱UFJ銀行 渋谷支店 普通 1234567 カ)サンプル
DEFAULT_ISSUER_2_BANK_INFO=振込先: みずほ銀行 東京支店 普通 9876543 ゴウドウガイシャテスト
```

---

## 問題2: URLプレビュー時に処理が再実行される

### 原因
LarkがURLを含むメッセージを送信すると、自動的にURLプレビューのために再度メッセージイベントが発火します。これにより、ボットが同じURLを新しいメッセージとして処理してしまいます。

### 解決方法
URLのみのメッセージを無視するロジックを追加しました。

---

## 修正内容

### 1. Webhookハンドラーの修正
- URLのみのメッセージ（プレビュー）を無視するフィルターを追加

### 2. 環境変数の追加が必要
- `DEFAULT_ISSUER_1_BANK_INFO`
- `DEFAULT_ISSUER_2_BANK_INFO`

---

## 次のステップ

1. **Vercelで環境変数を設定**
2. **再デプロイ**
3. **Larkでテスト** - 振込先情報が表示されることを確認
