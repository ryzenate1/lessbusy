import { useSearchParams } from 'react-router-dom';
import { LessBusyConversationLinks } from '@/lessbusy/components/LessBusyConversationLinks';
import { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';

const statusSchema = z.object({ configured: z.boolean(), connected: z.boolean(), message: z.string().optional() });
const listSchema = z.object({ conversations: z.array(z.object({ id: z.number(), customerName: z.string(), status: z.string(), handlingStatus: z.string().nullable().optional(), replyStatus: z.string().nullable().optional(), lastMessageAt: z.string().nullable().optional() })), hasMore: z.boolean().optional() });
const messageSchema = z.object({ messages: z.array(z.object({ id: z.number(), content: z.string(), type: z.union([z.number(), z.string()]), createdAt: z.number().optional() })), hasMore: z.boolean() });

const ConversationMessages = ({ conversationId, onHandoff }: { conversationId: number; onHandoff: () => void }) => {
  const { request, pending, error } = useLessBusyApi();
  const [messages, setMessages] = useState<z.infer<typeof messageSchema>['messages']>([]);
  const [hasMore, setHasMore] = useState(false);
  const [confirmHandoff, setConfirmHandoff] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(async (before?: number) => {
    try {
      const result = messageSchema.parse(await request(`chatwoot/conversations/${conversationId}/messages${before ? `?before=${before}` : ''}`));
      setMessages((previous) => {
        const unique = new Map((before ? [...previous, ...result.messages] : result.messages).map((message) => [message.id, message]));
        return [...unique.values()].sort((left, right) => left.id - right.id);
      });
      setHasMore(result.hasMore);
    } catch { setHasMore(false); }
  }, [conversationId, request]);
  useEffect(() => { void load(); }, [load]);
  return <LessBusySection><h2>{t`Conversation`}</h2>
    <LessBusyActions><LessBusyRetry onClick={() => void load()} disabled={pending}>{t`Refresh messages`}</LessBusyRetry><LessBusyRetry onClick={() => setConfirmHandoff(true)} disabled={pending}>{t`Hand off to a person`}</LessBusyRetry></LessBusyActions>
    {confirmHandoff && <div><p>{t`Open this conversation for your team to handle in Chatwoot?`}</p><LessBusyActions><LessBusyRetry disabled={pending} onClick={async () => { try { await request(`chatwoot/conversations/${conversationId}/handoff`, 'POST', { confirmed: true }); setConfirmHandoff(false); setNotice(t`Opened for human handling in Chatwoot.`); onHandoff(); } catch { setNotice(null); } }}>{t`Confirm handoff`}</LessBusyRetry><LessBusyRetry onClick={() => setConfirmHandoff(false)}>{t`Back`}</LessBusyRetry></LessBusyActions></div>}
    {pending && <p role="status">{t`Loading…`}</p>}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {hasMore && messages.length > 0 && <LessBusyRetry disabled={pending} onClick={() => void load(messages[0].id)}>{t`Load older messages`}</LessBusyRetry>}
    <LessBusyTaskList>{messages.map((message) => <li key={message.id}><LessBusyDescription>{message.type === 0 || message.type === 'incoming' ? t`Customer` : t`Team`}</LessBusyDescription><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content}</p>{message.createdAt && <time dateTime={new Date(message.createdAt * 1000).toISOString()}>{new Date(message.createdAt * 1000).toLocaleString()}</time>}</li>)}</LessBusyTaskList>
    {!pending && !error && messages.length === 0 && <LessBusyDescription>{t`No public messages are available in this conversation.`}</LessBusyDescription>}
  </LessBusySection>;
};

const MessagesInbox = () => {
  const { request, pending, error } = useLessBusyApi();
  const [status, setStatus] = useState<z.infer<typeof statusSchema> | null>(null);
  const [conversations, setConversations] = useState<z.infer<typeof listSchema>['conversations']>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = ['awaiting_business', 'human', 'resolved'].includes(searchParams.get('view') ?? '') ? searchParams.get('view')! : 'all';
  const selectView = (value: string) => { const next = new URLSearchParams(searchParams); next.set('view', value); setSearchParams(next); };
  const candidate = Number(searchParams.get('conversation'));
  const selected = Number.isSafeInteger(candidate) && candidate > 0 ? candidate : null;
  const selectConversation = (id: number) => { const next = new URLSearchParams(searchParams); next.set('conversation', String(id)); setSearchParams(next); };
  const loadConversations = useCallback(async (nextPage = 1) => {
    try { const result = listSchema.parse(await request(`chatwoot/conversations?page=${nextPage}&view=${view}`)); setConversations((previous) => nextPage === 1 ? result.conversations : [...new Map([...previous, ...result.conversations].map((conversation) => [conversation.id, conversation])).values()]); setPage(nextPage); setHasMore(Boolean(result.hasMore)); } catch { setHasMore(false); }
  }, [request, view]);
  const connect = useCallback(async () => { try { const result = statusSchema.parse(await request('chatwoot/status')); setStatus(result); if (result.connected) await loadConversations(); } catch { setStatus(null); } }, [request, loadConversations]);
  useEffect(() => { void connect(); }, [connect]);
  return <>
    <LessBusySection><h1>{t`Every conversation has a next step.`}</h1><LessBusyDescription>{t`Your connected inbox, with messages kept in Chatwoot and customer work kept in LessBusy.`}</LessBusyDescription></LessBusySection>
    {pending && <LessBusySection><p role="status">{t`Loading inbox…`}</p></LessBusySection>}
    {error && <LessBusySection><p role="alert">{error}</p><LessBusyRetry onClick={() => void connect()}>{t`Retry connection`}</LessBusyRetry></LessBusySection>}
    {status && !status.configured && <LessBusySection><h2>{t`Connect your messaging inbox`}</h2><LessBusyDescription>{t`Ask your workspace administrator to connect Chatwoot, choose the allowed inboxes and enable signed webhooks. Once connected, authorized conversations will appear here.`}</LessBusyDescription><LessBusyLink to="/integrations">{t`Open integration settings`}</LessBusyLink></LessBusySection>}
    {status?.configured && !status.connected && <LessBusySection><h2>{t`Your inbox needs attention`}</h2><LessBusyDescription>{t`The configured messaging service could not be reached. Your administrator can review the connection.`}</LessBusyDescription><LessBusyRetry onClick={() => void connect()}>{t`Try again`}</LessBusyRetry></LessBusySection>}
    {status?.connected && <LessBusySection><h2>{t`Conversations`}</h2><LessBusyActions>{[{ value: 'all', label: t`All conversations` }, { value: 'awaiting_business', label: t`Needs our reply` }, { value: 'human', label: t`Human handling` }, { value: 'resolved', label: t`Resolved` }].map((item) => <LessBusyRetry key={item.value} aria-pressed={view === item.value} onClick={() => selectView(item.value)}>{item.label}</LessBusyRetry>)}</LessBusyActions><LessBusyTaskList>{conversations.map((conversation) => <li key={conversation.id}><LessBusyRetry aria-pressed={selected === conversation.id} onClick={() => selectConversation(conversation.id)}>{conversation.customerName || t`Conversation ${conversation.id}`}</LessBusyRetry><LessBusyDescription>{conversation.status} · {conversation.handlingStatus?.replaceAll('_', ' ') || t`Awaiting business`}{conversation.replyStatus ? ` · ${conversation.replyStatus.replaceAll('_', ' ')}` : ''}{conversation.lastMessageAt ? ` · ${new Date(conversation.lastMessageAt).toLocaleString()}` : ''}</LessBusyDescription></li>)}</LessBusyTaskList>{!pending && !error && conversations.length === 0 && <LessBusyDescription>{t`No conversations in the checked pages match this view and your access. Load more conversations if available. Signed webhooks add references as events arrive.`}</LessBusyDescription>}{hasMore && <LessBusyRetry disabled={pending} onClick={() => void loadConversations(page + 1)}>{t`Load more conversations`}</LessBusyRetry>}</LessBusySection>}
    {selected && <div key={selected}><LessBusyConversationLinks conversationId={selected} /><ConversationMessages conversationId={selected} onHandoff={() => void loadConversations()} /></div>}
  </>;
};

export const LessBusyMessages = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Messages`} />}><LessBusyContent><MessagesInbox key={workspace?.id} /></LessBusyContent></PageCardLayout>;
};
