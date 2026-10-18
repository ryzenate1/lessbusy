import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { escapeForIlike } from 'twenty-shared/utils';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type Lead = ObjectRecord & { name: string; temperature?: string | null; priority?: string | null; handlingStatus?: string | null; recommendedAction?: string | null; nextFollowUpAt?: string | null; source?: string | null };
const LeadDirectory = () => {
  const { canReadFields, canWrite } = useLessBusyObjectAccess('lbLead');
  const destinations = useLessBusyDestinations();
  const member = useAtomStateValue(currentWorkspaceMemberState);
  const [query, setQuery] = useState(''); const [search, setSearch] = useState('');
  const [view, setView] = useState('all'); const [mine, setMine] = useState(false);
  const [asOf, setAsOf] = useState(() => new Date().toISOString());
  const filters: RecordGqlOperationFilter[] = [];
  if (search) filters.push({ name: { ilike: `%${escapeForIlike(search)}%` } });
  if (mine && member) filters.push({ assignedEmployeeId: { eq: member.id } });
  if (view === 'hot') filters.push({ temperature: { eq: 'HOT' } });
  if (view === 'followup') filters.push({ followUpRequired: { eq: true } }, { handlingStatus: { neq: 'RESOLVED' } });
  if (view === 'priority') filters.push({ priority: { in: ['HIGH', 'CRITICAL'] } });
  if (view === 'unassigned') filters.push({ assignedEmployeeId: { is: 'NULL' } });
  if (view === 'converted') filters.push({ convertedOpportunityId: { is: 'NOT_NULL' } });
  if (view === 'new') filters.push({ createdAt: { gte: new Date(new Date(asOf).getTime() - 7 * 86400000).toISOString() } });
  const fields = ['temperature', 'priority', 'handlingStatus', 'recommendedAction', 'nextFollowUpAt', 'source'];
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Lead>({ objectNameSingular: 'lbLead', filter: filters.length ? { and: filters } : undefined, orderBy: canReadFields('nextFollowUpAt') ? [{ nextFollowUpAt: 'AscNullsLast' }, { createdAt: 'DescNullsLast' }] : [{ createdAt: 'DescNullsLast' }], limit: 25, recordGqlFields: { id: true, name: true, ...Object.fromEntries(fields.filter((field) => canReadFields(field)).map((field) => [field, true])) } });
  const views = [{ key: 'all', label: t`All enquiries`, available: true }, { key: 'hot', label: t`Hot leads`, available: canReadFields('temperature') }, { key: 'followup', label: t`Needs follow-up`, available: canReadFields('followUpRequired', 'handlingStatus') }, { key: 'priority', label: t`High priority`, available: canReadFields('priority') }, { key: 'new', label: t`New this week`, available: true }, { key: 'unassigned', label: t`Unassigned`, available: canReadFields('assignedEmployeeId') }, { key: 'converted', label: t`Converted to deals`, available: canReadFields('convertedOpportunityId') }];
  const pipeline = destinations.find((destination) => destination.nameSingular === 'opportunity');
  const native = destinations.find((destination) => destination.nameSingular === 'lbLead');
  return <><LessBusySection><h1>{t`Turn interest into a clear next step.`}</h1><LessBusyDescription>{t`Review customer enquiries, follow up with ready buyers and convert qualified interest into a sales deal. Buying readiness, conversation handling and pipeline stage stay separate.`}</LessBusyDescription><LessBusyActions><LessBusyLink to="/deals">{t`Deal pipeline`}</LessBusyLink>{canWrite && <LessBusyLink to="/business/leads/new">{t`Add lead`}</LessBusyLink>}{pipeline && <LessBusyLink to={pipeline.path}>{t`Open deals and kanban pipeline`}</LessBusyLink>}{native && <LessBusyLink to={native.path}>{t`Saved lead views and exports`}</LessBusyLink>}</LessBusyActions></LessBusySection><LessBusySection><LessBusyActions>{views.filter((item) => item.available).map((item) => <LessBusyRetry key={item.key} aria-pressed={view === item.key} onClick={() => { setView(item.key); setAsOf(new Date().toISOString()); }}>{item.label}</LessBusyRetry>)}</LessBusyActions><LessBusyForm onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }}><label>{t`Search enquiries`}<input type="search" value={query} maxLength={200} onChange={(event) => setQuery(event.target.value)} /></label>{member && canReadFields('assignedEmployeeId') && <label data-confirmation><input type="checkbox" checked={mine} onChange={(event) => setMine(event.target.checked)} />{t`Assigned to me`}</label>}<LessBusyRetry type="submit">{t`Search`}</LessBusyRetry></LessBusyForm></LessBusySection><LessBusySection>{loading && <p role="status">{t`Loading leads…`}</p>}{error ? <><p role="alert">{t`Could not load leads.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((lead) => <li key={lead.id}><LessBusyLink to={`/business/leads/${lead.id}`}>{lead.name || t`Unnamed lead`}</LessBusyLink><LessBusyDescription>{[lead.temperature, lead.priority, lead.handlingStatus?.replaceAll('_', ' '), lead.source].filter(Boolean).join(' · ')}</LessBusyDescription><p>{lead.recommendedAction}</p>{lead.nextFollowUpAt && <time dateTime={lead.nextFollowUpAt}>{new Date(lead.nextFollowUpAt).toLocaleString()}</time>}</li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No leads match this view. Choose another view or add a new enquiry.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more leads`}</LessBusyRetry>}</>}</LessBusySection></>;
};

export const LessBusyLeads = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Leads & Deals`} />}><LessBusyContent><LessBusyObjectGate objectName="lbLead"><LeadDirectory key={workspace?.id} /></LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
