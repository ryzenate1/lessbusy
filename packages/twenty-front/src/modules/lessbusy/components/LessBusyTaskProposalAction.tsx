import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { lessBusyTaskProposalSchema } from '@/lessbusy/utils/lessBusyTaskProposal';
import { LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

const outputSchema = z.object({ success: z.literal(true), result: z.object({ lessbusyTaskProposal: lessBusyTaskProposalSchema }) });
export const LessBusyTaskProposalAction = ({ output }: { output: unknown }) => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const access = useLessBusyObjectAccess('task');
  const navigate = useNavigate();
  const parsed = outputSchema.safeParse(output);
  if (!parsed.success || parsed.data.result.lessbusyTaskProposal.workspaceId !== workspace?.id || !access.canWrite) return null;
  return <LessBusyRetry onClick={() => navigate('/tasks/new', { state: { lessbusyTaskProposal: parsed.data.result.lessbusyTaskProposal } })}>{t`Review task proposal`}</LessBusyRetry>;
};
