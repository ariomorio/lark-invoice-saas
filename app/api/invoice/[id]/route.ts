/**
 * Invoice Update API Route
 * 
 * PUT /api/invoice/[id]
 * Updates invoice data in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateInvoiceData } from '@/lib/invoice';
import { InvoiceData } from '@/lib/gemini';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const invoiceData: InvoiceData = await request.json();

        // Update invoice in database
        await updateInvoiceData(id, invoiceData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        );
    }
}
