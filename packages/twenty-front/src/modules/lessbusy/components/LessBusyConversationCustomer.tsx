import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyDescription, LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

type Props = { conversationId: number; expectedVersion: number; canRememberContact: boolean; expectedIdentityVersion: number | null; onSaved: () => Promise<void> };
export const LessBusyConversationCustomer = ({ conversationId, expectedVersion, canRememberContact, expectedIdentityVersion, onSaved }: Props) => {
  const person = useLessBusyObjectAccess('person');
  const reference = useLessBusyObjectAccess('lbConversationReference');
  const identity = useLessBusyObjectAccess('lbContactIdentity');
  const { request, pending, error } = useLessBusyApi();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rememberContact, setRememberContact] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  if (!person.canWriteFields('name', 'lbSource', 'lbImportHash') || !person.canReadFields('lbImportHash') || !reference.canWrite) return null;
  if (!open) return <LessBusyRetry onClick={() => setOpen(true)}>{t`Create a customer from this enquiry`}</LessBusyRetry>;
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending || !confirmed) return;
    const payload = JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), rememberContact });
    if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
    try { z.object({ customerId: z.string().uuid() }).parse(await request(`chatwoot/conversations/${conversationId}/customer`, 'POST', { firstName, lastName, rememberContact, expectedIdentityVersion, expectedVersion, operationKey: operation.current.key, confirmed: true })); await onSaved(); setOpen(false); } catch { setConfirmed(false); }
  }}><h3>{t`Create the customer`}</h3><LessBusyDescription>{t`Enter a recognizable name or social identity. A phone number is optional. The customer and this conversation link are saved together.`}</LessBusyDescription><label>{t`First name or social identity`}<input required maxLength={150} value={firstName} onChange={(event) => { setFirstName(event.target.value); setConfirmed(false); }} /></label><label>{t`Last name (optional)`}<input maxLength={150} value={lastName} onChange={(event) => { setLastName(event.target.value); setConfirmed(false); }} /></label>{canRememberContact && identity.canWrite && <label data-confirmation><input type="checkbox" checked={rememberContact} onChange={(event) => { setRememberContact(event.target.checked); setConfirmed(false); }} />{t`Recognize this messaging contact in future conversations`}</label>}<label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I checked for an existing customer and want to create and link this one.`}</label>{error && <p role="alert">{error}</p>}<LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Creating…` : t`Create and link customer`}</LessBusyRetry><LessBusyRetry type="button" disabled={pending} onClick={() => setOpen(false)}>{t`Cancel`}</LessBusyRetry></LessBusyForm>;
};
