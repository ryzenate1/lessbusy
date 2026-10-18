import { LessBusyIntegrationActivity } from '@/lessbusy/components/LessBusyIntegrationActivity';
import { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const settingsSchema = z.object({ configured: z.boolean(), readOnly: z.boolean(), version: z.number().nullable(), id: z.string().uuid().optional(), baseUrl: z.string().optional(), accountId: z.number().optional(), inboxIds: z.array(z.number()).optional(), enabled: z.boolean().optional(), hasApiToken: z.boolean().optional(), hasWebhookSecret: z.boolean().optional(), webhookPath: z.string().optional() });
const healthSchema = z.object({ connected: z.boolean(), message: z.string().optional(), inboxes: z.array(z.object({ id: z.number(), name: z.string(), enabled: z.boolean() })).optional() });

const ChatwootSettings = () => {
  const { request, pending, error } = useLessBusyApi();
  const [settings, setSettings] = useState<z.infer<typeof settingsSchema> | null>(null);
  const [health, setHealth] = useState<z.infer<typeof healthSchema> | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [accountId, setAccountId] = useState('');
  const [inboxes, setInboxes] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const apply = useCallback((result: z.infer<typeof settingsSchema>) => { setSettings(result); setBaseUrl(result.baseUrl ?? ''); setAccountId(result.accountId ? String(result.accountId) : ''); setInboxes(result.inboxIds?.join(', ') ?? ''); setEnabled(result.enabled ?? false); setConfirmed(false); }, []);
  const load = useCallback(async () => { try { apply(settingsSchema.parse(await request('chatwoot/settings'))); } catch { setSettings(null); } }, [request, apply]);
  useEffect(() => { void load(); }, [load]);
  if (!settings) return <LessBusySection>{pending ? <p role="status">{t`Loading integration settings…`}</p> : <><p role="alert">{error || t`Integration settings are available to workspace administrators with applications permission.`}</p><LessBusyRetry onClick={() => void load()}>{t`Reload settings`}</LessBusyRetry></>}</LessBusySection>;
  return <><LessBusySection><h1>{t`Connect your conversations.`}</h1><LessBusyDescription>{t`Connect one Chatwoot account to this workspace and choose which inboxes LessBusy may use. Messages stay in Chatwoot; customer and business records stay in LessBusy.`}</LessBusyDescription>{settings.readOnly && <p>{t`This connection is managed by server environment configuration. Ask your server administrator to change it.`}</p>}</LessBusySection><LessBusySection><LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (!confirmed || pending || settings.readOnly) return;
    setValidation(null); setNotice(null);
    try {
      const inboxIds = inboxes.split(',').map((value) => Number(value.trim()));
      const result = settingsSchema.parse(await request('chatwoot/settings', 'PUT', { baseUrl: baseUrl.trim(), accountId: Number(accountId), inboxIds, enabled, expectedVersion: settings.version, confirmed: true, ...(apiToken ? { apiToken } : {}), ...(webhookSecret ? { webhookSecret } : {}) }));
      apply(result); setApiToken(''); setWebhookSecret(''); setHealth(null); setNotice(t`Connection settings saved. Credentials remain encrypted on the server.`);
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not save the connection.`); }
  }}><fieldset disabled={settings.readOnly || pending}><legend>{t`Chatwoot connection`}</legend><label>{t`Chatwoot base URL`}<input type="url" required value={baseUrl} onChange={(event) => { setBaseUrl(event.target.value); setConfirmed(false); }} placeholder="https://inbox.example.com" /></label><label>{t`Account ID`}<input type="number" required min={1} step={1} value={accountId} onChange={(event) => { setAccountId(event.target.value); setConfirmed(false); }} /></label><label>{t`Allowed inbox IDs, separated by commas`}<input required value={inboxes} onChange={(event) => { setInboxes(event.target.value); setConfirmed(false); }} placeholder="1, 2" /></label><label>{settings.hasApiToken ? t`Replace API token (leave blank to keep it)` : t`API token`}<input type="password" required={!settings.hasApiToken} value={apiToken} autoComplete="new-password" onChange={(event) => { setApiToken(event.target.value); setConfirmed(false); }} /></label><label>{settings.hasWebhookSecret ? t`Replace webhook secret (leave blank to keep it)` : t`Webhook signing secret`}<input type="password" minLength={24} required={!settings.hasWebhookSecret} value={webhookSecret} autoComplete="new-password" onChange={(event) => { setWebhookSecret(event.target.value); setConfirmed(false); }} /></label><label data-confirmation><input type="checkbox" checked={enabled} onChange={(event) => { setEnabled(event.target.checked); setConfirmed(false); }} />{t`Enable conversation synchronization`}</label></fieldset>
    {!settings.readOnly && <><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed the account, allowed inboxes and synchronization setting.`}</label><LessBusyRetry type="submit" disabled={!confirmed || pending}>{pending ? t`Saving…` : t`Save connection`}</LessBusyRetry></>}{(error || validation) && <p role="alert">{error || validation}</p>}{notice && <p role="status">{notice}</p>}
  </LessBusyForm></LessBusySection>{settings.configured && <LessBusySection><h2>{t`Connection health and webhook`}</h2><LessBusyDescription>{t`Use the same signing secret in Chatwoot. Configure conversation and message events for this webhook address. Save settings before checking account access.`}</LessBusyDescription>{settings.webhookPath && <p style={{ overflowWrap: 'anywhere' }}>{`${REACT_APP_SERVER_BASE_URL}${settings.webhookPath}`}</p>}<LessBusyActions><LessBusyRetry disabled={pending} onClick={async () => { try { setHealth(healthSchema.parse(await request('chatwoot/settings/health'))); } catch { setHealth(null); } }}>{t`Check saved connection`}</LessBusyRetry><LessBusyLink to="/messages">{t`Open messages`}</LessBusyLink></LessBusyActions>{health && <><p role="status">{health.connected ? t`Account connection succeeded.` : health.message || t`Connection needs attention.`}</p><LessBusyTaskList>{health.inboxes?.map((inbox) => <li key={inbox.id}>{inbox.name} · {inbox.id} · {inbox.enabled ? t`Allowed` : t`Not allowed`}</li>)}</LessBusyTaskList></>}</LessBusySection>}{settings.configured && <LessBusySection><LessBusyIntegrationActivity key={settings.id} /></LessBusySection>}</>;
};

export const LessBusyIntegrations = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Integrations`} />}><LessBusyContent><ChatwootSettings key={workspace?.id} /></LessBusyContent></PageCardLayout>;
};
