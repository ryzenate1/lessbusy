import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { LessBusySalesConversion } from '@/lessbusy/components/LessBusySalesConversion';
import { LessBusyOrderStockActions } from '@/lessbusy/components/LessBusyOrderStockActions';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { lessBusyInvoiceProposalSchema } from '@/lessbusy/utils/lessBusyInvoiceProposal';
import { LessBusySalesDocumentForm } from '@/lessbusy/components/LessBusySalesDocumentForm';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

const documentSchema = z.object({
  issuedAt: z.string().nullable().optional(),
  convertedOrderId: z.string().uuid().nullable().optional(), convertedInvoiceId: z.string().uuid().nullable().optional(), sourceDocumentId: z.string().uuid().nullable().optional(), sourceDocumentKind: z.string().nullable().optional(), inventoryState: z.string().nullable().optional(),
  id: z.string().uuid(), name: z.string(), status: z.string(), version: z.number().int().nonnegative(), customerId: z.string().uuid(), opportunityId: z.string().uuid().nullable().optional(), currency: z.string(), discountBasisPoints: z.number().nullable().optional(), validUntil: z.string().nullable().optional(),
  lines: z.array(z.object({ description: z.string(), quantity: z.number(), unitAmountMinor: z.string(), totalMinor: z.string(), taxBasisPoints: z.number(), discountBasisPoints: z.number(), variantId: z.string().uuid().optional() })),
  totals: z.object({ totalMinor: z.string(), subtotalMinor: z.string(), taxMinor: z.string(), discountMinor: z.string() }),
  auditEvents: z.array(z.object({ action: z.string(), at: z.string(), from: z.string().optional(), to: z.string().optional() })).nullable().optional(),
});

const SalesDocument = ({ id, kind, workspaceId }: { id: string; kind: 'quotation' | 'order'; workspaceId: string }) => {
  const { request, pending, error } = useLessBusyApi();
  const navigate = useNavigate();
  const destinations = useLessBusyDestinations();
  const [document, setDocument] = useState<z.infer<typeof documentSchema> | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endpoint = kind === 'quotation' ? 'quotations' : 'orders';
  const labels: Record<string, string> = { SENT: t`Mark as sent`, ACCEPTED: t`Record acceptance`, DECLINED: t`Record decline`, CONFIRMED: t`Confirm order`, FULFILLED: t`Mark as fulfilled`, CANCELLED: t`Cancel document` };
  const load = useCallback(async () => {
    try { setDocument(documentSchema.parse(await request(`${endpoint}/${id}`))); }
    catch { setDocument(null); }
  }, [endpoint, id, request]);
  useEffect(() => { void load(); }, [load]);
  if (!document) return <LessBusySection>{pending ? <p role="status">{t`Loading document…`}</p> : <><p role="alert">{error || t`This document could not be loaded.`}</p><LessBusyRetry onClick={() => void load()}>{t`Reload document`}</LessBusyRetry></>}</LessBusySection>;
  const proposal = lessBusyInvoiceProposalSchema.safeParse({ workspaceId, document: { customerId: document.customerId, ...(document.opportunityId ? { opportunityId: document.opportunityId } : {}), currency: document.currency, discountBasisPoints: document.discountBasisPoints ?? 0, lines: document.lines, ...(document.validUntil ? { dueAt: document.validUntil } : {}) } });
  const transitions = kind === 'quotation' ? (document.status === 'DRAFT' ? ['SENT', 'CANCELLED'] : document.status === 'SENT' ? ['ACCEPTED', 'DECLINED', 'CANCELLED'] : []) : (document.status === 'DRAFT' ? ['CONFIRMED', 'CANCELLED'] : document.status === 'CONFIRMED' ? (document.inventoryState === 'RESERVED' ? [] : ['FULFILLED', 'CANCELLED']) : []);
  if (editing && document.status === 'DRAFT' && proposal.success) return <LessBusySection><LessBusyRetry onClick={() => setEditing(false)}>{t`Back to document`}</LessBusyRetry><LessBusySalesDocumentForm key={`${id}:${document.version}`} kind={kind} draft={{ id, version: document.version }} proposal={proposal.data} onSaved={async () => { setEditing(false); await load(); }} /></LessBusySection>;
  return <>
    <LessBusySection><h1>{document.name}</h1><LessBusyDescription>{document.status.replaceAll('_', ' ')}{document.validUntil ? ` · ${t`Valid until`} ${new Date(document.validUntil).toLocaleDateString()}` : ''}</LessBusyDescription>
      <LessBusyActions>{document.status === 'DRAFT' && proposal.success && <LessBusyRetry onClick={() => setEditing(true)}>{t`Edit draft`}</LessBusyRetry>}{transitions.map((value) => <LessBusyRetry key={value} disabled={pending} onClick={() => { setStatus(value); setConfirmed(false); setNotice(null); }}>{labels[value]}</LessBusyRetry>)}
</LessBusyActions>
    </LessBusySection>
    {((kind === 'quotation' && document.status === 'ACCEPTED') || (kind === 'order' && ['CONFIRMED', 'FULFILLED'].includes(document.status))) && <LessBusySection><LessBusySalesConversion key={`${id}:${document.version}`} id={id} kind={kind} version={document.version} convertedId={kind === 'quotation' ? document.convertedOrderId : document.convertedInvoiceId} /></LessBusySection>}
    {document.sourceDocumentId && <LessBusySection><LessBusyLink to={`/business/${document.sourceDocumentKind === 'quotation' ? 'quotations' : 'orders'}/${document.sourceDocumentId}`}>{t`Open source document`}</LessBusyLink></LessBusySection>}
    {kind === 'order' && document.status === 'CONFIRMED' && <LessBusyOrderStockActions key={`${id}:${document.version}`} id={id} version={document.version} inventoryState={document.inventoryState} onSaved={load} />}
    <LessBusySection><h2>{t`Items and totals`}</h2>{document.lines.map((line, index) => <p key={index}>{line.description} · {line.quantity} · {formatLessBusyMoney(line.totalMinor, document.currency)}</p>)}<dl><dt>{t`Subtotal`}</dt><dd>{formatLessBusyMoney(document.totals.subtotalMinor, document.currency)}</dd><dt>{t`Discount`}</dt><dd>{formatLessBusyMoney(document.totals.discountMinor, document.currency)}</dd><dt>{t`Tax`}</dt><dd>{formatLessBusyMoney(document.totals.taxMinor, document.currency)}</dd><dt>{t`Total`}</dt><dd>{formatLessBusyMoney(document.totals.totalMinor, document.currency)}</dd></dl></LessBusySection>
    {status && <LessBusySection><LessBusyForm onSubmit={async (event) => {
      event.preventDefault(); if (pending || !confirmed) return;
      try { const result = documentSchema.parse(await request(`${endpoint}/${id}/status`, 'POST', { confirmed: true, expectedVersion: document.version, status })); setDocument(result); setStatus(null); setConfirmed(false); setNotice(t`Document status saved.`); }
      catch { setNotice(null); }
    }}><h2>{labels[status]}</h2><LessBusyDescription>{kind === 'quotation' ? t`Record the real outcome with your customer. Marking a quotation as sent records its status; send the quotation through your usual channel.` : t`This records the order status. Reserve or commit stock separately through inventory, and record payments against an invoice.`}</LessBusyDescription><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed and confirm this status change.`}</label><LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Saving…` : t`Confirm change`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => setStatus(null)}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm></LessBusySection>}
    {(error || notice) && <LessBusySection><p role={error ? 'alert' : 'status'}>{error || notice}</p>{error && <LessBusyRetry onClick={() => { setStatus(null); setConfirmed(false); void load(); }}>{t`Reload current document`}</LessBusyRetry>}</LessBusySection>}
    <LessBusySection><h2>{t`Document history`}</h2><ul>{(document.auditEvents ?? []).map((entry, index) => <li key={index}>{entry.action.replaceAll('_', ' ')}{entry.to ? ` · ${entry.to}` : ''} · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time></li>)}</ul></LessBusySection>
  </>;
};

export const LessBusySalesDocument = () => {
  const { salesKind, documentId } = useParams();
  const workspace = useAtomStateValue(currentWorkspaceState);
  const kind = salesKind === 'quotations' ? 'quotation' : salesKind === 'orders' ? 'order' : null;
  return <PageCardLayout header={<PageCardHeader title={t`Sales document`} />}><LessBusyContent>{kind && documentId && workspace?.id ? <LessBusyObjectGate objectName={kind === 'quotation' ? 'lbQuotation' : 'lbSalesOrder'}><SalesDocument key={`${workspace.id}:${documentId}`} id={documentId} kind={kind} workspaceId={workspace.id} /></LessBusyObjectGate> : <LessBusySection><LessBusyDescription>{t`This sales document destination is unavailable.`}</LessBusyDescription></LessBusySection>}</LessBusyContent></PageCardLayout>;
};
