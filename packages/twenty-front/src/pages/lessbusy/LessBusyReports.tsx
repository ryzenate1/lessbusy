import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

const groupSchema = z.object({ currency: z.string(), invoices: z.number(), billedMinor: z.string(), paidMinor: z.string(), creditedMinor: z.string(), refundedMinor: z.string(), outstandingMinor: z.string(), refundDueMinor: z.string() });
const reportSchema = z.object({ groups: z.array(groupSchema), scanned: z.number(), hasMore: z.boolean(), nextCursor: z.string().uuid().nullable(), from: z.string(), to: z.string() });
type ReportGroup = z.infer<typeof groupSchema>;
const AMOUNT_FIELDS = ['billedMinor', 'paidMinor', 'creditedMinor', 'refundedMinor', 'outstandingMinor', 'refundDueMinor'] as const;

const SalesReport = () => {
  const { request, pending, error } = useLessBusyApi();
  const today = new Date();
  const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const [from, setFrom] = useState(localDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(localDate(today));
  const [report, setReport] = useState<z.infer<typeof reportSchema> | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const inFlight = useRef(false);
  const load = async (more = false) => {
    if (inFlight.current) return;
    inFlight.current = true; setValidation(null);
    try {
      const range = more && report ? { from: report.from, to: report.to } : { from: new Date(`${from}T00:00:00`).toISOString(), to: new Date(`${to}T23:59:59.999`).toISOString() };
      const params = new URLSearchParams({ ...range, ...(more && report?.nextCursor ? { cursor: report.nextCursor } : {}) });
      const result = reportSchema.parse(await request(`reports/sales?${params.toString()}`));
      setReport((previous) => {
        if (!more || !previous) return result;
        const groups = new Map(previous.groups.map((group) => [group.currency, { ...group }]));
        for (const group of result.groups) {
          const aggregate = groups.get(group.currency);
          if (!aggregate) groups.set(group.currency, group);
          else { aggregate.invoices += group.invoices; for (const field of AMOUNT_FIELDS) aggregate[field] = (BigInt(aggregate[field]) + BigInt(group[field])).toString(); }
        }
        return { ...result, groups: [...groups.values()], scanned: previous.scanned + result.scanned };
      });
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not generate this report.`); }
    finally { inFlight.current = false; }
  };
  const download = () => {
    if (!report) return;
    const headers = ['currency', 'invoices', ...AMOUNT_FIELDS];
    const rows = report.groups.map((group: ReportGroup) => [group.currency, group.invoices, ...AMOUNT_FIELDS.map((field) => group[field])].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `lessbusy-sales-${from}-${to}${report.hasMore ? '-partial' : ''}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const labels = { billedMinor: t`Invoice totals`, paidMinor: t`Payments recorded`, creditedMinor: t`Credits`, refundedMinor: t`Refunds`, outstandingMinor: t`Still owed`, refundDueMinor: t`Refunds due` };
  return <><LessBusySection><h1>{t`A clear view of invoiced sales.`}</h1><LessBusyDescription>{t`Invoices finalized in your selected period, with their current payment and adjustment balances. Currencies stay separate. This is an operational report, not a cash-flow or tax filing report.`}</LessBusyDescription></LessBusySection><LessBusySection><LessBusyForm onSubmit={(event) => { event.preventDefault(); void load(); }}><div data-row><label>{t`From`}<input type="date" required value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>{t`To`}<input type="date" required value={to} onChange={(event) => setTo(event.target.value)} /></label></div><LessBusyRetry type="submit" disabled={pending}>{pending ? t`Loading…` : t`Generate report`}</LessBusyRetry></LessBusyForm>{(error || validation) && <p role="alert">{error || validation}</p>}</LessBusySection>{report && <><LessBusySection><p role="status">{report.hasMore ? t`Partial report: ${report.scanned} invoices checked. Load the remaining batches before treating these as period totals.` : t`${report.scanned} invoices included from your current access.`}</p><LessBusyActions>{report.hasMore && <LessBusyRetry disabled={pending} onClick={() => void load(true)}>{t`Load next invoice batch`}</LessBusyRetry>}<LessBusyRetry onClick={download}>{report.hasMore ? t`Export partial report` : t`Export report`}</LessBusyRetry></LessBusyActions></LessBusySection>{report.groups.map((group) => <LessBusySection key={group.currency}><h2>{group.currency}</h2><p>{t`${group.invoices} invoices`}</p><dl>{AMOUNT_FIELDS.map((field) => <div key={field}><dt>{labels[field]}</dt><dd>{formatLessBusyMoney(group[field], group.currency)}</dd></div>)}</dl></LessBusySection>)}{!report.groups.length && <LessBusySection><LessBusyDescription>{t`No finalized invoices in this period are available in your access.`}</LessBusyDescription></LessBusySection>}</>}</>;
};

export const LessBusyReports = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const { canReadFields } = useLessBusyObjectAccess('lbInvoice');
  return <PageCardLayout header={<PageCardHeader title={t`Sales reports`} />}><LessBusyContent><LessBusyObjectGate objectName="lbInvoice">{canReadFields('finalizedAt', 'currency', 'totals', 'amountPaidMinor', 'amountCreditedMinor', 'amountRefundedMinor') ? <SalesReport key={workspace?.id} /> : <LessBusyDescription>{t`Sales reporting is available when your role can read invoice totals, payments and adjustments.`}</LessBusyDescription>}</LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
