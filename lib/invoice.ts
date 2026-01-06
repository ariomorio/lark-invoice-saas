/**
 * Invoice Database Operations
 * 
 * This module provides functions to manage invoices in the database.
 */

import { db, queryOne, execute } from './db';
import { InvoiceData } from './gemini';
import { randomUUID } from 'crypto';

/**
 * Invoice record in database
 */
export interface Invoice {
    id: string;
    user_id: string | null;
    lark_chat_id: string;
    lark_message_id: string | null;
    status: 'draft' | 'completed';
    data: string; // JSON string
    pdf_url: string | null;
    created_at: number;
    updated_at: number;
}

/**
 * Create a new invoice draft
 * 
 * @param larkChatId - Lark chat ID
 * @param larkMessageId - Lark message ID
 * @param invoiceData - Invoice data from AI extraction
 * @param userId - Optional user ID
 * @returns Created invoice ID
 */
export async function createInvoiceDraft(
    larkChatId: string,
    larkMessageId: string,
    invoiceData: InvoiceData,
    userId?: string
): Promise<string> {
    const id = randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Debug: Log the data being saved
    console.log('Creating invoice draft with data:', JSON.stringify(invoiceData, null, 2));

    await execute(
        `INSERT INTO invoices (id, user_id, lark_chat_id, lark_message_id, status, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
        [id, userId || null, larkChatId, larkMessageId, JSON.stringify(invoiceData), now, now]
    );

    console.log('Invoice draft created with ID:', id);

    return id;
}

/**
 * Get invoice by ID
 * 
 * @param id - Invoice ID
 * @returns Invoice record or null
 */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
    const invoice = await queryOne<Invoice>(
        'SELECT * FROM invoices WHERE id = ?',
        [id]
    );

    return invoice;
}

/**
 * Update invoice data
 * 
 * @param id - Invoice ID
 * @param invoiceData - Updated invoice data
 */
export async function updateInvoiceData(
    id: string,
    invoiceData: InvoiceData
): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    await execute(
        'UPDATE invoices SET data = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(invoiceData), now, id]
    );
}

/**
 * Mark invoice as completed and set PDF URL
 * 
 * @param id - Invoice ID
 * @param pdfUrl - PDF URL in R2 storage
 */
export async function completeInvoice(
    id: string,
    pdfUrl: string
): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    await execute(
        'UPDATE invoices SET status = \'completed\', pdf_url = ?, updated_at = ? WHERE id = ?',
        [pdfUrl, now, id]
    );
}

/**
 * Get invoices by Lark chat ID
 * 
 * @param larkChatId - Lark chat ID
 * @returns List of invoices
 */
export async function getInvoicesByChatId(larkChatId: string): Promise<Invoice[]> {
    const invoices = await db.execute({
        sql: 'SELECT * FROM invoices WHERE lark_chat_id = ? ORDER BY created_at DESC',
        args: [larkChatId],
    });

    return invoices.rows as unknown as Invoice[];
}

export default {
    createInvoiceDraft,
    getInvoiceById,
    updateInvoiceData,
    completeInvoice,
    getInvoicesByChatId,
};
