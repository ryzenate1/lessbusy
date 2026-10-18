import { z } from 'zod';
import { LessBusyDefaultCurrency } from '@/lessbusy/components/LessBusyDefaultCurrency';
import { t } from '@lingui/core/macro';
import { useParams, useLocation } from 'react-router-dom';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyContent, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { LessBusySalesDocumentForm } from '@/lessbusy/components/LessBusySalesDocumentForm';
import { lessBusyInvoiceProposalSchema } from '@/lessbusy/utils/lessBusyInvoiceProposal';
const kinds = { invoice: { object: 'lbInvoice' }, quotation: { object: 'lbQuotation' }, order: { object: 'lbSalesOrder' } } as const;

export const LessBusyCreateSalesDocument = () => {
  const { documentKind } = useParams();
  const location = useLocation();
  const workspace = useAtomStateValue(currentWorkspaceState);
  const candidate = lessBusyInvoiceProposalSchema.safeParse(location.state?.lessbusyInvoiceProposal);
  const proposal = candidate.success && candidate.data.workspaceId === workspace?.id ? candidate.data : undefined;
  const context = z.object({ workspaceId: z.string().uuid(), customerId: z.string().uuid() }).safeParse(location.state?.lessbusySalesDraftContext);
  const initialCustomerId = context.success && context.data.workspaceId === workspace?.id ? context.data.customerId : undefined;
  const kind = documentKind === 'quotation' || documentKind === 'order' ? documentKind : 'invoice';
  return <PageCardLayout header={<PageCardHeader title={t`Sales`} />}><LessBusyContent><LessBusySection><LessBusyObjectGate objectName={kinds[kind].object}><LessBusyDefaultCurrency>{(defaultCurrency) => <LessBusySalesDocumentForm defaultCurrency={defaultCurrency} initialCustomerId={initialCustomerId} key={`${workspace?.id}:${kind}:${location.key}`} kind={kind} proposal={proposal} />}</LessBusyDefaultCurrency></LessBusyObjectGate></LessBusySection></LessBusyContent></PageCardLayout>;
};
