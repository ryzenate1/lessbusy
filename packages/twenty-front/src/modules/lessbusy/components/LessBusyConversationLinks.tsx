import { LessBusyConversationCustomer } from '@/lessbusy/components/LessBusyConversationCustomer';
import { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { isValidUuid } from 'twenty-shared/utils';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';

const linkSchema = z.object({ customerId: z.string().uuid().nullable(), leadId: z.string().uuid().nullable(), version: z.number().int().nonnegative(), canRememberContact: z.boolean().optional(), identityVersion: z.number().int().nonnegative().nullable().optional(), identityCustomerId: z.string().uuid().nullable().optional() });

export const LessBusyConversationLinks = ({ conversationId }: { conversationId: number }) => {
  const { request, pending, error } = useLessBusyApi();
  const destinations = useLessBusyDestinations();
  const [saved, setSaved] = useState<z.infer<typeof linkSchema> | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [rememberContact, setRememberContact] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const canChooseCustomer = destinations.some((destination) => destination.nameSingular === 'person');
  const canChooseLead = destinations.some((destination) => destination.nameSingular === 'lbLead');
  const load = useCallback(async () => {
    try {
      const result = linkSchema.parse(await request(`chatwoot/conversations/${conversationId}/crm`));
      setSaved(result); setCustomerId(result.customerId); setLeadId(result.leadId); setConfirmed(false);
    } catch { setSaved(null); }
  }, [request, conversationId]);
  useEffect(() => { void load(); }, [load]);
  return <LessBusySection><h2>{t`Linked customer and lead`}</h2>
    <LessBusyDescription>{t`Connect this enquiry to existing CRM records. Future message qualification can update the linked lead while preserving classifications your team has entered.`}</LessBusyDescription>
    {saved && <LessBusyForm onSubmit={async (event) => {
      event.preventDefault(); if (pending || !confirmed) return;
      setNotice(null);
      try {
        const result = linkSchema.parse(await request(`chatwoot/conversations/${conversationId}/crm`, 'PUT', { customerId, leadId, expectedVersion: saved.version, rememberContact, expectedIdentityVersion: saved.identityVersion ?? null, confirmed: true }));
        setSaved(result); setConfirmed(false); setNotice(t`CRM links saved.`);
      } catch { setNotice(null); }
    }}>
      {canChooseCustomer && <FormSingleRecordPicker label={t`Customer`} objectNameSingulars={['person']} defaultValue={customerId} onClear={() => { setCustomerId(null); setConfirmed(false); }} onChange={(value) => { setCustomerId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}
      {canChooseLead && <FormSingleRecordPicker label={t`Lead`} objectNameSingulars={['lbLead']} defaultValue={leadId} onClear={() => { setLeadId(null); setConfirmed(false); }} onChange={(value) => { setLeadId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}
      {saved.canRememberContact && canChooseCustomer && <><label data-confirmation><input type="checkbox" checked={rememberContact} onChange={(event) => { setRememberContact(event.target.checked); setConfirmed(false); }} />{t`Use this customer for future conversations from the same messaging contact`}</label><LessBusyDescription>{t`This changes the shared provider-contact mapping. Existing conversation links and lead histories are kept.`}</LessBusyDescription>{saved.identityCustomerId && <LessBusyLink to={`/customers/${saved.identityCustomerId}`}>{t`Open the currently remembered customer`}</LessBusyLink>}</>}
      <LessBusyActions>{saved.customerId && canChooseCustomer && <LessBusyLink to={`/object/person/${saved.customerId}`}>{t`Open customer`}</LessBusyLink>}{saved.leadId && canChooseLead && <LessBusyLink to={`/business/leads/${saved.leadId}`}>{t`Open lead`}</LessBusyLink>}</LessBusyActions>
      {(canChooseCustomer || canChooseLead) && <><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed the customer and lead links.`}</label><LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Saving…` : t`Save links`}</LessBusyRetry></>}
    </LessBusyForm>}
    {saved && !saved.customerId && <LessBusyConversationCustomer key={`${conversationId}:${saved.version}`} conversationId={conversationId} expectedVersion={saved.version} canRememberContact={Boolean(saved.canRememberContact)} expectedIdentityVersion={saved.identityVersion ?? null} onSaved={load} />}
    <LessBusyRetry disabled={pending} onClick={() => void load()}>{t`Reload links`}</LessBusyRetry>
    {pending && <p role="status">{t`Loading…`}</p>}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </LessBusySection>;
};
