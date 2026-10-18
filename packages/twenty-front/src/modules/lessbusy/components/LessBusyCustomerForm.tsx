import { z } from 'zod';
import { isValidUuid } from 'twenty-shared/utils';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

type CustomerInput = ObjectRecord & { name: { firstName: string; lastName: string }; emails?: { primaryEmail: string; additionalEmails: string[] | null }; jobTitle?: string | null; lbSource?: string | null; lbTags?: string[] | null; lbBillingName?: string | null; lbBillingAddress?: string | null; lbTaxIdentifiers?: Record<string, string> | null; lbInstagramIdentity?: string | null; lbWhatsappIdentity?: string | null; lbAssignedEmployeeId?: string | null };
type LessBusyCustomerFormProps = { customer?: CustomerInput; onSaved: (id: string) => Promise<void>; onCancel?: () => void };

export const LessBusyCustomerForm = ({ customer, onSaved, onCancel }: LessBusyCustomerFormProps) => {
  const { canReadFields, canWriteFields } = useLessBusyObjectAccess('person');
  const { createOneRecord } = useCreateOneRecord<CustomerInput>({ objectNameSingular: 'person', recordGqlFields: { id: true } });
  const { updateOneRecord } = useUpdateOneRecord();
  const creationId = useRef(crypto.randomUUID());
  const [firstName, setFirstName] = useState(customer?.name.firstName ?? '');
  const [lastName, setLastName] = useState(customer?.name.lastName ?? '');
  const [email, setEmail] = useState(customer?.emails?.primaryEmail ?? '');
  const [jobTitle, setJobTitle] = useState(customer?.jobTitle ?? '');
  const memberAccess = useLessBusyObjectAccess('workspaceMember');
  const [source, setSource] = useState(customer?.lbSource ?? '');
  const [tags, setTags] = useState(Array.isArray(customer?.lbTags) ? customer.lbTags.filter((tag) => typeof tag === 'string').join(', ') : '');
  const [billingName, setBillingName] = useState(customer?.lbBillingName ?? '');
  const [billingAddress, setBillingAddress] = useState(customer?.lbBillingAddress ?? '');
  const [taxIdentifiers, setTaxIdentifiers] = useState(Object.entries(customer?.lbTaxIdentifiers ?? {}).map(([key, value]) => `${key}: ${value}`).join('\n'));
  const [instagramIdentity, setInstagramIdentity] = useState(customer?.lbInstagramIdentity ?? '');
  const [whatsappIdentity, setWhatsappIdentity] = useState(customer?.lbWhatsappIdentity ?? '');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string | null>(customer?.lbAssignedEmployeeId ?? null);
  const editable = (field: string) => canReadFields(field) && canWriteFields(field);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (saving.current) return;
    saving.current = true; setPending(true); setError(null);
    try {
      const identityName = editable('lbInstagramIdentity') && instagramIdentity.trim() ? `Instagram ${instagramIdentity.trim()}` : editable('lbWhatsappIdentity') && whatsappIdentity.trim() ? `WhatsApp ${whatsappIdentity.trim()}` : '';
      if (!firstName.trim() && !lastName.trim() && !identityName) throw new Error(t`Enter a customer name or a messaging identity.`);
      const taxes = taxIdentifiers.trim() ? Object.fromEntries(taxIdentifiers.split('\n').filter((line) => line.trim()).map((line) => { const colon = line.indexOf(':'); if (colon < 1) throw new Error(t`Enter each tax identifier as a label followed by a colon and its value.`); return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()]; })) : {};
      z.record(z.string().min(1).max(50), z.string().min(1).max(100)).parse(taxes);
      const input = { ...(editable('lbSource') ? { lbSource: source.trim() } : {}), ...(editable('lbTags') ? { lbTags: [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))].slice(0, 50) } : {}), ...(editable('lbBillingName') ? { lbBillingName: billingName.trim() } : {}), ...(editable('lbBillingAddress') ? { lbBillingAddress: billingAddress.trim() } : {}), ...(editable('lbTaxIdentifiers') ? { lbTaxIdentifiers: taxes } : {}), ...(editable('lbInstagramIdentity') ? { lbInstagramIdentity: instagramIdentity.trim() } : {}), ...(editable('lbWhatsappIdentity') ? { lbWhatsappIdentity: whatsappIdentity.trim() } : {}), ...(editable('lbAssignedEmployee') ? { lbAssignedEmployeeId: assignedEmployeeId } : {}), name: { firstName: firstName.trim() || (!lastName.trim() ? identityName : ''), lastName: lastName.trim() }, ...((canReadFields('emails') && canWriteFields('emails')) ? { emails: { primaryEmail: email.trim(), additionalEmails: customer?.emails?.additionalEmails ?? [] } } : {}), ...((canReadFields('jobTitle') && canWriteFields('jobTitle')) ? { jobTitle: jobTitle.trim() } : {}) };
      if (customer) { const updated = await updateOneRecord({ objectNameSingular: 'person', idToUpdate: customer.id, updateOneRecordInput: input, recordGqlFields: { id: true } }); if (!updated) throw new Error(t`Could not save this customer.`); }
      else await createOneRecord({ ...input, id: creationId.current });
      await onSaved(customer?.id ?? creationId.current);
    } catch (failure) { setError(failure instanceof Error ? failure.message : t`Could not save this customer.`); }
    finally { saving.current = false; setPending(false); }
  }}><h1>{customer ? t`Edit customer details` : t`Add a customer`}</h1><LessBusyDescription>{t`Start with what you know. Email and phone numbers are optional; more fields and relationships are available in the full record.`}</LessBusyDescription>
    <div data-row><label>{t`First name`}<input maxLength={250} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" /></label><label>{t`Last name`}<input maxLength={250} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" /></label></div>
    {(canReadFields('emails') && canWriteFields('emails')) && <label>{t`Email (optional)`}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>}
    {(canReadFields('jobTitle') && canWriteFields('jobTitle')) && <label>{t`Job title (optional)`}<input maxLength={250} value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></label>}
    {(editable('lbSource') || editable('lbTags') || editable('lbAssignedEmployee')) && <details><summary>{t`Customer context and assignment`}</summary>{editable('lbSource') && <label>{t`How did this customer find you?`}<input maxLength={250} value={source} onChange={(event) => setSource(event.target.value)} placeholder={t`Referral, website, Instagram…`} /></label>}{editable('lbTags') && <label>{t`Tags, separated by commas`}<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t`Wholesale, repeat customer, VIP…`} /></label>}{editable('lbAssignedEmployee') && memberAccess.canRead && <FormSingleRecordPicker label={t`Assigned employee`} objectNameSingulars={['workspaceMember']} defaultValue={assignedEmployeeId} onClear={() => setAssignedEmployeeId(null)} onChange={(value) => setAssignedEmployeeId(typeof value === 'string' && isValidUuid(value) ? value : null)} />}</details>}
    {(editable('lbBillingName') || editable('lbBillingAddress') || editable('lbTaxIdentifiers')) && <details><summary>{t`Billing details`}</summary>{editable('lbBillingName') && <label>{t`Billing name`}<input maxLength={250} value={billingName} onChange={(event) => setBillingName(event.target.value)} /></label>}{editable('lbBillingAddress') && <label>{t`Billing address`}<textarea maxLength={2000} value={billingAddress} onChange={(event) => setBillingAddress(event.target.value)} /></label>}{editable('lbTaxIdentifiers') && <label>{t`Tax identifiers, one label: value per line`}<textarea rows={3} value={taxIdentifiers} onChange={(event) => setTaxIdentifiers(event.target.value)} /></label>}</details>}
    {(editable('lbInstagramIdentity') || editable('lbWhatsappIdentity')) && <details><summary>{t`Messaging identities`}</summary><LessBusyDescription>{t`Keep provider IDs or handles even when a phone number is not known. Verified inbox-to-customer matching is managed from Messages.`}</LessBusyDescription>{editable('lbInstagramIdentity') && <label>{t`Instagram ID or handle`}<input maxLength={250} value={instagramIdentity} onChange={(event) => setInstagramIdentity(event.target.value)} /></label>}{editable('lbWhatsappIdentity') && <label>{t`WhatsApp provider ID`}<input maxLength={250} value={whatsappIdentity} onChange={(event) => setWhatsappIdentity(event.target.value)} /></label>}</details>}
    {error && <p role="alert">{error}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={pending}>{pending ? t`Saving…` : t`Save customer`}</LessBusyRetry>{onCancel && <LessBusyRetry type="button" onClick={onCancel}>{t`Back`}</LessBusyRetry>}</LessBusyActions>
  </LessBusyForm>;
};
