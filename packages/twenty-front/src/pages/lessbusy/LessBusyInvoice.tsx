import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyInvoiceAdjustments } from '@/lessbusy/components/LessBusyInvoiceAdjustments';
import { getLessBusyInvoiceBalance } from '@/lessbusy/utils/getLessBusyInvoiceBalance';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { moneyToMinorUnits } from '@/lessbusy/utils/moneyToMinorUnits';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const invoiceSchema = z.object({ sourceDocumentId: z.string().uuid().nullable().optional(), sourceDocumentKind: z.string().nullable().optional(), id: z.string(), name: z.string(), currency: z.string(), version: z.number(), status: z.string(), amountPaidMinor: z.string(), amountCreditedMinor: z.string().nullable().optional(), amountRefundedMinor: z.string().nullable().optional(), dueAt: z.string().nullable(), lines: z.array(z.object({ description: z.string(), quantity: z.number(), totalMinor: z.string() })), totals: z.object({ subtotalMinor: z.string(), discountMinor: z.string(), taxMinor: z.string(), totalMinor: z.string() }), auditEvents: z.array(z.object({ action: z.string(), at: z.string() })).nullable().optional() });

const InvoiceDetails = ({ invoiceId }: { invoiceId: string }) => {
  const invoiceAccess = useLessBusyObjectAccess('lbInvoice');
  const paymentAccess = useLessBusyObjectAccess('lbPayment');
  const sequenceAccess = useLessBusyObjectAccess('lbNumberSequence');
  const profileAccess = useLessBusyObjectAccess('lbBusinessProfile');
  const canFinalize = invoiceAccess.canWrite && sequenceAccess.canWrite && profileAccess.canRead;
  const canRecordPayment = invoiceAccess.canWrite && paymentAccess.canWrite;
  const { record, loading, error: loadError, refetch } = useFindOneRecord({ objectNameSingular: 'lbInvoice', objectRecordId: invoiceId, recordGqlFields: { id: true, name: true, currency: true, version: true, status: true, amountPaidMinor: true, amountCreditedMinor: true, amountRefundedMinor: true, dueAt: true, lines: true, totals: true, auditEvents: true, sourceDocumentId: true, sourceDocumentKind: true } });
  const { request, pending, error } = useLessBusyApi();
  const [action, setAction] = useState<'finalize' | 'payment' | 'cancel' | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [paymentKey, setPaymentKey] = useState(() => crypto.randomUUID());
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString());
  const [notice, setNotice] = useState<string | null>(null);
  if (loading) return <p role="status">{t`Loading invoice…`}</p>;
  if (loadError) return <><p role="alert">{t`We could not load this invoice.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></>;
  const parsed = invoiceSchema.safeParse(record);
  if (!parsed.success) return <LessBusyDescription>{t`This invoice is unavailable, or your role does not grant access to all billing fields.`}</LessBusyDescription>;
  const invoice = parsed.data;
  const balance = getLessBusyInvoiceBalance({ totalMinor: invoice.totals.totalMinor, paidMinor: invoice.amountPaidMinor, creditedMinor: invoice.amountCreditedMinor, refundedMinor: invoice.amountRefundedMinor });
  const outstanding = BigInt(balance.outstandingMinor);
  const overdue = ['FINALIZED', 'PART_PAID'].includes(invoice.status) && invoice.dueAt && new Date(invoice.dueAt).getTime() < Date.now();
  const selectAction = (value: typeof action) => { setAction(value); setConfirmed(false); setNotice(null); };
  return <>
    <LessBusySection><h1>{invoice.name}</h1><LessBusyDescription>{invoice.status}{overdue ? ` · ${t`Overdue`}` : ''}</LessBusyDescription>
      {invoice.sourceDocumentId && <LessBusyLink to={`/business/orders/${invoice.sourceDocumentId}`}>{t`Open source order`}</LessBusyLink>}
      <LessBusyActions>
        {invoice.status === 'DRAFT' && invoiceAccess.canWrite && <LessBusyLink to={`/business/invoices/${invoice.id}/edit`}>{t`Edit draft`}</LessBusyLink>}
        {invoice.status === 'DRAFT' && canFinalize && <LessBusyRetry onClick={() => selectAction('finalize')}>{t`Finalize invoice`}</LessBusyRetry>}
        {['FINALIZED', 'PART_PAID'].includes(invoice.status) && canRecordPayment && <LessBusyRetry onClick={() => selectAction('payment')}>{t`Record payment`}</LessBusyRetry>}
        {invoiceAccess.canWrite && (invoice.status === 'DRAFT' || paymentAccess.canRead) && invoice.status !== 'CANCELLED' && BigInt(invoice.amountPaidMinor) === 0n && BigInt(invoice.amountCreditedMinor ?? '0') === 0n && <LessBusyRetry onClick={() => selectAction('cancel')}>{t`Cancel invoice`}</LessBusyRetry>}
        {invoice.status !== 'DRAFT' && <LessBusyLink to={`${REACT_APP_SERVER_BASE_URL}/app/lessbusy/invoices/${invoice.id}/pdf`} reloadDocument>{t`Download PDF`}</LessBusyLink>}
        {invoice.status !== 'DRAFT' && <LessBusyLink to={`${REACT_APP_SERVER_BASE_URL}/app/lessbusy/invoices/${invoice.id}/pdf?inline=true`} reloadDocument target="_blank" rel="noopener noreferrer">{t`Open printable PDF`}</LessBusyLink>}
      </LessBusyActions>
    </LessBusySection>
    {invoice.status === 'DRAFT' && !canFinalize && <LessBusySection><LessBusyDescription>{t`A billing manager can finalize this draft after reviewing business identity and invoice numbering.`}</LessBusyDescription></LessBusySection>}
    <LessBusySection><h2>{t`Items`}</h2><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left' }}>{t`Description`}</th><th>{t`Quantity`}</th><th style={{ textAlign: 'right' }}>{t`Total`}</th></tr></thead><tbody>{invoice.lines.map((line, index) => <tr key={index}><td style={{ padding: '12px 0' }}>{line.description}</td><td style={{ textAlign: 'center' }}>{line.quantity}</td><td style={{ textAlign: 'right' }}>{formatLessBusyMoney(line.totalMinor, invoice.currency)}</td></tr>)}</tbody></table></LessBusySection>
    <LessBusySection><dl><dt>{t`Subtotal`}</dt><dd>{formatLessBusyMoney(invoice.totals.subtotalMinor, invoice.currency)}</dd><dt>{t`Discount`}</dt><dd>{formatLessBusyMoney(invoice.totals.discountMinor, invoice.currency)}</dd><dt>{t`Tax`}</dt><dd>{formatLessBusyMoney(invoice.totals.taxMinor, invoice.currency)}</dd><dt>{t`Total`}</dt><dd>{formatLessBusyMoney(invoice.totals.totalMinor, invoice.currency)}</dd><dt>{t`Credited`}</dt><dd>{formatLessBusyMoney(invoice.amountCreditedMinor ?? '0', invoice.currency)}</dd><dt>{t`Refunded`}</dt><dd>{formatLessBusyMoney(invoice.amountRefundedMinor ?? '0', invoice.currency)}</dd><dt>{outstanding < 0n ? t`Refund due` : t`Outstanding`}</dt><dd>{formatLessBusyMoney(outstanding < 0n ? balance.refundDueMinor : balance.outstandingMinor, invoice.currency)}</dd></dl></LessBusySection>
    {action && <LessBusyForm onSubmit={async (event) => {
      event.preventDefault(); if (!confirmed || pending) return;
      try {
        if (action === 'payment') await request(`invoices/${invoice.id}/payments`, 'POST', { operationKey: paymentKey, confirmed: true, amountMinor: moneyToMinorUnits(amount, invoice.currency), method, reference, receivedAt });
        else await request(`invoices/${invoice.id}/${action}`, 'POST', { confirmed: true, expectedVersion: invoice.version, ...(action === 'cancel' ? { reason } : {}) });
        await refetch(); setAction(null); setConfirmed(false); setPaymentKey(crypto.randomUUID()); setReceivedAt(new Date().toISOString()); setNotice(t`Your change has been saved.`);
      } catch (failure) { setNotice(failure instanceof Error ? failure.message : t`Could not save the change.`); }
    }}>
      <h2>{action === 'payment' ? t`Record a received payment` : action === 'finalize' ? t`Review and finalize` : t`Cancel this invoice`}</h2>
      {action === 'finalize' && <LessBusyDescription>{t`Finalizing assigns an invoice number and freezes customer details, prices and business identity. These details cannot be edited afterwards.`}</LessBusyDescription>}
      {action === 'payment' && <><label>{t`Amount received`}<input required inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setConfirmed(false); setPaymentKey(crypto.randomUUID()); }} /></label><label>{t`Payment method`}<select value={method} onChange={(event) => { setMethod(event.target.value); setConfirmed(false); setPaymentKey(crypto.randomUUID()); }}><option value="BANK_TRANSFER">{t`Bank transfer`}</option><option value="CASH">{t`Cash`}</option><option value="CARD">{t`Card`}</option><option value="UPI">{t`UPI`}</option><option value="OTHER">{t`Other`}</option></select></label><label>{t`Reference`}<input maxLength={250} value={reference} onChange={(event) => { setReference(event.target.value); setConfirmed(false); setPaymentKey(crypto.randomUUID()); }} /></label></>}
      {action === 'cancel' && <label>{t`Reason for cancellation`}<textarea required minLength={3} maxLength={1000} value={reason} onChange={(event) => { setReason(event.target.value); setConfirmed(false); }} /></label>}
      <label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed and confirm this change.`}</label>
      <LessBusyActions><LessBusyRetry type="submit" disabled={!confirmed || pending}>{pending ? t`Saving…` : t`Confirm change`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => selectAction(null)}>{t`Back`}</LessBusyRetry></LessBusyActions>
    </LessBusyForm>}
    {(error || notice) && <LessBusySection><p role={error ? 'alert' : 'status'}>{error || notice}</p></LessBusySection>}
    <LessBusyInvoiceAdjustments key={`${invoice.id}:${invoice.version}`} id={invoice.id} version={invoice.version} currency={invoice.currency} status={invoice.status} onSaved={refetch} />
    <LessBusySection><h2>{t`Invoice history`}</h2><ul>{(invoice.auditEvents ?? []).map((entry, index) => <li key={index}>{entry.action.replaceAll('_', ' ')} · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time></li>)}</ul></LessBusySection>
  </>;
};

export const LessBusyInvoice = () => {
  const { invoiceId } = useParams();
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Invoice`} />}><LessBusyContent><LessBusyObjectGate objectName="lbInvoice">{invoiceId && <InvoiceDetails key={`${workspace?.id}:${invoiceId}`} invoiceId={invoiceId} />}</LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
