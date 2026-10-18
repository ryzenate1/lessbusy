import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyDescription, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type TimelineEntry = ObjectRecord & { happensAt: string; timelineActivityTypeSnapshot: { label?: string } | null };
const RecentActivity = ({ customerId, targetObjectNameSingular = 'person' }: { customerId?: string; targetObjectNameSingular?: 'person' | 'company' | 'opportunity' }) => {
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<TimelineEntry>({ objectNameSingular: 'timelineActivity', ...(customerId ? { filter: { [targetObjectNameSingular === 'company' ? 'targetCompanyId' : targetObjectNameSingular === 'opportunity' ? 'targetOpportunityId' : 'targetPersonId']: { eq: customerId } } } : {}), orderBy: [{ happensAt: 'DescNullsLast' }], limit: 15, recordGqlFields: { id: true, happensAt: true, timelineActivityTypeSnapshot: true } });
  return <>{loading && <p role="status">{t`Loading activity…`}</p>}{error ? <><p role="alert">{t`Could not load activity.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((entry) => <li key={entry.id}><p>{entry.timelineActivityTypeSnapshot?.label || t`Record activity`}</p><time dateTime={entry.happensAt}>{new Date(entry.happensAt).toLocaleString()}</time></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No activity is available in your current access yet.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load older activity`}</LessBusyRetry>}</>}</>;
};

export const LessBusyRecentActivity = ({ customerId, targetObjectNameSingular = 'person' }: { customerId?: string; targetObjectNameSingular?: 'person' | 'company' | 'opportunity' }) => {
  const { canReadFields } = useLessBusyObjectAccess('timelineActivity');
  if (!canReadFields('happensAt', 'timelineActivityTypeSnapshot', ...(customerId ? [targetObjectNameSingular === 'company' ? 'targetCompany' : targetObjectNameSingular === 'opportunity' ? 'targetOpportunity' : 'targetPerson'] : []))) return <LessBusyDescription>{t`Activity is shown when your role has access to the timeline.`}</LessBusyDescription>;
  return <RecentActivity key={customerId ?? 'workspace'} customerId={customerId} targetObjectNameSingular={targetObjectNameSingular} />;
};
