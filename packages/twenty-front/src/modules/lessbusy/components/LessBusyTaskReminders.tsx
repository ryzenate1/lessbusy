import { useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type ReminderTask = ObjectRecord & { title: string; updatedAt: string; dueAt: string | null; lbReminderAt: string };
const ReminderQueue = ({ memberId, canUpdate }: { memberId: string; canUpdate: boolean }) => {
  const [asOf, setAsOf] = useState(() => new Date().toISOString());
  const { request, pending, error } = useLessBusyApi();
  const { records, loading, error: loadError, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<ReminderTask>({ objectNameSingular: 'task', filter: { and: [{ assigneeId: { eq: memberId } }, { status: { in: ['TODO', 'IN_PROGRESS'] } }, { lbReminderAt: { lte: asOf } }, { lbReminderAcknowledgedAt: { is: 'NULL' } }] }, limit: 5, orderBy: [{ lbReminderAt: 'AscNullsLast' }], recordGqlFields: { id: true, title: true, dueAt: true, updatedAt: true, lbReminderAt: true } });
  useEffect(() => { const interval = setInterval(() => setAsOf(new Date().toISOString()), 60000); return () => clearInterval(interval); }, []);
  const act = async (task: ReminderTask, kind: 'acknowledge' | 'snooze') => {
    if (pending) return;
    try { await request(`tasks/${task.id}/reminder`, 'POST', { expectedUpdatedAt: task.updatedAt, action: kind === 'acknowledge' ? { kind } : { kind, until: new Date(Date.now() + 60 * 60 * 1000).toISOString() } }); await refetch(); } catch { /* Error is displayed by the request hook. */ }
  };
  return <><h2>{t`Your reminders`}</h2><LessBusyDescription>{t`Reminders for tasks assigned to you appear here while you use LessBusy. Snoozing moves the reminder by one hour.`}</LessBusyDescription>{loading && <p role="status">{t`Loading reminders…`}</p>}{loadError && <p role="alert">{t`Reminders could not be loaded.`}</p>}{error && <p role="alert">{error}</p>}<LessBusyTaskList>{records.map((task) => <li key={task.id}><LessBusyLink to={`/object/task/${task.id}`}>{task.title || t`Untitled task`}</LessBusyLink><LessBusyDescription>{t`Reminder`}: {new Date(task.lbReminderAt).toLocaleString()}{task.dueAt ? ` · ${t`Due`}: ${new Date(task.dueAt).toLocaleString()}` : ''}</LessBusyDescription>{canUpdate && <LessBusyActions><LessBusyRetry disabled={pending} onClick={() => void act(task, 'acknowledge')}>{t`Dismiss reminder`}</LessBusyRetry><LessBusyRetry disabled={pending} onClick={() => void act(task, 'snooze')}>{t`Remind in one hour`}</LessBusyRetry></LessBusyActions>}</li>)}</LessBusyTaskList>{!loading && !loadError && !records.length && <p>{t`No reminders need your attention right now.`}</p>}{hasNextPage && <LessBusyRetry disabled={loading} onClick={() => void fetchMoreRecords()}>{t`More reminders`}</LessBusyRetry>}<LessBusyRetry disabled={loading} onClick={() => { setAsOf(new Date().toISOString()); void refetch(); }}>{t`Refresh reminders`}</LessBusyRetry></>;
};
export const LessBusyTaskReminders = () => {
  const member = useAtomStateValue(currentWorkspaceMemberState);
  const access = useLessBusyObjectAccess('task');
  return member && access.canReadFields('title', 'dueAt', 'status', 'assignee', 'lbReminderAt', 'lbReminderAcknowledgedAt') ? <ReminderQueue memberId={member.id} canUpdate={access.canWriteFields('lbReminderAt', 'lbReminderAcknowledgedAt')} /> : null;
};
