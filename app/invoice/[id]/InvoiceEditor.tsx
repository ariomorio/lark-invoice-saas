'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Loader2 } from 'lucide-react';
import { InvoiceData } from '@/lib/gemini';

// 日本の通貨フォーマット
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

interface InvoiceEditorProps {
    initialData: InvoiceData;
    invoiceId: string;
}

export default function InvoiceEditor({ initialData, invoiceId }: InvoiceEditorProps) {
    // 請求書データ
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: initialData.invoiceNumber || '',
        issueDate: initialData.issueDate,
        dueDate: initialData.dueDate || '',
        recipientName: initialData.recipient.name,
        recipientAddress: initialData.recipient.address || '',
        recipientPostalCode: initialData.recipient.postalCode || '',
        issuerName: initialData.issuer.name,
        issuerAddress: initialData.issuer.address || '',
        issuerPostalCode: initialData.issuer.postalCode || '',
        issuerPhone: initialData.issuer.phone || '',
        issuerEmail: initialData.issuer.email || '',
        issuerBankInfo: initialData.issuer.bankInfo || '',
        notes: initialData.notes || '',
    });

    // 明細データ
    const [items, setItems] = useState(initialData.items || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState('');

    // 計算ロジック（動的に更新）
    const [subtotal, setSubtotal] = useState(initialData.subtotal || 0);
    const [taxAmount, setTaxAmount] = useState(initialData.tax || 0);
    const [totalAmount, setTotalAmount] = useState(initialData.total || 0);

    // 明細が変更されたら合計を再計算
    useEffect(() => {
        if (!items || items.length === 0) {
            setSubtotal(0);
            setTaxAmount(0);
            setTotalAmount(0);
            return;
        }

        const newSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const newTax = Math.floor(newSubtotal * 0.1);
        const newTotal = newSubtotal + newTax;

        setSubtotal(newSubtotal);
        setTaxAmount(newTax);
        setTotalAmount(newTotal);
    }, [items]);

    // 入力ハンドラ
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [name]: value }));
    };

    // アイテム操作
    const handleItemChange = (index: number, field: keyof typeof items[0], value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // 金額を再計算
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // 保存ハンドラ
    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');

        try {
            // 更新されたデータを構築
            const updatedData: InvoiceData = {
                invoiceNumber: invoiceData.invoiceNumber,
                issueDate: invoiceData.issueDate,
                dueDate: invoiceData.dueDate,
                recipient: {
                    name: invoiceData.recipientName,
                    address: invoiceData.recipientAddress,
                    postalCode: invoiceData.recipientPostalCode,
                },
                issuer: {
                    name: invoiceData.issuerName,
                    address: invoiceData.issuerAddress,
                    postalCode: invoiceData.issuerPostalCode,
                    phone: invoiceData.issuerPhone,
                    email: invoiceData.issuerEmail,
                    bankInfo: invoiceData.issuerBankInfo,
                },
                items,
                subtotal,
                tax: taxAmount,
                total: totalAmount,
                notes: invoiceData.notes,
            };

            const response = await fetch(`/api/invoice/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) throw new Error('保存に失敗しました');

            setMessage('保存しました！');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    // PDF送信ハンドラ
    const handleSendPDF = async () => {
        setIsSending(true);
        setMessage('');

        try {
            // まず保存
            await handleSave();

            // PDF生成と送信
            const response = await fetch(`/api/invoice/${invoiceId}/send`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('送信に失敗しました');

            setMessage('PDFを生成してLarkに送信しました！');
        } catch (error) {
            setMessage('エラーが発生しました');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-4 px-2 md:py-8 md:px-4 font-sans text-gray-800">

            {/* コントロールパネル */}
            <div className="w-full md:max-w-[210mm] mx-auto mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-lg md:text-xl font-bold text-gray-700">請求書編集</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg shadow transition-colors font-bold"
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : null}
                        保存
                    </button>
                    <button
                        onClick={handleSendPDF}
                        disabled={isSending}
                        className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg shadow transition-colors font-bold"
                    >
                        {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        PDF送信
                    </button>
                </div>
            </div>

            {/* メッセージ表示 */}
            {message && (
                <div className="w-full md:max-w-[210mm] mx-auto mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                    {message}
                </div>
            )}

            {/* 請求書用紙エリア */}
            <div className="w-full md:max-w-[210mm] mx-auto bg-white shadow-lg md:shadow-xl p-4 md:p-10 min-h-[297mm]">

                {/* ヘッダー */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-gray-800 pb-4 mb-8 gap-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">御請求書</h2>
                    <div className="w-full md:w-auto text-right text-sm space-y-2 md:space-y-1">
                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <span className="font-semibold text-gray-600">No.</span>
                            <input
                                type="text"
                                name="invoiceNumber"
                                value={invoiceData.invoiceNumber}
                                onChange={handleInputChange}
                                className="text-right w-32 border-b border-gray-300 hover:border-blue-400 focus:border-blue-600 outline-none bg-transparent"
                            />
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <span className="font-semibold text-gray-600">発行日:</span>
                            <input
                                type="date"
                                name="issueDate"
                                value={invoiceData.issueDate}
                                onChange={handleInputChange}
                                className="text-right w-32 border-b border-gray-300 hover:border-blue-400 focus:border-blue-600 outline-none bg-transparent font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* 宛名と差出人エリア */}
                <div className="flex flex-col md:flex-row justify-between gap-8 mb-8 md:mb-12">

                    {/* 左側: 宛名 */}
                    <div className="flex-1 space-y-2">
                        <div className="border-b border-gray-800 pb-1">
                            <input
                                type="text"
                                name="recipientName"
                                value={invoiceData.recipientName}
                                onChange={handleInputChange}
                                placeholder="顧客名を入力"
                                className="text-xl md:text-2xl font-bold w-full bg-transparent hover:bg-gray-50 focus:bg-blue-50 outline-none rounded"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg whitespace-nowrap">御中</span>
                        </div>

                        {/* 請求金額ボックス */}
                        <div className="mt-6 md:mt-8 p-4 bg-gray-50 rounded border border-gray-200">
                            <div className="flex justify-between items-baseline border-b border-gray-400 pb-2 mb-2">
                                <span className="text-sm font-semibold text-gray-600">ご請求金額 (税込)</span>
                                <span className="text-2xl md:text-3xl font-bold">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="font-semibold text-gray-600">お支払期限:</span>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={invoiceData.dueDate}
                                    onChange={handleInputChange}
                                    className="bg-transparent border-b border-gray-300 outline-none text-right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 右側: 差出人 */}
                    <div className="flex-1 text-left md:text-right space-y-1 mt-4 md:mt-0">
                        <input
                            type="text"
                            name="issuerName"
                            value={invoiceData.issuerName}
                            onChange={handleInputChange}
                            className="text-lg md:text-xl font-bold w-full bg-transparent hover:bg-gray-50 focus:bg-blue-50 outline-none rounded text-left md:text-right"
                        />
                        <input
                            type="text"
                            name="issuerAddress"
                            value={invoiceData.issuerAddress}
                            onChange={handleInputChange}
                            className="text-sm w-full bg-transparent hover:bg-gray-50 focus:bg-blue-50 outline-none rounded text-left md:text-right"
                        />
                        <input
                            type="text"
                            name="issuerPhone"
                            value={invoiceData.issuerPhone}
                            onChange={handleInputChange}
                            placeholder="電話番号"
                            className="text-sm w-full bg-transparent hover:bg-gray-50 focus:bg-blue-50 outline-none rounded text-left md:text-right"
                        />
                        <input
                            type="email"
                            name="issuerEmail"
                            value={invoiceData.issuerEmail}
                            onChange={handleInputChange}
                            placeholder="メールアドレス"
                            className="text-sm w-full bg-transparent hover:bg-gray-50 focus:bg-blue-50 outline-none rounded text-left md:text-right"
                        />
                    </div>
                </div>

                {/* モバイル用 明細カード */}
                <div className="md:hidden space-y-4 mb-8">
                    <h3 className="font-bold text-gray-700 border-b pb-1">明細入力</h3>
                    {items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm relative">
                            <button
                                onClick={() => removeItem(index)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-2"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">品名</label>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="品名を入力"
                                        className="w-full bg-white p-2 rounded border border-gray-300 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1/3">
                                        <label className="text-xs text-gray-500 block mb-1">数量</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                            className="w-full bg-white p-2 rounded border border-gray-300 outline-none focus:border-blue-500 text-center"
                                        />
                                    </div>
                                    <div className="w-2/3">
                                        <label className="text-xs text-gray-500 block mb-1">単価</label>
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                                            className="w-full bg-white p-2 rounded border border-gray-300 outline-none focus:border-blue-500 text-right"
                                        />
                                    </div>
                                </div>
                                <div className="text-right pt-2 border-t border-gray-200">
                                    <span className="text-xs text-gray-500 mr-2">小計:</span>
                                    <span className="font-bold">{formatCurrency(item.amount)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addItem}
                        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <Plus size={18} />
                        明細を追加
                    </button>
                </div>

                {/* デスクトップ用 明細テーブル */}
                <div className="hidden md:block w-full">
                    <table className="w-full mb-8 border-collapse">
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="p-2 text-left w-[45%] rounded-l">品名 / 明細</th>
                                <th className="p-2 text-center w-[15%]">数量</th>
                                <th className="p-2 text-right w-[20%]">単価</th>
                                <th className="p-2 text-right w-[20%] rounded-r">金額</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200 group">
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            placeholder="品名を入力"
                                            className="w-full bg-transparent outline-none border-b border-transparent hover:border-blue-300 focus:border-blue-500 transition-colors"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                            className="w-full text-center bg-transparent outline-none border-b border-transparent hover:border-blue-300 focus:border-blue-500 transition-colors"
                                        />
                                    </td>
                                    <td className="p-2 text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            <span>¥</span>
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                                                className="w-24 text-right bg-transparent outline-none border-b border-transparent hover:border-blue-300 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2 text-right font-medium">
                                        {formatCurrency(item.amount)}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="削除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mb-8">
                        <button
                            onClick={addItem}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
                        >
                            <Plus size={18} />
                            明細行を追加
                        </button>
                    </div>
                </div>

                {/* 合計計算エリア */}
                <div className="flex flex-col md:flex-row justify-end mb-8 md:mb-12">
                    <div className="w-full md:w-1/2 max-w-xs space-y-2 ml-auto">
                        <div className="flex justify-between text-sm">
                            <span>小計 (税抜)</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span>消費税 (10%)</span>
                            <span>{formatCurrency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-2">
                            <span>合計金額 (税込)</span>
                            <span>{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* 備考・振込先 (PC/Mobile共通) */}
                {/* 備考・振込先 (PC/Mobile共通) - PDFのレイアウトに合わせて縦積みに変更 */}
                <div className="mt-4 space-y-4">
                    <h3 className="font-bold border-b border-gray-400 mb-2 pb-1 text-sm text-gray-600">備考</h3>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-bold">振込先情報</label>
                        <textarea
                            name="issuerBankInfo"
                            value={invoiceData.issuerBankInfo}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="振込先情報を入力してください"
                            className="w-full bg-transparent border border-gray-200 resize-none outline-none hover:bg-gray-50 focus:bg-blue-50 rounded text-sm p-2"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-bold">その他備考</label>
                        <textarea
                            name="notes"
                            value={invoiceData.notes}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="備考事項を入力してください"
                            className="w-full bg-transparent border border-gray-200 resize-none outline-none hover:bg-gray-50 focus:bg-blue-50 rounded text-sm p-2"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
