import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { getLessBusyInvoiceBalance } from '@/lessbusy/utils/getLessBusyInvoiceBalance';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { LessBusyDescription, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';

type Invoice = ObjectRecord & { currency: string; totals: { totalMinor: string }; amountPaidMinor: string; amountCreditedMinor: string | null; amountRefundedMinor: string | null };
const CustomerSalesSummary = ({ customerId }: { customerId: string }) => {
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Invoice>({ objectNameSingular: 'lbInvoice', filter: { and: [{ customerId: { eq: customerId } }, { status: { in: ['FINALIZED', 'PART_PAID', 'PAID', 'CREDITED'] } }] }, limit: 50, orderBy: [{ finalizedAt: 'DescNullsLast' }], recordGqlFields: { id: true, currency: true, totals: true, amountPaidMinor: true, amountCreditedMinor: true, amountRefundedMinor: true } });
  const groups = new Map<string, { billed: bigint; credited: bigint; netReceived: bigint; outstanding: bigint; refundDue: bigint; invoices: number }>();
  for (const invoice of records) {
    const balance = getLessBusyInvoiceBalance({ totalMinor: invoice.totals.totalMinor, paidMinor: invoice.amountPaidMinor, creditedMinor: invoice.amountCreditedMinor, refundedMinor: invoice.amountRefundedMinor });
    const group = groups.get(invoice.currency) ?? { billed: 0n, credited: 0n, netReceived: 0n, outstanding: 0n, refundDue: 0n, invoices: 0 };
    group.billed += BigInt(invoice.totals.totalMinor); group.credited += BigInt(invoice.amountCreditedMinor ?? '0'); group.netReceived += BigInt(invoice.amountPaidMinor) - BigInt(invoice.amountRefundedMinor ?? '0'); group.outstanding += BigInt(balance.outstandingMinor) > 0n ? BigInt(balance.outstandingMinor) : 0n; group.refundDue += BigInt(balance.refundDueMinor); group.invoices++;
    groups.set(invoice.currency, group);
  }
  return <LessBusySection><h2>{t`Customer invoice balances`}</h2>{loading && <p role="status">{t`Loading invoice balances…`}</p>}{error ? <><p role="alert">{t`Invoice balances could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <>{hasNextPage && <LessBusyDescription>{t`Partial summary of loaded invoices. Load the remaining invoices for the full balance in your access.`}</LessBusyDescription>}{[...groups].map(([currency, group]) => <div key={currency}><h3>{currency} · {t`${group.invoices} invoices`}</h3><dl><dt>{t`Invoiced`}</dt><dd>{formatLessBusyMoney(group.billed.toString(), currency)}</dd><dt>{t`Credited`}</dt><dd>{formatLessBusyMoney(group.credited.toString(), currency)}</dd><dt>{t`Payments after refunds`}</dt><dd>{formatLessBusyMoney(group.netReceived.toString(), currency)}</dd><dt>{t`Still owed`}</dt><dd>{formatLessBusyMoney(group.outstanding.toString(), currency)}</dd><dt>{t`Refund due`}</dt><dd>{formatLessBusyMoney(group.refundDue.toString(), currency)}</dd></dl></div>)}{!loading && !records.length && <LessBusyDescription>{t`No finalized customer invoices are available in your access.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry disabled={loading} onClick={() => void fetchMoreRecords()}>{t`Load remaining invoices`}</LessBusyRetry>}</>}</LessBusySection>;
};

export const LessBusyCustomerSalesSummary = ({ customerId }: { customerId: string }) => {
  const access = useLessBusyObjectAccess('lbInvoice');
  return access.canReadFields('customerId', 'status', 'currency', 'totals', 'amountPaidMinor', 'amountCreditedMinor', 'amountRefundedMinor') ? <CustomerSalesSummary customerId={customerId} /> : null;
};
