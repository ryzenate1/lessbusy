import { LessBusyTaskReminders } from '@/lessbusy/components/LessBusyTaskReminders';
import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type TaskRecord = ObjectRecord & { title: string | null; status: string | null; dueAt: string | null; assigneeId?: string | null; lbPriority?: string | null };
type TaskView = 'mine' | 'open' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'priority';

const TasksWorkspace = () => {
  const member = useAtomStateValue(currentWorkspaceMemberState);
  const { canReadFields, canWriteFields } = useLessBusyObjectAccess('task');
  const destinations = useLessBusyDestinations();
  const [view, setView] = useState<TaskView>(canReadFields('assignee') && member ? 'mine' : 'open');
  const [asOf, setAsOf] = useState(() => new Date());
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const mutationPending = useRef(false);
  const creationId = useRef(crypto.randomUUID());
  const start = new Date(asOf); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const filter: RecordGqlOperationFilter = { and: [
    { status: view === 'completed' ? { eq: 'DONE' } : { in: ['TODO', 'IN_PROGRESS'] } },
    ...(view === 'mine' && member ? [{ assigneeId: { eq: member.id } }] : []),
    ...(view === 'overdue' ? [{ dueAt: { lt: asOf.toISOString() } }] : []),
    ...(view === 'today' ? [{ dueAt: { gte: start.toISOString(), lt: end.toISOString() } }] : []),
    ...(view === 'priority' ? [{ lbPriority: { in: ['HIGH', 'CRITICAL'] } }] : []),
    ...(view === 'upcoming' ? [{ dueAt: { gte: end.toISOString() } }] : []),
  ] };
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<TaskRecord>({ objectNameSingular: 'task', filter, limit: 25, orderBy: view === 'completed' ? [{ updatedAt: 'DescNullsLast' }] : [{ dueAt: 'AscNullsLast' }], recordGqlFields: { id: true, title: true, status: true, dueAt: true, ...(canReadFields('lbPriority') ? { lbPriority: true } : {}), ...(canReadFields('assignee') ? { assigneeId: true } : {}) } });
  const { createOneRecord } = useCreateOneRecord<TaskRecord>({ objectNameSingular: 'task', recordGqlFields: { id: true } });
  const { updateOneRecord } = useUpdateOneRecord();
  const views: Array<{ value: TaskView; label: string }> = [...(canReadFields('assignee') && member ? [{ value: 'mine' as const, label: t`My tasks` }] : []), ...(canReadFields('lbPriority') ? [{ value: 'priority' as const, label: t`High priority` }] : []), { value: 'open', label: t`All open` }, { value: 'today', label: t`Due today` }, { value: 'upcoming', label: t`Upcoming` }, { value: 'overdue', label: t`Overdue` }, { value: 'completed', label: t`Completed` }];
  const changeStatus = async (task: TaskRecord) => {
    if (mutationPending.current) return;
    mutationPending.current = true; setPending(task.id); setActionError(null); setNotice(null);
    try {
      const updated = await updateOneRecord({ objectNameSingular: 'task', idToUpdate: task.id, updateOneRecordInput: { status: task.status === 'DONE' ? 'TODO' : 'DONE' }, recordGqlFields: { id: true, status: true } });
      if (!updated) throw new Error(t`The task change could not be saved.`);
      await refetch(); setNotice(task.status === 'DONE' ? t`Task reopened.` : t`Task completed.`);
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : t`Could not update this task.`); }
    finally { mutationPending.current = false; setPending(null); }
  };
  return <>
    <LessBusySection><h1>{t`Make room for what matters next.`}</h1><LessBusyDescription>{t`A clear list of follow-ups and work to finish. Open any task for its description, assignee, relationships and activity history.`}</LessBusyDescription><LessBusyActions><LessBusyLink to="/tasks/new">{t`Detailed task form`}</LessBusyLink>{canWriteFields('title', 'status') && <LessBusyRetry onClick={() => { setCreating(true); setActionError(null); }}>{t`Add task`}</LessBusyRetry>}{destinations.find((destination) => destination.nameSingular === 'task') && <LessBusyLink to={destinations.find((destination) => destination.nameSingular === 'task')!.path}>{t`All task views and advanced filters`}</LessBusyLink>}</LessBusyActions></LessBusySection>
    <LessBusySection><LessBusyTaskReminders /></LessBusySection>
    {creating && <LessBusySection><LessBusyForm onSubmit={async (event) => {
      event.preventDefault(); if (mutationPending.current) return;
      mutationPending.current = true; setPending('new'); setActionError(null);
      try {
        if (!title.trim()) throw new Error(t`Enter a task title.`);
        await createOneRecord({ id: creationId.current, title: title.trim(), status: 'TODO', ...(dueAt && canWriteFields('dueAt') ? { dueAt: new Date(dueAt).toISOString() } : {}), ...(member && canWriteFields('assignee') ? { assigneeId: member.id } : {}) });
        setCreating(false); setTitle(''); setDueAt(''); creationId.current = crypto.randomUUID(); await refetch(); setNotice(t`Task created. Open it to add a description or related records.`);
      } catch (failure) { setActionError(failure instanceof Error ? failure.message : t`Could not create this task.`); }
      finally { mutationPending.current = false; setPending(null); }
    }}><label>{t`Task title`}<input required maxLength={250} value={title} onChange={(event) => setTitle(event.target.value)} /></label>{canWriteFields('dueAt') && <label>{t`Due date (optional)`}<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>}<LessBusyActions><LessBusyRetry type="submit" disabled={Boolean(pending)}>{pending === 'new' ? t`Saving…` : t`Create task`}</LessBusyRetry><LessBusyRetry type="button" disabled={Boolean(pending)} onClick={() => setCreating(false)}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm></LessBusySection>}
    <LessBusySection><LessBusyActions>{views.map((item) => <LessBusyRetry key={item.value} aria-pressed={item.value === view} onClick={() => { setAsOf(new Date()); setView(item.value); }}>{item.label}</LessBusyRetry>)}</LessBusyActions>{notice && <p role="status">{notice}</p>}{actionError && <p role="alert">{actionError}</p>}{loading && <p role="status">{t`Loading tasks…`}</p>}{error ? <><p role="alert">{t`Tasks could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((task) => <li key={task.id}><LessBusyLink to={`/object/task/${task.id}`}>{task.title || t`Untitled task`}</LessBusyLink><LessBusyDescription>{task.lbPriority ? `${task.lbPriority} · ` : ''}{task.status?.replaceAll('_', ' ')} · {task.dueAt ? new Date(task.dueAt).toLocaleString() : t`No due date`}</LessBusyDescription>{canWriteFields('status') && <LessBusyRetry disabled={Boolean(pending)} onClick={() => void changeStatus(task)}>{pending === task.id ? t`Saving…` : task.status === 'DONE' ? t`Reopen task` : t`Mark complete`}</LessBusyRetry>}</li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No tasks in this view. Choose another view or add your next follow-up.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry disabled={loading} onClick={() => void fetchMoreRecords()}>{t`Load more tasks`}</LessBusyRetry>}</>}</LessBusySection>
  </>;
};

export const LessBusyTasks = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  const { canReadFields } = useLessBusyObjectAccess('task');
  return <PageCardLayout header={<PageCardHeader title={t`Tasks`} />}><LessBusyContent><LessBusyObjectGate objectName="task">{canReadFields('title', 'dueAt', 'status') ? <TasksWorkspace key={workspace?.id} /> : <LessBusyDescription>{t`Task planning is available when your role can read titles, due dates and status.`}</LessBusyDescription>}</LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
