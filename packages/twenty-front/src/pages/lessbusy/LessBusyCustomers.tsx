import Papa from 'papaparse';
import { LessBusyCustomerImport } from '@/lessbusy/components/LessBusyCustomerImport';
import { LessBusyCustomerBulkActions } from '@/lessbusy/components/LessBusyCustomerBulkActions';
import { LessBusyCustomerQuickActions } from '@/lessbusy/components/LessBusyCustomerQuickActions';
import { LessBusyCustomerSalesSummary } from '@/lessbusy/components/LessBusyCustomerSalesSummary';
import { LessBusyCustomerLastInteraction } from '@/lessbusy/components/LessBusyCustomerLastInteraction';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { LessBusyCustomerActivities } from '@/lessbusy/components/LessBusyCustomerActivities';
import { LessBusyRecentActivity } from '@/lessbusy/components/LessBusyRecentActivity';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { escapeForIlike } from 'twenty-shared/utils';
import { type RecordGqlFields, type RecordGqlOperationFilter } from 'twenty-shared/types';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyCustomerForm } from '@/lessbusy/components/LessBusyCustomerForm';
import { LessBusyCustomerRecords } from '@/lessbusy/components/LessBusyCustomerRecords';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type Customer = ObjectRecord & {
  name: { firstName: string; lastName: string };
  emails?: { primaryEmail: string; additionalEmails: string[] | null };
  phones?: { primaryPhoneNumber?: string; primaryPhoneCallingCode?: string };
  jobTitle?: string | null; lbSource?: string | null; lbTags?: string[] | null; lbBillingName?: string | null; lbBillingAddress?: string | null; lbTaxIdentifiers?: Record<string, string> | null; lbInstagramIdentity?: string | null; lbWhatsappIdentity?: string | null; lbAssignedEmployeeId?: string | null; companyId?: string | null; updatedAt?: string; lbArchivedAt?: string | null;
};

const CustomerDirectory = () => {
  const { canReadFields, canWriteFields } = useLessBusyObjectAccess('person');
  const destinations = useLessBusyDestinations();
  const canBulk = ['lbArchivedAt', 'lbTags', 'lbAssignedEmployee'].some((field) => canWriteFields(field));
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [sort, setSort] = useState<'recent' | 'name'>('recent');
  const member = useAtomStateValue(currentWorkspaceMemberState);
  const [source, setSource] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [archiveView, setArchiveView] = useState('active');
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { setSelected([]); }, [search, source, onlyMine, archiveView, sort]);
  const navigate = useNavigate();
  const pattern = `%${escapeForIlike(search)}%`;
  const searchFilter: RecordGqlOperationFilter | undefined = search ? { or: [{ name: { firstName: { ilike: pattern } } }, { name: { lastName: { ilike: pattern } } }, ...(canReadFields('emails') ? [{ emails: { primaryEmail: { ilike: pattern } } }] : [])] } : undefined;
  const filters: RecordGqlOperationFilter[] = [];
  if (canReadFields('lbArchivedAt') && archiveView !== 'all') filters.push({ lbArchivedAt: { is: archiveView === 'archived' ? 'NOT_NULL' : 'NULL' } });
  if (searchFilter) filters.push(searchFilter);
  if (source.trim() && canReadFields('lbSource')) filters.push({ lbSource: { ilike: `%${escapeForIlike(source.trim())}%` } });
  if (onlyMine && member && canReadFields('lbAssignedEmployee')) filters.push({ lbAssignedEmployeeId: { eq: member.id } });
  const filter = filters.length ? { and: filters } : undefined;
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Customer>({ objectNameSingular: 'person', filter, limit: 25, orderBy: sort === 'recent' ? [{ updatedAt: 'DescNullsLast' }] : [{ name: { firstName: 'AscNullsLast' } }, { name: { lastName: 'AscNullsLast' } }], recordGqlFields: { id: true, updatedAt: true, ...(canReadFields('lbArchivedAt') ? { lbArchivedAt: true } : {}), name: { firstName: true, lastName: true }, ...(canReadFields('emails') ? { emails: { primaryEmail: true } } : {}), ...(canReadFields('jobTitle') ? { jobTitle: true } : {}) } });
  const selectedRecords = records.filter((record) => selected.includes(record.id) && record.updatedAt).map((record) => ({ id: record.id, updatedAt: record.updatedAt! }));
  const exportLoaded = () => {
    const content = Papa.unparse(records.map((record) => ({ id: record.id, firstName: record.name?.firstName ?? '', lastName: record.name?.lastName ?? '', ...(canReadFields('emails') ? { email: record.emails?.primaryEmail ?? '' } : {}), ...(canReadFields('jobTitle') ? { jobTitle: record.jobTitle ?? '' } : {}), ...(canReadFields('lbArchivedAt') ? { archivedAt: record.lbArchivedAt ?? '' } : {}) })), { escapeFormulae: true });
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'lessbusy-customers-loaded.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (creating) return <LessBusySection><LessBusyCustomerForm onSaved={async (id) => { navigate(`/customers/${id}`); }} onCancel={() => setCreating(false)} /></LessBusySection>;
  return <>
    <LessBusySection><h1>{t`People behind your business.`}</h1><LessBusyDescription>{t`Find a customer and pick up their conversations, enquiries and sales in one place.`}</LessBusyDescription><LessBusyActions>{canWriteFields('name') && <LessBusyRetry onClick={() => setCreating(true)}>{t`Add customer`}</LessBusyRetry>}{canWriteFields('name', 'lbImportHash', 'lbArchivedAt', 'lbSource', 'lbTags', 'lbInstagramIdentity', 'lbWhatsappIdentity', 'emails') && <LessBusyLink to="/customers/import">{t`Import customers`}</LessBusyLink>}{records.length > 0 && <LessBusyRetry onClick={exportLoaded}>{hasNextPage ? t`Export loaded customers (partial)` : t`Export current results`}</LessBusyRetry>}{destinations.find((destination) => destination.nameSingular === 'person') && <LessBusyLink to={destinations.find((destination) => destination.nameSingular === 'person')!.path}>{t`Views, filters, bulk actions and import/export`}</LessBusyLink>}</LessBusyActions></LessBusySection>
    <LessBusySection><LessBusyForm onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }}><div data-row><label>{t`Search customers`}<input type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t`Name or email`} /></label><label>{t`Sort by`}<select value={sort} onChange={(event) => setSort(event.target.value === 'name' ? 'name' : 'recent')}><option value="recent">{t`Recently updated`}</option><option value="name">{t`Name`}</option></select></label></div>{canReadFields('lbSource') && <label>{t`Customer source`}<input maxLength={250} value={source} onChange={(event) => setSource(event.target.value)} placeholder={t`Filter by website, referral, Instagram…`} /></label>}{canReadFields('lbAssignedEmployee') && member && <label data-confirmation><input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} />{t`Assigned to me`}</label>}{canReadFields('lbArchivedAt') && <label>{t`Directory`}<select value={archiveView} onChange={(event) => setArchiveView(event.target.value)}><option value="active">{t`Active customers`}</option><option value="archived">{t`Archived customers`}</option><option value="all">{t`All customers`}</option></select></label>}<LessBusyActions><LessBusyRetry type="submit">{t`Search`}</LessBusyRetry>{search && <LessBusyRetry type="button" onClick={() => { setQuery(''); setSearch(''); }}>{t`Clear search`}</LessBusyRetry>}</LessBusyActions></LessBusyForm></LessBusySection>
    {selectedRecords.length > 0 && <LessBusySection><LessBusyCustomerBulkActions key={selectedRecords.map((record) => `${record.id}:${record.updatedAt}`).join(',')} records={selectedRecords} onSaved={async () => { setSelected([]); await refetch(); }} /></LessBusySection>}
    <LessBusySection>{canBulk && records.length > 0 && <LessBusyActions><LessBusyRetry disabled={loading} onClick={() => setSelected(records.slice(0, 50).map((record) => record.id))}>{t`Select up to 50 loaded customers`}</LessBusyRetry>{selected.length > 0 && <LessBusyRetry onClick={() => setSelected([])}>{t`Clear selection`}</LessBusyRetry>}</LessBusyActions>}{loading && <p role="status">{t`Loading customers…`}</p>}{error ? <><p role="alert">{t`Customers could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((customer) => <li key={customer.id}>{canBulk && <label style={{ display: 'inline-flex', gap: 12, alignItems: 'center', minHeight: 44 }}><input type="checkbox" aria-label={t`Select customer`} checked={selected.includes(customer.id)} disabled={!selected.includes(customer.id) && selected.length >= 50} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, customer.id] : previous.filter((id) => id !== customer.id))} /><span>{customer.lbArchivedAt ? t`Archived` : t`Customer`}</span></label>}<LessBusyLink to={`/customers/${customer.id}`}>{[customer.name?.firstName, customer.name?.lastName].filter(Boolean).join(' ') || t`Unnamed customer`}</LessBusyLink><LessBusyDescription>{[customer.emails?.primaryEmail, customer.jobTitle].filter(Boolean).join(' · ')}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{search ? t`No customers match this search. Try another name or email.` : t`No customers yet. Add your first customer, or use import in the full customer list.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry disabled={loading} onClick={() => void fetchMoreRecords()}>{t`Load more customers`}</LessBusyRetry>}</>}</LessBusySection>
  </>;
};

const CustomerProfile = ({ customerId }: { customerId: string }) => {
  const { canReadFields, canWriteFields } = useLessBusyObjectAccess('person');
  const destinations = useLessBusyDestinations();
  const conversationAccess = useLessBusyObjectAccess('lbConversationReference');
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('leads');
  const profileFields = Object.fromEntries(['lbSource', 'lbTags', 'lbBillingName', 'lbBillingAddress', 'lbTaxIdentifiers', 'lbInstagramIdentity', 'lbWhatsappIdentity', 'lbArchivedAt'].filter((field) => canReadFields(field)).map((field) => [field, true]));
  const fields: RecordGqlFields = { ...profileFields, ...(canReadFields('lbAssignedEmployee') ? { lbAssignedEmployeeId: true } : {}), id: true, name: { firstName: true, lastName: true }, ...(canReadFields('emails') ? { emails: { primaryEmail: true, additionalEmails: true } } : {}), ...(canReadFields('phones') ? { phones: { primaryPhoneNumber: true, primaryPhoneCallingCode: true } } : {}), ...(canReadFields('jobTitle') ? { jobTitle: true } : {}), ...(canReadFields('company') ? { companyId: true } : {}) };
  const { record: customer, loading, error, refetch } = useFindOneRecord<Customer>({ objectNameSingular: 'person', objectRecordId: customerId, recordGqlFields: fields });
  const has = (name: string) => destinations.some((destination) => destination.nameSingular === name);
  const tabs = [
    { key: 'tasks', object: 'task', label: t`Tasks` }, { key: 'notes', object: 'note', label: t`Notes` }, { key: 'activity', object: 'timelineActivity', label: t`Activity` }, { key: 'leads', object: 'lbLead', label: t`Leads` }, { key: 'deals', object: 'opportunity', label: t`Deals` }, { key: 'orders', object: 'lbSalesOrder', label: t`Orders` }, { key: 'invoices', object: 'lbInvoice', label: t`Invoices` }, { key: 'quotations', object: 'lbQuotation', label: t`Quotations` }, { key: 'messages', object: 'lbConversationReference', label: t`Conversations` },
  ].filter((item) => item.object === 'timelineActivity' ? true : item.object === 'lbConversationReference' ? conversationAccess.canReadFields('name', 'customerId', 'conversationId', 'handlingStatus') : has(item.object));
  const activeTab = tabs.find((item) => item.key === tab) ?? tabs[0];
  if (loading) return <p role="status">{t`Loading customer…`}</p>;
  if (error || !customer) return <><p role="alert">{t`This customer is unavailable in your workspace access.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></>;
  if (editing) return <LessBusySection><LessBusyCustomerForm customer={customer} onSaved={async () => { setEditing(false); await refetch(); }} onCancel={() => setEditing(false)} /></LessBusySection>;
  const phone = customer.phones?.primaryPhoneNumber ? `${customer.phones.primaryPhoneCallingCode ? `${customer.phones.primaryPhoneCallingCode.startsWith('+') ? '' : '+'}${customer.phones.primaryPhoneCallingCode} ` : ''}${customer.phones.primaryPhoneNumber}` : null;
  return <>
    <LessBusySection><LessBusyLink to="/customers">{t`All customers`}</LessBusyLink><h1>{[customer.name?.firstName, customer.name?.lastName].filter(Boolean).join(' ') || t`Customer`}</h1>{customer.lbArchivedAt && <LessBusyDescription>{t`This customer is archived. Their sales and history are kept; restore them from the archived customer directory.`}</LessBusyDescription>}{customer.jobTitle && <LessBusyDescription>{customer.jobTitle}</LessBusyDescription>}<LessBusyActions>{canWriteFields('name') && <LessBusyRetry onClick={() => setEditing(true)}>{t`Edit details`}</LessBusyRetry>}<LessBusyLink to={`/object/person/${customerId}`}>{t`Full record, notes, tasks and activity`}</LessBusyLink>{customer.companyId && has('company') && <LessBusyLink to={`/companies/${customer.companyId}`}>{t`Open company`}</LessBusyLink>}</LessBusyActions></LessBusySection>
    {(customer.lbSource || customer.lbTags?.length || customer.lbInstagramIdentity || customer.lbWhatsappIdentity) && <LessBusySection><h2>{t`Customer context`}</h2>{customer.lbSource && <p>{t`Source`}: {customer.lbSource}</p>}{Array.isArray(customer.lbTags) && <p>{customer.lbTags.filter((tag) => typeof tag === 'string').join(' · ')}</p>}{customer.lbInstagramIdentity && <p>{t`Instagram`}: {customer.lbInstagramIdentity}</p>}{customer.lbWhatsappIdentity && <p>{t`WhatsApp identity`}: {customer.lbWhatsappIdentity}</p>}</LessBusySection>}
    <LessBusySection><LessBusyCustomerLastInteraction customerId={customerId} /></LessBusySection>
    <LessBusySection><h2>{t`Contact details`}</h2>{customer.emails?.primaryEmail && <p>{customer.emails.primaryEmail}</p>}{phone && <p>{phone}</p>}{!customer.emails?.primaryEmail && !phone && <LessBusyDescription>{t`No contact details have been supplied in your current access. A phone number is optional.`}</LessBusyDescription>}</LessBusySection>
    <LessBusySection><LessBusyCustomerQuickActions customerId={customerId} customerName={[customer.name?.firstName, customer.name?.lastName].filter(Boolean).join(' ') || t`Customer`} /></LessBusySection>
    <LessBusyCustomerSalesSummary customerId={customerId} />
    <LessBusySection><LessBusyActions>{tabs.map((item) => <LessBusyRetry key={item.key} aria-pressed={activeTab?.key === item.key} onClick={() => setTab(item.key)}>{item.label}</LessBusyRetry>)}</LessBusyActions><h2 style={{ marginTop: 24 }}>{activeTab?.label}</h2>{activeTab ? (activeTab.object === 'task' || activeTab.object === 'note' ? <LessBusyCustomerActivities customerId={customerId} kind={activeTab.object} /> : activeTab.object === 'timelineActivity' ? <LessBusyRecentActivity customerId={customerId} /> : <LessBusyCustomerRecords objectName={activeTab.object} customerId={customerId} />) : <LessBusyDescription>{t`Enable business modules to see related leads, sales documents and conversations here. Notes, tasks and activity remain in the full record.`}</LessBusyDescription>}</LessBusySection>
  </>;
};

export const LessBusyCustomers = () => {
  const { customerId } = useParams();
  const workspace = useAtomStateValue(currentWorkspaceState);
  const { canReadFields, canWriteFields } = useLessBusyObjectAccess('person');
  const canImport = canWriteFields('name', 'lbImportHash', 'lbArchivedAt', 'lbSource', 'lbTags', 'lbInstagramIdentity', 'lbWhatsappIdentity', 'emails') && canReadFields('lbImportHash', 'emails', 'lbInstagramIdentity', 'lbWhatsappIdentity');
  return <PageCardLayout header={<PageCardHeader title={t`Customers`} />}><LessBusyContent><LessBusyObjectGate objectName="person">{canReadFields('name') ? (customerId === 'import' ? (canImport ? <LessBusySection><LessBusyCustomerImport key={workspace?.id} /></LessBusySection> : <LessBusyDescription>{t`Customer import requires the installed LessBusy customer fields and permission to create and read their values.`}</LessBusyDescription>) : customerId ? <CustomerProfile key={`${workspace?.id}:${customerId}`} customerId={customerId} /> : <CustomerDirectory key={workspace?.id} />) : <LessBusyDescription>{t`The customer workspace is available when your role can read customer names.`}</LessBusyDescription>}</LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
