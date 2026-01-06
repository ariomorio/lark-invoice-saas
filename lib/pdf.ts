/**
 * PDF Generation Module
 * 
 * This module generates PDF invoices using Puppeteer.
 */

import puppeteer from 'puppeteer';
import { InvoiceData } from './gemini';

/**
 * Format currency for display
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

/**
 * Generate invoice HTML
 */
function generateInvoiceHTML(data: InvoiceData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>請求書</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 16px;
      margin-bottom: 32px;
    }
    
    .title {
      font-size: 32pt;
      font-weight: bold;
    }
    
    .header-info {
      text-align: right;
      font-size: 10pt;
    }
    
    .main-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    
    .recipient {
      flex: 1;
    }
    
    .recipient-name {
      font-size: 18pt;
      font-weight: bold;
      border-bottom: 1px solid #1f2937;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    
    .amount-box {
      margin-top: 24px;
      padding: 16px;
      background-color: #f9fafb;
      border: 1px solid #d1d5db;
      border-radius: 4px;
    }
    
    .amount-label {
      font-size: 10pt;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .amount-value {
      font-size: 24pt;
      font-weight: bold;
      text-align: right;
    }
    
    .issuer {
      flex: 1;
      text-align: right;
      font-size: 10pt;
    }
    
    .issuer-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    
    thead {
      background-color: #1f2937;
      color: white;
    }
    
    th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
    }
    
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    
    .summary-table {
      width: 300px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 10pt;
    }
    
    .summary-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 14pt;
      font-weight: bold;
      border-top: 2px solid #1f2937;
    }
    
    .notes {
      font-size: 10pt;
      margin-top: 32px;
    }
    
    .notes-title {
      font-weight: bold;
      border-bottom: 1px solid #9ca3af;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="title">御請求書</div>
      <div class="header-info">
        ${data.invoiceNumber ? `<div><strong>No.</strong> ${data.invoiceNumber}</div>` : '<div><strong>No.</strong></div>'}
        <div><strong>発行日:</strong> ${data.issueDate}</div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Recipient -->
      <div class="recipient">
        <div class="recipient-name">${data.recipient.name} 御中</div>
        ${data.recipient.address ? `<div>${data.recipient.postalCode || ''} ${data.recipient.address}</div>` : ''}
        
        <div class="amount-box">
          <div class="amount-label">ご請求金額 (税込)</div>
          <div class="amount-value">${formatCurrency(data.total)}</div>
          ${data.dueDate ? `<div style="margin-top: 12px; font-size: 10pt;"><strong>お支払期限:</strong> ${data.dueDate}</div>` : ''}
        </div>
      </div>
      
      <!-- Issuer -->
      <div class="issuer">
        <div class="issuer-name">${data.issuer.name}</div>
        ${data.issuer.postalCode ? `<div>${data.issuer.postalCode}</div>` : ''}
        ${data.issuer.address ? `<div>${data.issuer.address}</div>` : ''}
        ${data.issuer.phone ? `<div>TEL: ${data.issuer.phone}</div>` : ''}
        ${data.issuer.email ? `<div>Email: ${data.issuer.email}</div>` : ''}
        ${data.issuer.bankInfo ? `<div style="margin-top: 8px; white-space: pre-line;">${data.issuer.bankInfo}</div>` : ''}
      </div>
    </div>
    
    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 45%;">品名 / 明細</th>
          <th style="width: 15%; text-align: center;">数量</th>
          <th style="width: 20%; text-align: right;">単価</th>
          <th style="width: 20%; text-align: right;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
    
    <!-- Summary -->
    <div class="summary">
      <div class="summary-table">
        <div class="summary-row">
          <span>小計 (税抜)</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>消費税 (10%)</span>
          <span>${formatCurrency(data.tax)}</span>
        </div>
        <div class="summary-total">
          <span>合計金額 (税込)</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
      </div>
    </div>
    
    <!-- Notes -->
    ${data.notes ? `
    <div class="notes">
      <div class="notes-title">備考</div>
      <div>${data.notes.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF from invoice data
 * 
 * @param invoiceData - Invoice data
 * @returns PDF buffer
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  let browser;

  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Generate HTML
    const html = generateInvoiceHTML(invoiceData);

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default {
  generateInvoicePDF,
};
