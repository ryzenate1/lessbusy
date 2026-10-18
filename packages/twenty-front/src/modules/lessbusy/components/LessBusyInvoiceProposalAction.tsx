import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { lessBusyInvoiceProposalSchema } from '@/lessbusy/utils/lessBusyInvoiceProposal';
import { LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

const outputSchema = z.object({ success: z.literal(true), result: z.object({ lessbusyInvoiceProposal: lessBusyInvoiceProposalSchema }) });
export const LessBusyInvoiceProposalAction = ({ output }: { output: unknown }) => {
  const navigate = useNavigate();
  const workspace = useAtomStateValue(currentWorkspaceState);
  const destinations = useLessBusyDestinations();
  const parsed = outputSchema.safeParse(output);
  if (!parsed.success || parsed.data.result.lessbusyInvoiceProposal.workspaceId !== workspace?.id || !destinations.some((destination) => destination.nameSingular === 'lbInvoice')) return null;
  return <LessBusyRetry onClick={() => navigate('/business/new/invoice', { state: { lessbusyInvoiceProposal: parsed.data.result.lessbusyInvoiceProposal } })}>{t`Review invoice proposal`}</LessBusyRetry>;
};
