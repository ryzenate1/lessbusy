import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import Papa from 'papaparse';
import { escapeForIlike, isValidUuid } from 'twenty-shared/utils';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

const KINDS = { orders: { object: 'lbSalesOrder', create: 'order' }, quotations: { object: 'lbQuotation', create: 'quotation' }, invoices: { object: 'lbInvoice', create: 'invoice' } } as const;
type SalesKind = keyof typeof KINDS;
type SalesRecord = ObjectRecord & { name: string; status?: string | null; currency?: string | null; totals?: { totalMinor?: string } | null; dueAt?: string | null; validUntil?: string | null; inventoryState?: string | null };

const SalesDirectory = ({ kind }: { kind: SalesKind }) => {
  const objectName = KINDS[kind].object;
  const access = useLessBusyObjectAccess(objectName);
  const customers = useLessBusyObjectAccess('person');
  const destinations = useLessBusyDestinations();
  const navigate = useNavigate();
  const [query, setQuery] = useState(''); const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); const [customerId, setCustomerId] = useState<string | null>(null);
  const filter: RecordGqlOperationFilter = { and: [...(search ? [{ name: { ilike: `%${escapeForIlike(search)}%` } }] : []), ...(status && access.canReadFields('status') ? [{ status: { eq: status } }] : []), ...(customerId && access.canReadFields('customerId') ? [{ customerId: { eq: customerId } }] : [])] };
  const optional = ['status', 'currency', 'totals', ...(kind === 'invoices' ? ['dueAt'] : kind === 'quotations' ? ['validUntil'] : ['inventoryState'])];
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<SalesRecord>({ objectNameSingular: objectName, filter, limit: 25, orderBy: [{ createdAt: 'DescNullsLast' }], recordGqlFields: { id: true, name: true, ...Object.fromEntries(optional.filter((field) => access.canReadFields(field)).map((field) => [field, true])) } });
  const statuses = { DRAFT: t`Draft`, SENT: t`Sent`, ACCEPTED: t`Accepted`, DECLINED: t`Declined`, CONFIRMED: t`Confirmed`, FULFILLED: t`Fulfilled`, FINALIZED: t`Finalized`, PART_PAID: t`Part paid`, PAID: t`Paid`, CREDITED: t`Credited`, CANCELLED: t`Cancelled` };
  const options = kind === 'quotations' ? ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'CANCELLED'] : kind === 'orders' ? ['DRAFT', 'CONFIRMED', 'FULFILLED', 'CANCELLED'] : ['DRAFT', 'FINALIZED', 'PART_PAID', 'PAID', 'CREDITED', 'CANCELLED'];
  const labels: Record<SalesKind, string> = { orders: t`Orders`, quotations: t`Quotations`, invoices: t`Invoices` };
  const exportLoaded = () => {
    const content = Papa.unparse(records.map((record) => ({ name: record.name, status: record.status ?? '', currency: record.currency ?? '', total_minor: record.totals?.totalMinor ?? '', date: record.dueAt ?? record.validUntil ?? '' })), { escapeFormulae: true });
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `lessbusy-${kind}-loaded-rows.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const native = destinations.find((destination) => destination.nameSingular === objectName);
  return <><LessBusySection><h1>{labels[kind]}</h1><LessBusyDescription>{kind === 'quotations' ? t`Prepare an offer, record the customer's decision and convert an accepted quotation into a linked order.` : kind === 'orders' ? t`Confirm a sale, reserve and fulfill its stock, and create a linked invoice.` : t`Review drafts, finalization, payments, credits and refunds from one clear list.`}</LessBusyDescription><LessBusyActions>{(Object.keys(KINDS) as SalesKind[]).filter((key) => destinations.some((destination) => destination.nameSingular === KINDS[key].object)).map((key) => <LessBusyRetry key={key} aria-pressed={key === kind} onClick={() => navigate(`/sales/${key}`)}>{labels[key]}</LessBusyRetry>)}</LessBusyActions><LessBusyActions>{access.canWrite && <LessBusyLink to={`/business/new/${KINDS[kind].create}`}>{kind === 'orders' ? t`Create order` : kind === 'quotations' ? t`Create quotation` : t`Create invoice`}</LessBusyLink>}{kind === 'invoices' && <><LessBusyLink to="/business/unpaid-invoices">{t`Unpaid and overdue`}</LessBusyLink><LessBusyLink to="/business/reports">{t`Sales report`}</LessBusyLink></>}{native && <LessBusyLink to={native.path}>{t`Saved views and full record tools`}</LessBusyLink>}</LessBusyActions></LessBusySection><LessBusySection><LessBusyForm onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }}><div data-row><label>{t`Search document names`}<input type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} /></label>{access.canReadFields('status') && <label>{t`Status`}<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{t`All statuses`}</option>{options.map((value) => <option key={value} value={value}>{statuses[value as keyof typeof statuses]}</option>)}</select></label>}</div>{customers.canReadFields('name') && access.canReadFields('customerId') && <FormSingleRecordPicker label={t`Customer (optional)`} objectNameSingulars={['person']} defaultValue={customerId} onClear={() => setCustomerId(null)} onChange={(value) => setCustomerId(typeof value === 'string' && isValidUuid(value) ? value : null)} />}<LessBusyActions><LessBusyRetry type="submit">{t`Search`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => { setQuery(''); setSearch(''); setStatus(''); setCustomerId(null); }}>{t`Clear filters`}</LessBusyRetry></LessBusyActions></LessBusyForm></LessBusySection><LessBusySection>{loading && <p role="status">{t`Loading documents…`}</p>}{error ? <><p role="alert">{t`Sales documents could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((record) => <li key={record.id}><LessBusyLink to={`/business/${kind}/${record.id}`}>{record.name}</LessBusyLink><LessBusyDescription>{record.status ? statuses[record.status as keyof typeof statuses] ?? record.status : ''}{record.currency && record.totals?.totalMinor ? ` · ${formatLessBusyMoney(record.totals.totalMinor, record.currency)}` : ''}{record.inventoryState ? ` · ${record.inventoryState.replaceAll('_', ' ')}` : ''}{record.dueAt || record.validUntil ? ` · ${new Date((record.dueAt || record.validUntil)!).toLocaleDateString()}` : ''}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No documents match this view. Choose another status or create a draft.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more documents`}</LessBusyRetry>}{records.length > 0 && <LessBusyRetry onClick={exportLoaded}>{t`Export loaded rows as CSV`}</LessBusyRetry>}</>}</LessBusySection></>;
};

export const LessBusySales = () => {
  const { salesKind } = useParams(); const workspace = useAtomStateValue(currentWorkspaceState); const destinations = useLessBusyDestinations();
  const fallback = (Object.keys(KINDS) as SalesKind[]).find((key) => destinations.some((destination) => destination.nameSingular === KINDS[key].object));
  const kind = salesKind && Object.hasOwn(KINDS, salesKind) ? salesKind as SalesKind : fallback;
  const access = useLessBusyObjectAccess(kind ? KINDS[kind].object : 'lbSalesOrder');
  return <PageCardLayout header={<PageCardHeader title={t`Sales`} />}><LessBusyContent>{kind && access.canReadFields('name') ? <SalesDirectory key={`${workspace?.id}:${kind}`} kind={kind} /> : <LessBusySection><LessBusyDescription>{t`Sales documents are available when the LessBusy Business modules are installed and your role can read them.`}</LessBusyDescription></LessBusySection>}</LessBusyContent></PageCardLayout>;
};
