import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/lib/invoice';
import { InvoiceData } from '@/lib/gemini';
import InvoiceEditor from './InvoiceEditor';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: PageProps) {
    const { id } = await params;

    // Get invoice from database
    const invoice = await getInvoiceById(id);

    if (!invoice) {
        notFound();
    }

    // Parse invoice data
    const invoiceData: InvoiceData = JSON.parse(invoice.data);

    return <InvoiceEditor initialData={invoiceData} invoiceId={id} />;
}
