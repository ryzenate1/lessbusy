import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useCreateActivityRelatedRecordAction } from '@/activities/hooks/useCreateActivityRelatedRecordAction';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type LessBusyCustomerActivitiesProps = { customerId: string; kind: 'task' | 'note'; targetObjectNameSingular?: 'person' | 'company' | 'opportunity' };
type ActivityRecord = { id: string; title: string | null; status?: string | null; dueAt?: string | null };
type ActivityTarget = ObjectRecord & { task?: ActivityRecord | null; note?: ActivityRecord | null };

const CustomerActivities = ({ customerId, kind, targetObjectNameSingular = 'person' }: LessBusyCustomerActivitiesProps) => {
  const { action } = useCreateActivityRelatedRecordAction({ targetRecord: { id: customerId, targetObjectNameSingular }, activityObjectNameSingular: kind === 'task' ? CoreObjectNameSingular.Task : CoreObjectNameSingular.Note });
  const access = useLessBusyObjectAccess(kind);
  const targetAccess = useLessBusyObjectAccess(`${kind}Target`);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<ActivityTarget>({ objectNameSingular: `${kind}Target`, filter: { [targetObjectNameSingular === 'company' ? 'targetCompanyId' : targetObjectNameSingular === 'opportunity' ? 'targetOpportunityId' : 'targetPersonId']: { eq: customerId } }, orderBy: [{ createdAt: 'DescNullsLast' }], limit: 15, recordGqlFields: { id: true, [kind]: { id: true, title: true, ...(kind === 'task' && access.canReadFields('status') ? { status: true } : {}), ...(kind === 'task' && access.canReadFields('dueAt') ? { dueAt: true } : {}) } } });
  const activities = records.flatMap((target) => target[kind] ? [target[kind]!] : []);
  return <>{action.isVisible && access.canWrite && targetAccess.canWrite && <LessBusyRetry disabled={creating} onClick={async () => {
    setCreating(true); setActionError(null);
    try { await action.execute(); await refetch(); }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : t`Could not open the activity editor.`); }
    finally { setCreating(false); }
  }}>{creating ? t`Opening…` : action.label}</LessBusyRetry>}{actionError && <p role="alert">{actionError}</p>}{loading && <p role="status">{t`Loading activities…`}</p>}{error ? <><p role="alert">{t`Could not load customer activities.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{activities.map((activity) => <li key={activity.id}><LessBusyLink to={`/object/${kind}/${activity.id}`}>{activity.title || t`Untitled activity`}</LessBusyLink><LessBusyDescription>{activity.status?.replaceAll('_', ' ')}{activity.dueAt ? ` · ${new Date(activity.dueAt).toLocaleString()}` : ''}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && !activities.length && <LessBusyDescription>{t`No visible activities on this page yet. Add one or continue to older records.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load older activities`}</LessBusyRetry>}</>}</>;
};

export const LessBusyCustomerActivities = (props: LessBusyCustomerActivitiesProps) => {
  const activityAccess = useLessBusyObjectAccess(props.kind);
  const targetAccess = useLessBusyObjectAccess(`${props.kind}Target`);
  if (!activityAccess.canReadFields('title') || !targetAccess.canReadFields(props.targetObjectNameSingular === 'company' ? 'targetCompany' : props.targetObjectNameSingular === 'opportunity' ? 'targetOpportunity' : 'targetPerson', props.kind)) return <LessBusyDescription>{t`Customer activities are available when your role can read their records and customer relationships.`}</LessBusyDescription>;
  return <CustomerActivities key={`${props.customerId}:${props.kind}`} {...props} />;
};
