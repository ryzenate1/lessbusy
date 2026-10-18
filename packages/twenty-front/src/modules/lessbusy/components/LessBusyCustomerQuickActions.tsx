import { t } from '@lingui/core/macro';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyActions, LessBusyLink } from '@/lessbusy/components/LessBusyStyles';

export const LessBusyCustomerQuickActions = ({ customerId, customerName }: { customerId: string; customerName: string }) => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const invoice = useLessBusyObjectAccess('lbInvoice'); const quotation = useLessBusyObjectAccess('lbQuotation'); const order = useLessBusyObjectAccess('lbSalesOrder'); const task = useLessBusyObjectAccess('task');
  if (!workspace) return null;
  const state = { lessbusySalesDraftContext: { workspaceId: workspace.id, customerId } };
  return <LessBusyActions>{quotation.canWrite && <LessBusyLink to="/business/new/quotation" state={state}>{t`Prepare quotation`}</LessBusyLink>}{order.canWrite && <LessBusyLink to="/business/new/order" state={state}>{t`Create order`}</LessBusyLink>}{invoice.canWrite && <LessBusyLink to="/business/new/invoice" state={state}>{t`Create invoice`}</LessBusyLink>}{task.canWrite && <LessBusyLink to="/tasks/new" state={{ lessbusyTaskProposal: { workspaceId: workspace.id, task: { title: `${t`Follow up`}: ${customerName}`.slice(0, 250), customerId, priority: 'NORMAL', description: '' } } }}>{t`Plan follow-up task`}</LessBusyLink>}</LessBusyActions>;
};
