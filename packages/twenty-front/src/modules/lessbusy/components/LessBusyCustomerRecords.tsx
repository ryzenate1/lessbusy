import { t } from '@lingui/core/macro';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type LessBusyCustomerRecordsProps = { objectName: string; customerId: string };
type CustomerRelatedRecord = ObjectRecord & { name?: string; status?: string; temperature?: string; conversationId?: string; handlingStatus?: string };

const CustomerRecords = ({ objectName, customerId }: LessBusyCustomerRecordsProps) => {
  const { canReadFields } = useLessBusyObjectAccess(objectName);
  const isConversation = objectName === 'lbConversationReference';
  const filter: RecordGqlOperationFilter = { [objectName === 'opportunity' ? 'pointOfContactId' : 'customerId']: { eq: customerId } };
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<CustomerRelatedRecord>({
    objectNameSingular: objectName, filter, limit: 15, orderBy: [{ createdAt: 'DescNullsLast' }],
    recordGqlFields: { id: true, name: true, ...(canReadFields('status') ? { status: true } : {}), ...(canReadFields('temperature') ? { temperature: true } : {}), ...(isConversation ? { conversationId: true, handlingStatus: true } : {}) },
  });
  const destination = (record: CustomerRelatedRecord) => {
    if (isConversation) return `/messages?conversation=${encodeURIComponent(record.conversationId ?? '')}`;
    if (objectName === 'lbLead') return `/business/leads/${record.id}`;
    if (objectName === 'lbInvoice') return `/business/invoices/${record.id}`;
    if (objectName === 'lbSalesOrder') return `/business/orders/${record.id}`;
    if (objectName === 'lbQuotation') return `/business/quotations/${record.id}`;
    return `/object/${objectName}/${record.id}`;
  };
  return <>{loading && <p role="status">{t`Loading related records…`}</p>}{error ? <><p role="alert">{t`We could not load these records.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((record) => <li key={record.id}><LessBusyLink to={destination(record)}>{record.name || t`Unnamed record`}</LessBusyLink><LessBusyDescription>{(record.status || record.temperature || record.handlingStatus || '').replaceAll('_', ' ')}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && records.length === 0 && <LessBusyDescription>{t`No linked records are available in your access yet.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry disabled={loading} onClick={() => void fetchMoreRecords()}>{t`Load more`}</LessBusyRetry>}</>}</>;
};

export const LessBusyCustomerRecords = ({ objectName, customerId }: LessBusyCustomerRecordsProps) => {
  const { canReadFields } = useLessBusyObjectAccess(objectName);
  const destinations = useLessBusyDestinations();
  const moduleEnabled = objectName === 'lbConversationReference' || destinations.some((destination) => destination.nameSingular === objectName);
  const requiredFields = ['name', objectName === 'opportunity' ? 'pointOfContact' : 'customerId', ...(objectName === 'lbConversationReference' ? ['conversationId', 'handlingStatus'] : [])];
  if (!moduleEnabled || !canReadFields(...requiredFields)) return <LessBusyDescription>{t`These related records are shown when this module and its required fields are available in your workspace access.`}</LessBusyDescription>;
  return <CustomerRecords key={`${objectName}:${customerId}`} objectName={objectName} customerId={customerId} />;
};
