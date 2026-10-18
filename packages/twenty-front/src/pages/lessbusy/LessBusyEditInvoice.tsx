import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { lessBusyInvoiceProposalSchema } from '@/lessbusy/utils/lessBusyInvoiceProposal';
import { LessBusySalesDocumentForm } from '@/lessbusy/components/LessBusySalesDocumentForm';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

const draftSchema = z.object({ id: z.string().uuid(), version: z.number().int().nonnegative(), status: z.string(), customerId: z.string().uuid(), opportunityId: z.string().uuid().nullable().optional(), currency: z.string(), discountBasisPoints: z.number().nullable().optional(), dueAt: z.string().nullable(), lines: z.array(z.unknown()) });

const EditInvoice = ({ invoiceId, workspaceId }: { invoiceId: string; workspaceId: string }) => {
  const { request, pending, error } = useLessBusyApi();
  const [invoice, setInvoice] = useState<z.infer<typeof draftSchema> | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const load = useCallback(async () => {
    setUnavailable(false);
    try { setInvoice(draftSchema.parse(await request(`invoices/${invoiceId}`))); }
    catch { setInvoice(null); setUnavailable(true); }
  }, [request, invoiceId]);
  useEffect(() => { void load(); }, [load]);
  if (pending) return <p role="status">{t`Loading draft…`}</p>;
  if (error || unavailable) return <><p role="alert">{error || t`This invoice draft could not be loaded.`}</p><LessBusyRetry onClick={() => void load()}>{t`Reload draft`}</LessBusyRetry></>;
  if (!invoice) return null;
  if (invoice.status !== 'DRAFT') return <><LessBusyDescription>{t`Only draft invoices can be edited. Open this invoice to view its history and available actions.`}</LessBusyDescription><LessBusyLink to={`/business/invoices/${invoiceId}`}>{t`Open invoice`}</LessBusyLink></>;
  const proposal = lessBusyInvoiceProposalSchema.safeParse({ workspaceId, document: { customerId: invoice.customerId, ...(invoice.opportunityId ? { opportunityId: invoice.opportunityId } : {}), currency: invoice.currency, discountBasisPoints: invoice.discountBasisPoints ?? 0, ...(invoice.dueAt ? { dueAt: invoice.dueAt } : {}), lines: invoice.lines } });
  if (!proposal.success) return <LessBusyDescription>{t`This draft needs billing review before its items can be edited.`}</LessBusyDescription>;
  return <LessBusySalesDocumentForm key={`${invoice.id}:${invoice.version}`} kind="invoice" draft={{ id: invoice.id, version: invoice.version }} proposal={proposal.data} />;
};

export const LessBusyEditInvoice = () => {
  const { invoiceId } = useParams();
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Edit invoice draft`} />}><LessBusyContent><LessBusySection><LessBusyObjectGate objectName="lbInvoice">{invoiceId && workspace?.id && <EditInvoice key={`${workspace.id}:${invoiceId}`} invoiceId={invoiceId} workspaceId={workspace.id} />}</LessBusyObjectGate></LessBusySection></LessBusyContent></PageCardLayout>;
};
