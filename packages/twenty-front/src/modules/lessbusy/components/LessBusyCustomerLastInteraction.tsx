import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyDescription, LessBusyLink } from '@/lessbusy/components/LessBusyStyles';

const CustomerLastInteraction = ({ customerId }: { customerId: string }) => {
  const { records, loading, error } = useFindManyRecords<ObjectRecord & { conversationId: string; lastMessageAt: string | null; replyStatus: string | null }>({ objectNameSingular: 'lbConversationReference', filter: { and: [{ customerId: { eq: customerId } }, { lastMessageAt: { is: 'NOT_NULL' } }] }, orderBy: [{ lastMessageAt: 'DescNullsLast' }], limit: 1, recordGqlFields: { id: true, conversationId: true, lastMessageAt: true, replyStatus: true } });
  if (loading) return <LessBusyDescription>{t`Loading latest messaging interaction…`}</LessBusyDescription>;
  if (error || !records[0]?.lastMessageAt) return null;
  const latest = records[0];
  return <><LessBusyDescription>{t`Latest synchronized message`}: {new Date(latest.lastMessageAt!).toLocaleString()} · {latest.replyStatus?.replaceAll('_', ' ')}</LessBusyDescription><LessBusyLink to={`/messages?conversation=${encodeURIComponent(latest.conversationId)}`}>{t`Open latest conversation`}</LessBusyLink></>;
};

export const LessBusyCustomerLastInteraction = ({ customerId }: { customerId: string }) => {
  const access = useLessBusyObjectAccess('lbConversationReference');
  return access.canReadFields('customerId', 'conversationId', 'lastMessageAt', 'replyStatus') ? <CustomerLastInteraction customerId={customerId} /> : null;
};
