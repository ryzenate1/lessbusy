import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { moneyToMinorUnits } from '@/lessbusy/utils/moneyToMinorUnits';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type LessBusyInvoiceAdjustmentsProps = { id: string; version: number; currency: string; status: string; onSaved: () => Promise<unknown> };
const recordsSchema = z.object({ records: z.array(z.object({ id: z.string().uuid(), name: z.string(), amountMinor: z.string(), currency: z.string(), reason: z.string(), recordedAt: z.string() })), hasMore: z.boolean(), nextCursor: z.string().uuid().nullable() });

const AdjustmentHistory = ({ id, kind }: { id: string; kind: 'credit' | 'refund' }) => {
  const { request, pending, error } = useLessBusyApi();
  const [records, setRecords] = useState<z.infer<typeof recordsSchema>['records']>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const load = useCallback(async (after?: string) => {
    try {
      const result = recordsSchema.parse(await request(`invoices/${id}/adjustments?kind=${kind}${after ? `&cursor=${encodeURIComponent(after)}` : ''}`));
      setRecords((previous) => after ? [...new Map([...previous, ...result.records].map((record) => [record.id, record])).values()] : result.records); setCursor(result.nextCursor);
    } catch { setCursor(null); }
  }, [id, kind, request]);
  useEffect(() => { void load(); }, [load]);
  return <>{pending && <p role="status">{t`Loading adjustments…`}</p>}{error && <><p role="alert">{error}</p><LessBusyRetry onClick={() => void load()}>{t`Retry`}</LessBusyRetry></>}<LessBusyTaskList>{records.map((record) => <li key={record.id}><p>{record.name} · {formatLessBusyMoney(record.amountMinor, record.currency)}</p><LessBusyDescription>{record.reason}</LessBusyDescription><time dateTime={record.recordedAt}>{new Date(record.recordedAt).toLocaleString()}</time></li>)}</LessBusyTaskList>{!pending && !error && !records.length && <LessBusyDescription>{t`No records in this adjustment history.`}</LessBusyDescription>}{cursor && <LessBusyRetry disabled={pending} onClick={() => void load(cursor)}>{t`Load more adjustments`}</LessBusyRetry>}</>;
};

export const LessBusyInvoiceAdjustments = ({ id, version, currency, status, onSaved }: LessBusyInvoiceAdjustmentsProps) => {
  const credits = useLessBusyObjectAccess('lbCreditAdjustment');
  const refunds = useLessBusyObjectAccess('lbRefund');
  const { request, pending, error } = useLessBusyApi();
  const [kind, setKind] = useState<'credit' | 'refund'>(credits.canRead ? 'credit' : 'refund');
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [recordedAt] = useState(() => new Date().toISOString());
  const [validation, setValidation] = useState<string | null>(null);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  if (!credits.canRead && !refunds.canRead) return null;
  const canWrite = kind === 'credit' ? credits.canWrite : refunds.canWrite;
  return <LessBusySection><h2>{t`Credits and refunds`}</h2><LessBusyActions>{credits.canRead && <LessBusyRetry aria-pressed={kind === 'credit'} onClick={() => { setKind('credit'); setEditing(false); setConfirmed(false); }}>{t`Credit adjustments`}</LessBusyRetry>}{refunds.canRead && <LessBusyRetry aria-pressed={kind === 'refund'} onClick={() => { setKind('refund'); setEditing(false); setConfirmed(false); }}>{t`Refund records`}</LessBusyRetry>}{canWrite && !['DRAFT', 'CANCELLED'].includes(status) && <LessBusyRetry onClick={() => { setEditing(true); setConfirmed(false); }}>{kind === 'credit' ? t`Record credit adjustment` : t`Record a completed refund`}</LessBusyRetry>}</LessBusyActions>
    {editing && <LessBusyForm onSubmit={async (event) => {
      event.preventDefault(); if (!confirmed || pending || !canWrite) return;
      setValidation(null);
      try {
        const command = { expectedVersion: version, amountMinor: moneyToMinorUnits(amount, currency), reason, recordedAt, ...(kind === 'refund' ? { method, reference } : {}) };
        const payload = JSON.stringify({ kind, ...command });
        if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
        await request(`invoices/${id}/${kind === 'credit' ? 'credits' : 'refunds'}`, 'POST', { ...command, operationKey: operation.current.key, confirmed: true });
        setEditing(false); setConfirmed(false); await onSaved();
      } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not record this adjustment.`); }
    }}><LessBusyDescription>{kind === 'credit' ? t`Reduce the amount owed against this finalized invoice while preserving its original items and history. This action does not return stock or send money.` : t`Record money already returned to the customer outside LessBusy. The amount cannot exceed the refund due after recorded credit adjustments.`}</LessBusyDescription><label>{t`Amount`}<input required inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setConfirmed(false); }} /></label><label>{t`Reason`}<textarea required minLength={3} maxLength={2000} value={reason} onChange={(event) => { setReason(event.target.value); setConfirmed(false); }} /></label>{kind === 'refund' && <><label>{t`Refund method`}<select value={method} onChange={(event) => { setMethod(event.target.value); setConfirmed(false); }}><option value="BANK_TRANSFER">{t`Bank transfer`}</option><option value="CASH">{t`Cash`}</option><option value="CARD">{t`Card`}</option><option value="UPI">{t`UPI`}</option><option value="OTHER">{t`Other`}</option></select></label><label>{t`Payment reference`}<input maxLength={250} value={reference} onChange={(event) => { setReference(event.target.value); setConfirmed(false); }} /></label></>}<label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{kind === 'credit' ? t`I have reviewed and confirm this credit adjustment` : t`I confirm the customer has already received this refund`}</label>{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={!confirmed || pending}>{pending ? t`Saving…` : t`Record adjustment`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => setEditing(false)}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm>}
    <AdjustmentHistory key={`${id}:${kind}:${version}`} id={id} kind={kind} />
  </LessBusySection>;
};
