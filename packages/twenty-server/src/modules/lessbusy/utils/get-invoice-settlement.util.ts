import { type BusinessInvoice } from 'src/modules/lessbusy/types/business-records.type';

export const getInvoiceSettlement = (invoice: Pick<BusinessInvoice, 'totals' | 'amountPaidMinor' | 'amountCreditedMinor' | 'amountRefundedMinor'>) => {
  const total = BigInt(invoice.totals.totalMinor);
  const credited = BigInt(invoice.amountCreditedMinor ?? '0');
  const refunded = BigInt(invoice.amountRefundedMinor ?? '0');
  const paid = BigInt(invoice.amountPaidMinor);
  const receivable = total - credited;
  const netPaid = paid - refunded;
  const outstanding = receivable - netPaid;
  const refundDue = outstanding < BigInt(0) ? -outstanding : BigInt(0);
  const status = receivable === BigInt(0) && netPaid === BigInt(0) ? 'CREDITED' : outstanding <= BigInt(0) ? 'PAID' : netPaid > BigInt(0) ? 'PART_PAID' : 'FINALIZED';
  return { total, credited, refunded, paid, receivable, netPaid, outstanding, refundDue, status };
};
