import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type Lead = ObjectRecord & { name: string; recommendedAction: string | null; nextFollowUpAt: string | null };
const HotLeadsList = () => {
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Lead>({ objectNameSingular: 'lbLead', filter: { temperature: { eq: 'HOT' } }, recordGqlFields: { id: true, name: true, recommendedAction: true, nextFollowUpAt: true }, orderBy: [{ nextFollowUpAt: 'AscNullsLast' }], limit: 25 });
  if (loading) return <p role="status">{t`Loading hot leads…`}</p>;
  if (error) return <><p role="alert">{t`We could not load your hot leads.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></>;
  return <>{records.length === 0 ? <LessBusyDescription>{t`No leads are classified as hot yet. Update a lead when the customer shows clear buying intent.`}</LessBusyDescription> : <LessBusyTaskList>{records.map((lead) => <li key={lead.id}><LessBusyLink to={`/business/leads/${lead.id}`}>{lead.name || t`Unnamed lead`}</LessBusyLink><LessBusyDescription>{lead.recommendedAction || t`Review this enquiry and choose the next follow-up.`}</LessBusyDescription></li>)}</LessBusyTaskList>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more`}</LessBusyRetry>}</>;
};
export const LessBusyHotLeads = () => <PageCardLayout header={<PageCardHeader title={t`Hot leads`} />}><LessBusyContent><LessBusySection><h1>{t`Ready for a conversation.`}</h1><LessBusyDescription>{t`Leads explicitly marked hot, ordered by their next follow-up.`}</LessBusyDescription></LessBusySection><LessBusySection><LessBusyObjectGate objectName="lbLead"><HotLeadsList /></LessBusyObjectGate></LessBusySection></LessBusyContent></PageCardLayout>;
