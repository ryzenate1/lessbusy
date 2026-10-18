import { getLessBusyInvoiceBalance } from '@/lessbusy/utils/getLessBusyInvoiceBalance';
import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

const invoiceSchema = z.object({ id: z.string().uuid(), name: z.string(), currency: z.string().regex(/^[A-Z]{3}$/), dueAt: z.string().nullable(), amountPaidMinor: z.string().regex(/^\d+$/), amountCreditedMinor: z.string().nullable().optional(), amountRefundedMinor: z.string().nullable().optional(), totals: z.object({ totalMinor: z.string().regex(/^\d+$/) }) });
type UnpaidInvoice = ObjectRecord & z.infer<typeof invoiceSchema>;

export const LessBusyUnpaidInvoices = ({ compact = false }: { compact?: boolean }) => {
  const [overdueOnly, setOverdueOnly] = useState(compact);
  const [asOf, setAsOf] = useState(() => new Date().toISOString());
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<UnpaidInvoice>({
    objectNameSingular: 'lbInvoice',
    filter: { and: [{ status: { in: ['FINALIZED', 'PART_PAID'] } }, ...(overdueOnly ? [{ dueAt: { lt: asOf } }] : [])] },
    recordGqlFields: { id: true, name: true, currency: true, dueAt: true, amountPaidMinor: true, amountCreditedMinor: true, amountRefundedMinor: true, totals: true },
    orderBy: [{ dueAt: 'AscNullsLast' }, { id: 'AscNullsLast' }], limit: compact ? 5 : 25,
  });
  const parsed = z.array(invoiceSchema).safeParse(records);
  return <>
    {!compact && <LessBusyActions><LessBusyRetry aria-pressed={!overdueOnly} onClick={() => setOverdueOnly(false)}>{t`All unpaid`}</LessBusyRetry><LessBusyRetry aria-pressed={overdueOnly} onClick={() => { setAsOf(new Date().toISOString()); setOverdueOnly(true); }}>{t`Overdue only`}</LessBusyRetry></LessBusyActions>}
    {loading ? <p role="status">{t`Loading invoices…`}</p> : error ? <><p role="alert">{t`We could not load unpaid invoices.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : !parsed.success ? <LessBusyDescription>{t`Invoice balances are available when your role can read billing amounts and due dates.`}</LessBusyDescription> : parsed.data.length === 0 ? <LessBusyDescription>{overdueOnly ? t`No overdue invoices are available in your access.` : t`No unpaid finalized invoices are available in your access.`}</LessBusyDescription> : <LessBusyTaskList>{parsed.data.map((invoice) => {
      const outstanding = getLessBusyInvoiceBalance({ totalMinor: invoice.totals.totalMinor, paidMinor: invoice.amountPaidMinor, creditedMinor: invoice.amountCreditedMinor, refundedMinor: invoice.amountRefundedMinor }).outstandingMinor;
      return <li key={invoice.id}><LessBusyLink to={`/business/invoices/${invoice.id}`}>{invoice.name}</LessBusyLink><LessBusyDescription>{t`Outstanding`}: {formatLessBusyMoney(outstanding.toString(), invoice.currency)}{invoice.dueAt ? ` · ${t`Due`} ${new Date(invoice.dueAt).toLocaleDateString()}` : ` · ${t`No due date`}`}</LessBusyDescription></li>;
    })}</LessBusyTaskList>}
    {!compact && hasNextPage && !error && <LessBusyRetry disabled={loading} onClick={() => void fetchMoreRecords()}>{t`Load more invoices`}</LessBusyRetry>}
    {compact && <LessBusyLink to="/business/unpaid-invoices">{t`Review unpaid invoices`}</LessBusyLink>}
  </>;
};
