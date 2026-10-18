import { getInvoiceSettlement } from 'src/modules/lessbusy/utils/get-invoice-settlement.util';
import { createElement } from 'react';
import { Document, Font, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { z } from 'zod';
import { type BusinessInvoice } from 'src/modules/lessbusy/types/business-records.type';
import { LIBERATION_SANS_REGULAR_BASE64, LIBERATION_SANS_BOLD_BASE64 } from 'src/engine/core-modules/dpa/pdf/fonts/liberation-sans.fonts';

let fontsRegistered = false;

export const renderInvoicePdf = async (invoice: Pick<BusinessInvoice, 'name' | 'customerId' | 'currency' | 'lines' | 'totals' | 'businessIdentity' | 'customerSnapshot' | 'status' | 'amountPaidMinor' | 'amountCreditedMinor' | 'amountRefundedMinor' | 'dueAt' | 'finalizedAt'>, options: { label?: 'INVOICE' | 'QUOTATION'; showPayments?: boolean; dueLabel?: string } = {}): Promise<Buffer> => {
  if (!fontsRegistered) {
    Font.register({ family: 'LessBusyInvoice', fonts: [
      { src: `data:font/ttf;base64,${LIBERATION_SANS_REGULAR_BASE64}`, fontWeight: 'normal' },
      { src: `data:font/ttf;base64,${LIBERATION_SANS_BOLD_BASE64}`, fontWeight: 'bold' },
    ] });
    fontsRegistered = true;
  }
  const identity = z.object({ locale: z.string().optional(), documentTemplate: z.string().optional(), documentNotes: z.string().optional(), legalName: z.string(), address: z.string(), taxIdentifiers: z.record(z.string(), z.string()).optional() }).parse(invoice.businessIdentity);
  const customer = z.object({ billingName: z.string().nullable().optional(), address: z.string().nullable().optional(), taxIdentifiers: z.record(z.string(), z.string()).optional(), name: z.union([z.string(), z.object({ firstName: z.string().optional(), lastName: z.string().optional() })]).nullable().optional() }).parse(invoice.customerSnapshot);
  const customerName = typeof customer.name === 'string' ? customer.name : [customer.name?.firstName, customer.name?.lastName].filter(Boolean).join(' ');
  const lines = z.array(z.object({ description: z.string(), quantity: z.number(), unitAmountMinor: z.string(), discountMinor: z.string(), taxMinor: z.string(), totalMinor: z.string() })).parse(invoice.lines);
  const decimals = new Intl.NumberFormat('en', { style: 'currency', currency: invoice.currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const money = (amount: string) => {
    const digits = BigInt(amount).toString().padStart(decimals + 1, '0');
    return `${invoice.currency} ${decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}` : digits}`;
  };
  const date = (value: string) => new Intl.DateTimeFormat(identity.locale || 'en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
  const label = options.label ?? 'INVOICE';
  const showPayments = options.showPayments !== false;
  const text = (content: string, style: Record<string, string | number> = {}) => createElement(Text, { style }, content);
  const row = (label: string, amount: string) => createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 } }, text(label), text(money(amount)));
  return renderToBuffer(createElement(Document, { title: invoice.name, author: identity.legalName },
    createElement(Page, { size: 'A4', style: { padding: 44, paddingBottom: 64, fontFamily: 'LessBusyInvoice', fontSize: 10, lineHeight: 1.5, color: '#20242b' } },
      ...(identity.documentTemplate === 'CLASSIC' ? [createElement(View, { style: { height: 5, backgroundColor: '#274760', marginBottom: 20 } })] : []),
      text(identity.legalName, { fontSize: 22, fontWeight: 'bold', marginBottom: 6 }),
      text(identity.address),
      ...Object.entries(identity.taxIdentifiers ?? {}).map(([key, value]) => text(`${key}: ${value}`)),
      createElement(View, { style: { marginTop: 28, marginBottom: 24 } }, text(invoice.status === 'CANCELLED' ? `CANCELLED ${label}` : label, { fontSize: 12, fontWeight: 'bold' }), text(invoice.name, { fontSize: 18 }), text(`Bill to: ${customer.billingName || customerName || invoice.customerId}`), ...(customer.address ? [text(customer.address)] : []), ...Object.entries(customer.taxIdentifiers ?? {}).map(([key, value]) => text(`${key}: ${value}`)), text(`Issued: ${invoice.finalizedAt ? date(invoice.finalizedAt) : ''}`), ...(invoice.dueAt ? [text(`${options.dueLabel ?? 'Due'}: ${date(invoice.dueAt)}`)] : [])),
      createElement(View, { style: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 10, fontWeight: 'bold' } }, text('Description', { width: '50%' }), text('Qty', { width: '10%' }), text('Unit price', { width: '20%' }), text('Total', { width: '20%', textAlign: 'right' })),
      ...lines.map((line, index) => createElement(View, { key: String(index), wrap: false, style: { flexDirection: 'row', padding: 10, borderBottom: '1px solid #e5e7eb' } }, text(line.description, { width: '50%', paddingRight: 8 }), text(String(line.quantity), { width: '10%' }), text(money(line.unitAmountMinor), { width: '20%' }), text(money(line.totalMinor), { width: '20%', textAlign: 'right' }))),
      createElement(View, { wrap: false, style: { marginTop: 24, marginLeft: '45%' } }, row('Subtotal', invoice.totals.subtotalMinor), row('Discount', invoice.totals.discountMinor), row('Tax', invoice.totals.taxMinor), row('Total', invoice.totals.totalMinor), ...(showPayments ? [row('Paid', invoice.amountPaidMinor), row('Credited', invoice.amountCreditedMinor ?? '0'), row('Refunded', invoice.amountRefundedMinor ?? '0'), row(getInvoiceSettlement(invoice).refundDue > BigInt(0) ? 'Refund due' : 'Outstanding', (getInvoiceSettlement(invoice).outstanding < BigInt(0) ? getInvoiceSettlement(invoice).refundDue : getInvoiceSettlement(invoice).outstanding).toString())] : [])),
      ...(identity.documentNotes ? [text(identity.documentNotes, { marginTop: 28, color: '#4b5563' })] : []),
      text('Created with LessBusy', { position: 'absolute', bottom: 28, left: 44, color: '#6b7280', fontSize: 8 }),
    ),
  ));
};
