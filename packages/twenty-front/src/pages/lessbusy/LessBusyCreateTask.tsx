import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { isValidUuid } from 'twenty-shared/utils';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { lessBusyTaskProposalSchema } from '@/lessbusy/utils/lessBusyTaskProposal';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type TaskFormProps = { proposal?: z.infer<typeof lessBusyTaskProposalSchema> };
const TaskForm = ({ proposal }: TaskFormProps) => {
  const navigate = useNavigate();
  const destinations = useLessBusyDestinations();
  const member = useAtomStateValue(currentWorkspaceMemberState);
  const taskAccess = useLessBusyObjectAccess('task');
  const employeeAccess = useLessBusyObjectAccess('workspaceMember');
  const [assigneeId, setAssigneeId] = useState<string | null>(member?.id ?? null);
  const [reminderAt, setReminderAt] = useState('');
  const { request, pending, error } = useLessBusyApi();
  const [title, setTitle] = useState(proposal?.task.title ?? '');
  const [description, setDescription] = useState(proposal?.task.description ?? '');
  const [priority, setPriority] = useState(proposal?.task.priority ?? 'NORMAL');
  const [dueAt, setDueAt] = useState(() => {
    if (!proposal?.task.dueAt) return '';
    const date = new Date(proposal.task.dueAt);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [customerId, setCustomerId] = useState<string | null>(proposal?.task.customerId ?? null);
  const [opportunityId, setOpportunityId] = useState<string | null>(proposal?.task.opportunityId ?? null);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending || !confirmed) return;
    setValidation(null);
    try {
      const task = { title, description, priority, ...(assigneeId ? { assigneeId } : {}), ...(reminderAt ? { reminderAt: new Date(reminderAt).toISOString() } : {}), ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}), ...(customerId ? { customerId } : {}), ...(opportunityId ? { opportunityId } : {}) };
      const payload = JSON.stringify(task);
      if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
      const result = z.object({ id: z.string().uuid() }).parse(await request('tasks', 'POST', { task, operationKey: operation.current.key, confirmed: true }));
      navigate(`/object/task/${result.id}`);
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not create this task.`); }
  }}><h1>{proposal ? t`Review suggested task` : t`Create a task`}</h1><LessBusyDescription>{t`Review the next step, priority and related records. Choose who owns the next step. Reminders appear inside LessBusy when the assigned employee opens the workspace.`}</LessBusyDescription><label>{t`Title`}<input required maxLength={250} value={title} onChange={(event) => { setTitle(event.target.value); setConfirmed(false); }} /></label><label>{t`Description`}<textarea maxLength={10000} rows={5} value={description} onChange={(event) => { setDescription(event.target.value); setConfirmed(false); }} /></label><label>{t`Priority`}<select value={priority} onChange={(event) => { setPriority(z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).parse(event.target.value)); setConfirmed(false); }}><option value="LOW">{t`Low`}</option><option value="NORMAL">{t`Normal`}</option><option value="HIGH">{t`High`}</option><option value="CRITICAL">{t`Critical`}</option></select></label><label>{t`Due date (optional)`}<input type="datetime-local" value={dueAt} onChange={(event) => { setDueAt(event.target.value); setConfirmed(false); }} /></label>{taskAccess.canWriteFields('lbReminderAt', 'lbReminderAcknowledgedAt') && <label>{t`Remind at (optional)`}<input type="datetime-local" value={reminderAt} onChange={(event) => { setReminderAt(event.target.value); setConfirmed(false); }} /></label>}{employeeAccess.canRead && taskAccess.canWriteFields('assignee') && <FormSingleRecordPicker label={t`Assigned employee (defaults to you)`} objectNameSingulars={['workspaceMember']} defaultValue={assigneeId} onClear={() => { setAssigneeId(null); setConfirmed(false); }} onChange={(value) => { setAssigneeId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}{destinations.some((destination) => destination.nameSingular === 'person') && <FormSingleRecordPicker label={t`Customer (optional)`} objectNameSingulars={['person']} defaultValue={customerId} onClear={() => { setCustomerId(null); setConfirmed(false); }} onChange={(value) => { setCustomerId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}{destinations.some((destination) => destination.nameSingular === 'opportunity') && <FormSingleRecordPicker label={t`Deal (optional)`} objectNameSingulars={['opportunity']} defaultValue={opportunityId} onClear={() => { setOpportunityId(null); setConfirmed(false); }} onChange={(value) => { setOpportunityId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}<label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed and want to create this task.`}</label>{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Creating…` : t`Create task`}</LessBusyRetry><LessBusyLink to="/tasks">{t`Back to tasks`}</LessBusyLink></LessBusyForm>;
};

export const LessBusyCreateTask = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const location = useLocation();
  const access = useLessBusyObjectAccess('task');
  const parsed = lessBusyTaskProposalSchema.safeParse(location.state?.lessbusyTaskProposal);
  const proposal = parsed.success && parsed.data.workspaceId === workspace?.id ? parsed.data : undefined;
  const installed = access.object?.fields.some((field) => field.name === 'lbOperationHash');
  return <PageCardLayout header={<PageCardHeader title={t`Task review`} />}><LessBusyContent><LessBusySection>{access.canWrite && installed ? <TaskForm key={`${workspace?.id}:${location.key}`} proposal={proposal} /> : <LessBusyDescription>{t`Install LessBusy Business and allow task creation to use the detailed review form. Existing task tools remain available.`}</LessBusyDescription>}</LessBusySection></LessBusyContent></PageCardLayout>;
};
