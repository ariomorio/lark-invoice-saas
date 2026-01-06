export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="text-center space-y-6 p-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Lark AI 請求書作成 SaaS
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    音声・画像・テキストから請求書を自動作成
                </p>
                <div className="flex gap-4 justify-center mt-8">
                    <a
                        href="/api/auth/signin"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ログイン
                    </a>
                    <a
                        href="/api/auth/signup"
                        className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        新規登録
                    </a>
                </div>
                <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
                    <p>Phase 1: 環境構築完了 ✓</p>
                    <p className="mt-2">Next.js 15 + App Router | Turso | Better Auth</p>
                </div>
            </div>
        </div>
    );
}
