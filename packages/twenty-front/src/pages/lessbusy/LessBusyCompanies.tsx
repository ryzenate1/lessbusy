import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { escapeForIlike } from 'twenty-shared/utils';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { LessBusyCustomerActivities } from '@/lessbusy/components/LessBusyCustomerActivities';
import { LessBusyRecentActivity } from '@/lessbusy/components/LessBusyRecentActivity';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type Company = ObjectRecord & { name: string; domainName?: { primaryLinkUrl?: string | null; primaryLinkLabel?: string | null } | null; employees?: number | null };
const CompanyForm = ({ company, onSaved, onCancel }: { company?: Company; onSaved: (id: string) => Promise<void>; onCancel: () => void }) => {
  const { canReadFields, canWriteFields } = useLessBusyObjectAccess('company');
  const { createOneRecord } = useCreateOneRecord<Company>({ objectNameSingular: 'company', recordGqlFields: { id: true } });
  const { updateOneRecord } = useUpdateOneRecord();
  const [name, setName] = useState(company?.name ?? '');
  const [website, setWebsite] = useState(company?.domainName?.primaryLinkUrl ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creationId = useRef(crypto.randomUUID());
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending) return; setPending(true); setError(null);
    try {
      if (!name.trim()) throw new Error(t`Enter a company name.`);
      let primaryLinkUrl = website.trim();
      if (primaryLinkUrl) { if (!/^https?:\/\//i.test(primaryLinkUrl)) primaryLinkUrl = `https://${primaryLinkUrl}`; const url = new URL(primaryLinkUrl); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error(t`Enter a public website address.`); }
      const input = { name: name.trim(), ...(canReadFields('domainName') && canWriteFields('domainName') ? { domainName: { primaryLinkUrl } } : {}) };
      if (company) { const result = await updateOneRecord({ objectNameSingular: 'company', idToUpdate: company.id, updateOneRecordInput: input, recordGqlFields: { id: true } }); if (!result) throw new Error(t`Company could not be saved.`); }
      else await createOneRecord({ ...input, id: creationId.current });
      await onSaved(company?.id ?? creationId.current);
    } catch (failure) { setError(failure instanceof Error ? failure.message : t`Could not save this company.`); } finally { setPending(false); }
  }}><h1>{company ? t`Edit company` : t`Add a company`}</h1><label>{t`Company name`}<input required maxLength={250} value={name} onChange={(event) => setName(event.target.value)} /></label>{canReadFields('domainName') && canWriteFields('domainName') && <label>{t`Website (optional)`}<input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="example.com" /></label>}{error && <p role="alert">{error}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={pending}>{pending ? t`Saving…` : t`Save company`}</LessBusyRetry><LessBusyRetry type="button" onClick={onCancel}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm>;
};

type CompanyContact = ObjectRecord & { name: { firstName?: string; lastName?: string } | null };
const CompanyContacts = ({ id }: { id: string }) => {
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<CompanyContact>({ objectNameSingular: 'person', filter: { companyId: { eq: id } }, limit: 20, orderBy: [{ createdAt: 'DescNullsLast' }], recordGqlFields: { id: true, name: { firstName: true, lastName: true } } });
  return <>{loading && <p role="status">{t`Loading company contacts…`}</p>}{error ? <><p role="alert">{t`Could not load company contacts.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((person) => <li key={person.id}><LessBusyLink to={`/customers/${person.id}`}>{[person.name?.firstName, person.name?.lastName].filter(Boolean).join(' ') || t`Unnamed customer`}</LessBusyLink></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No linked contacts in your access. Add or change company relationships from a customer's full record.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more contacts`}</LessBusyRetry>}</>}</>;
};
const CompanyDeals = ({ id }: { id: string }) => {
  const { canReadFields } = useLessBusyObjectAccess('opportunity');
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<ObjectRecord & { name: string; stage?: string; closeDate?: string | null }>({ objectNameSingular: 'opportunity', filter: { companyId: { eq: id } }, limit: 20, orderBy: [{ createdAt: 'DescNullsLast' }], recordGqlFields: { id: true, name: true, ...(canReadFields('stage') ? { stage: true } : {}), ...(canReadFields('closeDate') ? { closeDate: true } : {}) } });
  return <>{loading && <p role="status">{t`Loading deals…`}</p>}{error ? <><p role="alert">{t`Could not load company deals.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((deal) => <li key={deal.id}><LessBusyLink to={`/object/opportunity/${deal.id}`}>{deal.name}</LessBusyLink><LessBusyDescription>{deal.stage}{deal.closeDate ? ` · ${new Date(deal.closeDate).toLocaleDateString()}` : ''}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No linked deals in your access.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more deals`}</LessBusyRetry>}</>}</>;
};

const CompanyProfile = ({ id }: { id: string }) => {
  const access = useLessBusyObjectAccess('company');
  const people = useLessBusyObjectAccess('person'); const deals = useLessBusyObjectAccess('opportunity');
  const [editing, setEditing] = useState(false); const [tab, setTab] = useState('contacts');
  const { record, loading, error, refetch } = useFindOneRecord<Company>({ objectNameSingular: 'company', objectRecordId: id, recordGqlFields: { id: true, name: true, ...(access.canReadFields('domainName') ? { domainName: { primaryLinkUrl: true, primaryLinkLabel: true } } : {}), ...(access.canReadFields('employees') ? { employees: true } : {}) } });
  if (loading) return <p role="status">{t`Loading company…`}</p>;
  if (error || !record) return <><p role="alert">{t`Company unavailable in your current access.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></>;
  if (editing) return <CompanyForm company={record} onSaved={async () => { setEditing(false); await refetch(); }} onCancel={() => setEditing(false)} />;
  const tabs = [{ key: 'contacts', label: t`Contacts` }, { key: 'deals', label: t`Deals` }, { key: 'tasks', label: t`Tasks` }, { key: 'notes', label: t`Notes` }, { key: 'activity', label: t`Activity` }];
  return <><LessBusySection><LessBusyLink to="/companies">{t`All companies`}</LessBusyLink><h1>{record.name}</h1><LessBusyDescription>{record.domainName?.primaryLinkUrl}{record.employees != null ? ` · ${t`${record.employees} employees`}` : ''}</LessBusyDescription><LessBusyActions>{access.canWriteFields('name') && <LessBusyRetry onClick={() => setEditing(true)}>{t`Edit company`}</LessBusyRetry>}<LessBusyLink to={`/object/company/${id}`}>{t`Full company record`}</LessBusyLink></LessBusyActions></LessBusySection><LessBusySection><LessBusyActions>{tabs.map((item) => <LessBusyRetry key={item.key} aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>{item.label}</LessBusyRetry>)}</LessBusyActions><h2 style={{ marginTop: 24 }}>{tabs.find((item) => item.key === tab)?.label}</h2>{tab === 'contacts' ? (people.canReadFields('name', 'company') ? <CompanyContacts id={id} /> : <LessBusyDescription>{t`Contacts are shown when your role can read company relationships.`}</LessBusyDescription>) : tab === 'deals' ? (deals.canReadFields('name', 'company') ? <CompanyDeals id={id} /> : <LessBusyDescription>{t`Deals are shown when your role can read company relationships.`}</LessBusyDescription>) : tab === 'tasks' || tab === 'notes' ? <LessBusyCustomerActivities customerId={id} targetObjectNameSingular="company" kind={tab === 'tasks' ? 'task' : 'note'} /> : <LessBusyRecentActivity customerId={id} targetObjectNameSingular="company" />}</LessBusySection></>;
};

const CompanyDirectory = () => {
  const access = useLessBusyObjectAccess('company'); const destinations = useLessBusyDestinations(); const navigate = useNavigate();
  const [query, setQuery] = useState(''); const [search, setSearch] = useState(''); const [creating, setCreating] = useState(false);
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Company>({ objectNameSingular: 'company', ...(search ? { filter: { name: { ilike: `%${escapeForIlike(search)}%` } } } : {}), orderBy: [{ name: 'AscNullsLast' }], limit: 25, recordGqlFields: { id: true, name: true } });
  if (creating) return <CompanyForm onSaved={async (id) => { navigate(`/companies/${id}`); }} onCancel={() => setCreating(false)} />;
  return <><LessBusySection><h1>{t`The businesses you work with.`}</h1><LessBusyDescription>{t`Keep B2B contacts, deals and follow-ups together. Companies stay optional for businesses that sell directly to individuals.`}</LessBusyDescription><LessBusyActions>{access.canWriteFields('name') && <LessBusyRetry onClick={() => setCreating(true)}>{t`Add company`}</LessBusyRetry>}{destinations.find((destination) => destination.nameSingular === 'company') && <LessBusyLink to={destinations.find((destination) => destination.nameSingular === 'company')!.path}>{t`Saved views, bulk actions and import/export`}</LessBusyLink>}</LessBusyActions></LessBusySection><LessBusySection><LessBusyForm onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }}><label>{t`Search companies`}<input type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} /></label><LessBusyRetry type="submit">{t`Search`}</LessBusyRetry></LessBusyForm>{loading && <p role="status">{t`Loading companies…`}</p>}{error ? <><p role="alert">{t`Could not load companies.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((company) => <li key={company.id}><LessBusyLink to={`/companies/${company.id}`}>{company.name}</LessBusyLink></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No companies match this view. Add a business or try another search.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more companies`}</LessBusyRetry>}</>}</LessBusySection></>;
};

export const LessBusyCompanies = () => {
  const { companyId } = useParams(); const workspace = useAtomStateValue(currentWorkspaceState); const access = useLessBusyObjectAccess('company');
  return <PageCardLayout header={<PageCardHeader title={t`Companies`} />}><LessBusyContent><LessBusyObjectGate objectName="company">{access.canReadFields('name') ? (companyId ? <CompanyProfile key={`${workspace?.id}:${companyId}`} id={companyId} /> : <CompanyDirectory key={workspace?.id} />) : <LessBusyDescription>{t`Company names are not available in your current access.`}</LessBusyDescription>}</LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
