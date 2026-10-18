import { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { LessBusyDescription, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
const schema = z.object({ configured: z.boolean(), lastSuccessAt: z.string().optional(), lastFailureAt: z.string().optional(), attempts: z.array(z.object({ eventKey: z.string(), event: z.string(), status: z.enum(['SUCCESS', 'FAILED']), at: z.string(), errorCode: z.string().optional() })) });
export const LessBusyIntegrationActivity = () => {
  const { request, pending, error } = useLessBusyApi();
  const [activity, setActivity] = useState<z.infer<typeof schema> | null>(null);
  const load = useCallback(async () => { try { setActivity(schema.parse(await request('chatwoot/settings/activity'))); } catch { setActivity(null); } }, [request]);
  useEffect(() => { void load(); }, [load]);
  return <><h2>{t`Recent synchronization attempts`}</h2><LessBusyDescription>{t`The last twenty worker outcomes for this connection. A failure may be retried by the queue. This history excludes message text, credentials and provider error details.`}</LessBusyDescription>{pending && <p role="status">{t`Loading synchronization activity…`}</p>}{error && <p role="alert">{error}</p>}{activity?.lastSuccessAt && <p>{t`Latest successful sync`}: {new Date(activity.lastSuccessAt).toLocaleString()}</p>}{activity?.lastFailureAt && <p>{t`Latest failed attempt`}: {new Date(activity.lastFailureAt).toLocaleString()}</p>}<LessBusyTaskList>{activity?.attempts.map((attempt, index) => <li key={`${attempt.eventKey}:${attempt.at}:${index}`}><p>{attempt.event} · {attempt.status === 'SUCCESS' ? t`Synchronized` : t`Needs attention`}</p><time dateTime={attempt.at}>{new Date(attempt.at).toLocaleString()}</time>{attempt.status === 'FAILED' && <LessBusyDescription>{t`Check saved connection health, allowed inboxes and the worker logs. The queue may still retry this event.`}</LessBusyDescription>}</li>)}</LessBusyTaskList>{activity && !activity.attempts.length && <p>{t`No synchronization attempts have been recorded for this connection yet.`}</p>}<LessBusyRetry disabled={pending} onClick={() => void load()}>{t`Refresh activity`}</LessBusyRetry></>;
};
