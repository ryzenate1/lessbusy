import { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type Lead = ObjectRecord & { name: string; recommendedAction: string | null; nextFollowUpAt: string | null };
const LeadAttention = () => {
  const { records, loading, error, refetch } = useFindManyRecords<Lead>({ objectNameSingular: 'lbLead', filter: { and: [{ handlingStatus: { neq: 'RESOLVED' } }, { or: [{ temperature: { eq: 'HOT' } }, { priority: { in: ['HIGH', 'CRITICAL'] } }] }] }, limit: 5, orderBy: [{ nextFollowUpAt: 'AscNullsLast' }], recordGqlFields: { id: true, name: true, recommendedAction: true, nextFollowUpAt: true } });
  return <LessBusySection><h2>{t`Customers to follow up with`}</h2>{loading && <p role="status">{t`Loading leads…`}</p>}{error ? <><p role="alert">{t`Could not load follow-ups.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((lead) => <li key={lead.id}><LessBusyLink to={`/business/leads/${lead.id}`}>{lead.name || t`Lead`}</LessBusyLink><LessBusyDescription>{lead.recommendedAction || t`Review the enquiry and choose the next step.`}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No hot or high-priority unresolved leads in your access.`}</LessBusyDescription>}</>}<LessBusyLink to="/business/hot-leads">{t`Open hot leads`}</LessBusyLink></LessBusySection>;
};

type Conversation = ObjectRecord & { name: string; conversationId: string; handlingStatus: string };
const ConversationAttention = () => {
  const { records, loading, error, refetch } = useFindManyRecords<Conversation>({ objectNameSingular: 'lbConversationReference', filter: { replyStatus: { eq: 'AWAITING_BUSINESS' } }, limit: 5, orderBy: [{ lastSyncedAt: 'DescNullsLast' }], recordGqlFields: { id: true, name: true, conversationId: true, handlingStatus: true } });
  return <LessBusySection><h2>{t`Conversations for your team`}</h2>{loading && <p role="status">{t`Loading conversations…`}</p>}{error ? <><p role="alert">{t`Could not load conversations.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((conversation) => <li key={conversation.id}><LessBusyLink to={`/messages?conversation=${encodeURIComponent(conversation.conversationId)}`}>{conversation.name || t`Conversation`}</LessBusyLink><LessBusyDescription>{conversation.handlingStatus === 'HUMAN_HANDLING' ? t`Handed to a person` : t`Awaiting our team`}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No synchronized conversations are awaiting your team in this view.`}</LessBusyDescription>}</>}<LessBusyLink to="/messages">{t`Open messages`}</LessBusyLink></LessBusySection>;
};

const stockSchema = z.object({ items: z.array(z.object({ id: z.string().uuid(), name: z.string(), availableUnits: z.number(), thresholdUnits: z.number() })), hasMore: z.boolean(), scanned: z.number() });
const StockAttention = () => {
  const { request, pending, error } = useLessBusyApi();
  const [result, setResult] = useState<z.infer<typeof stockSchema> | null>(null);
  const load = useCallback(async () => { try { setResult(stockSchema.parse(await request('inventory/low-stock'))); } catch { setResult(null); } }, [request]);
  useEffect(() => { void load(); }, [load]);
  return <LessBusySection><h2>{t`Stock to replenish`}</h2>{pending && <p role="status">{t`Checking stock…`}</p>}{error && <><p role="alert">{error}</p><LessBusyRetry onClick={() => void load()}>{t`Retry`}</LessBusyRetry></>}{result && <><LessBusyTaskList>{result.items.slice(0, 5).map((item) => <li key={item.id}><LessBusyLink to={`/inventory/${item.id}`}>{item.name}</LessBusyLink><LessBusyDescription>{t`${item.availableUnits} available · minimum ${item.thresholdUnits}`}</LessBusyDescription></li>)}</LessBusyTaskList><LessBusyDescription>{result.hasMore ? t`Checked ${result.scanned} balances. Continue in inventory to check the remaining stock.` : result.items.length ? t`Open inventory to review the checked stock.` : t`No low-stock items among the balances checked in your access.`}</LessBusyDescription></>}<LessBusyLink to="/business/low-stock">{t`Review low stock`}</LessBusyLink></LessBusySection>;
};

export const LessBusyAttentionQueues = () => {
  const destinations = useLessBusyDestinations();
  const leads = useLessBusyObjectAccess('lbLead');
  const conversations = useLessBusyObjectAccess('lbConversationReference');
  const stock = useLessBusyObjectAccess('lbStockBalance');
  const variants = useLessBusyObjectAccess('lbProductVariant');
  const enabled = (name: string) => destinations.some((destination) => destination.nameSingular === name);
  return <>
    {enabled('lbLead') && leads.canReadFields('name', 'temperature', 'priority', 'handlingStatus', 'recommendedAction', 'nextFollowUpAt') && <LeadAttention />}
    {conversations.canReadFields('name', 'conversationId', 'handlingStatus', 'replyStatus', 'lastSyncedAt') && <ConversationAttention />}
    {enabled('lbStockBalance') && stock.canReadFields('name', 'variant', 'onHandUnits', 'reservedUnits') && variants.canReadFields('lowStockThresholdUnits', 'sku') && <StockAttention />}
  </>;
};
