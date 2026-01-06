/**
 * Invoice PDF Send API Route
 * 
 * POST /api/invoice/[id]/send
 * Generates PDF and sends it to Lark (without Cloudflare R2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceById, completeInvoice } from '@/lib/invoice';
import { sendTextMessage } from '@/lib/lark';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Get invoice from database
        const invoice = await getInvoiceById(id);

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Parse invoice data
        const invoiceData = JSON.parse(invoice.data);

        // Generate PDF filename: 発行日_請求先名様.pdf
        const issueDate = invoiceData.issueDate || new Date().toISOString().split('T')[0];
        const recipientName = invoiceData.recipient?.name || '請求先';
        // Remove special characters from filename
        const sanitizedName = recipientName.replace(/[<>:"/\\|?*]/g, '_');
        const fileName = `${issueDate}_${sanitizedName}様.pdf`;

        // Generate PDF
        const { generateInvoicePDF } = await import('@/lib/pdf');
        const pdfBuffer = await generateInvoicePDF(invoiceData);

        // Upload PDF to Lark
        const { uploadFile, sendFileMessage } = await import('@/lib/lark');
        const fileKey = await uploadFile(pdfBuffer, fileName, 'pdf');

        // Send PDF to Lark chat
        await sendFileMessage(
            invoice.lark_chat_id,
            fileKey,
            invoice.lark_message_id || undefined
        );

        // Mark invoice as completed (using Lark file key as URL)
        await completeInvoice(id, `lark://file/${fileKey}`);

        // Send completion message
        await sendTextMessage(
            invoice.lark_chat_id,
            `請求書PDFを送信しました！\nファイル名: ${fileName}`,
            invoice.lark_message_id || undefined
        );

        return NextResponse.json({ success: true, message: 'PDF sent to Lark', fileName });
    } catch (error) {
        console.error('Error sending invoice:', error);
        return NextResponse.json(
            { error: 'Failed to send invoice', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
