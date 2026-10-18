import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

import { type Task } from '@/activities/types/Task';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  LessBusyDescription,
  LessBusyLink,
  LessBusyRetry,
  LessBusyTaskList,
} from '@/lessbusy/components/LessBusyStyles';

const TASK_FIELDS = { id: true, title: true, dueAt: true } as const;
const getDueTaskFilter = (dueBefore: string) => ({
  and: [
    { dueAt: { lte: dueBefore } },
    { status: { in: ['TODO', 'IN_PROGRESS'] } },
  ],
});

export const LessBusyDueTasks = () => {
  const [dueBefore, setDueBefore] = useState(() => new Date().toISOString());
  const { records, loading, error, refetch } = useFindManyRecords<Task>({
    objectNameSingular: 'task',
    recordGqlFields: TASK_FIELDS,
    filter: getDueTaskFilter(dueBefore),
    orderBy: [{ dueAt: 'AscNullsLast' }],
    limit: 5,
  });

  const refresh = () => {
    const nextDueBefore = new Date().toISOString();
    setDueBefore(nextDueBefore);
    void refetch({ filter: getDueTaskFilter(nextDueBefore) });
  };

  if (error) {
    return (
      <>
        <p role="alert">{t`Could not load due tasks.`}</p>
        <LessBusyRetry onClick={refresh}>{t`Retry`}</LessBusyRetry>
      </>
    );
  }
  if (loading) {
    return <p role="status">{t`Loading due tasks…`}</p>;
  }

  return (
    <>
      {records.length === 0 ? (
        <LessBusyDescription>{t`No overdue tasks in your current access. Open Tasks to plan your next follow-up.`}</LessBusyDescription>
      ) : (
        <LessBusyTaskList>
          {records.map((task) => (
            <li key={task.id}>
              <LessBusyLink
                to={getAppPath(AppPath.RecordShowPage, {
                  objectNameSingular: 'task',
                  objectRecordId: task.id,
                })}
              >
                <span>{task.title || t`Untitled task`}</span>
                {task.dueAt && (
                  <time dateTime={task.dueAt}>
                    {new Date(task.dueAt).toLocaleDateString()}
                  </time>
                )}
              </LessBusyLink>
            </li>
          ))}
        </LessBusyTaskList>
      )}
      <LessBusyRetry onClick={refresh}>{t`Refresh tasks`}</LessBusyRetry>
    </>
  );
};
