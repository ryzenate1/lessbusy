import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyContent, LessBusyDescription, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { useLessBusyLabels } from '@/lessbusy/hooks/useLessBusyLabels';
import { LESSBUSY_WORKFLOW_OBJECTS } from '@/lessbusy/utils/getLessBusyDestinations';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { lessBusyModulePreferencesState } from '@/lessbusy/states/lessBusyModulePreferencesState';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';

type Profile = ObjectRecord & { documentTemplate?: string; documentNotes?: string; businessType?: string; currency?: string; locale?: string; invoicePrefix?: string; enabledModules?: string[]; identity?: { legalName?: string; address?: string; taxIdentifiers?: Record<string, string> } };
const serviceModules = ['person', 'company', 'opportunity', 'task', 'note', 'lbLead', 'lbQuotation', 'lbSalesOrder', 'lbInvoice', 'lbPayment', 'lbBusinessProfile'];

const ProfileForm = ({ profile, onSaved, canWrite }: { profile?: Profile; onSaved: () => Promise<unknown>; canWrite: boolean }) => {
  const labels = useLessBusyLabels();
  const workspace = useAtomStateValue(currentWorkspaceState);
  const setPreferences = useSetAtomState(lessBusyModulePreferencesState);
  const [businessType, setBusinessType] = useState(profile?.businessType ?? 'OTHER');
  const [currency, setCurrency] = useState(profile?.currency ?? '');
  const [locale, setLocale] = useState(profile?.locale ?? '');
  const [documentTemplate, setDocumentTemplate] = useState(profile?.documentTemplate ?? 'MINIMAL');
  const [documentNotes, setDocumentNotes] = useState(profile?.documentNotes ?? '');
  const [invoicePrefix, setInvoicePrefix] = useState(profile?.invoicePrefix ?? 'INV');
  const [legalName, setLegalName] = useState(profile?.identity?.legalName ?? '');
  const [address, setAddress] = useState(profile?.identity?.address ?? '');
  const [taxIdentifiers, setTaxIdentifiers] = useState(Object.entries(profile?.identity?.taxIdentifiers ?? {}).map(([key, value]) => `${key}: ${value}`).join('\n'));
  const [enabledModules, setEnabledModules] = useState<string[]>(profile?.enabledModules ?? [...LESSBUSY_WORKFLOW_OBJECTS]);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { createOneRecord } = useCreateOneRecord({ objectNameSingular: 'lbBusinessProfile' });
  const { updateOneRecord } = useUpdateOneRecord();
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending || !canWrite) return; setPending(true); setNotice(null);
    try {
      new Intl.NumberFormat(locale || undefined, { style: 'currency', currency });
      const tax: Record<string, string> = {};
      for (const line of taxIdentifiers.split('\n').filter((value) => value.trim())) { const separator = line.indexOf(':'); if (separator < 1) throw new Error(t`Use “Tax identifier: value” on each line.`); tax[line.slice(0, separator).trim()] = line.slice(separator + 1).trim(); }
      const recordInput = { name: legalName, profileKey: 'workspace', businessType, currency, locale, invoicePrefix, documentTemplate, documentNotes, enabledModules: [...new Set([...enabledModules, 'lbBusinessProfile'])], identity: { legalName, address, taxIdentifiers: tax } };
      if (profile) await updateOneRecord({ objectNameSingular: 'lbBusinessProfile', idToUpdate: profile.id, updateOneRecordInput: recordInput });
      else await createOneRecord(recordInput);
      if (workspace) setPreferences({ workspaceId: workspace.id, enabledModules: recordInput.enabledModules });
      await onSaved(); setNotice(t`Your business settings have been saved.`);
    } catch (failure) { setNotice(failure instanceof Error ? failure.message : t`Could not save business settings.`); } finally { setPending(false); }
  }}>
    <h1>{t`Make LessBusy fit your business.`}</h1><LessBusyDescription>{t`Choose the modules your team sees and the business identity used on finalized invoices.`}</LessBusyDescription>
    <fieldset disabled={!canWrite || pending}><legend>{t`Business identity`}</legend><label>{t`Legal business name`}<input required maxLength={250} value={legalName} onChange={(event) => setLegalName(event.target.value)} /></label><label>{t`Business address`}<textarea required maxLength={2000} value={address} onChange={(event) => setAddress(event.target.value)} /></label><label>{t`Currency code`}<input required pattern="[A-Z]{3}" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label><label>{t`Locale`}<input placeholder="en-IN" value={locale} onChange={(event) => setLocale(event.target.value)} /></label><label>{t`Invoice prefix`}<input required pattern="[A-Z0-9-]{1,16}" maxLength={16} value={invoicePrefix} onChange={(event) => setInvoicePrefix(event.target.value.toUpperCase())} /></label><label>{t`Tax identifiers`}<textarea placeholder="GSTIN: your identifier" value={taxIdentifiers} onChange={(event) => setTaxIdentifiers(event.target.value)} /></label></fieldset>
    <fieldset disabled={!canWrite || pending}><legend>{t`Document appearance`}</legend><label>{t`Template`}<select value={documentTemplate} onChange={(event) => setDocumentTemplate(event.target.value)}><option value="MINIMAL">{t`Minimal`}</option><option value="CLASSIC">{t`Classic`}</option></select></label><label>{t`Payment instructions or document notes`}<textarea maxLength={4000} rows={4} value={documentNotes} onChange={(event) => setDocumentNotes(event.target.value)} /></label><LessBusyDescription>{t`These settings are copied when an invoice is finalized or a quotation is issued, so later changes keep issued documents intact.`}</LessBusyDescription></fieldset>
    <fieldset disabled={!canWrite || pending}><legend>{t`Workspace modules`}</legend><label>{t`Business profile`}<select value={businessType} onChange={(event) => { const value = event.target.value; setBusinessType(value); setEnabledModules(value === 'SERVICES' || value === 'AGENCY' ? serviceModules : [...LESSBUSY_WORKFLOW_OBJECTS]); }}><option value="OTHER">{t`Flexible workspace`}</option><option value="RETAIL">{t`Retail`}</option><option value="WHOLESALE">{t`Wholesale`}</option><option value="SERVICES">{t`Services`}</option><option value="AGENCY">{t`Agency`}</option><option value="ECOMMERCE">{t`E-commerce`}</option></select></label>
      {LESSBUSY_WORKFLOW_OBJECTS.filter((name) => name !== 'lbBusinessProfile').map((name) => <label data-confirmation key={name}><input type="checkbox" checked={enabledModules.includes(name)} onChange={(event) => setEnabledModules((previous) => event.target.checked ? [...previous, name] : previous.filter((module) => module !== name))} />{labels[name]}</label>)}
    </fieldset>
    {notice && <p role="status">{notice}</p>}{canWrite ? <LessBusyRetry disabled={pending} type="submit">{pending ? t`Saving…` : t`Save business settings`}</LessBusyRetry> : <LessBusyDescription>{t`Your role can view these settings. Ask your administrator to make changes.`}</LessBusyDescription>}
  </LessBusyForm>;
};

const LoadProfile = () => {
  const { records, loading, error, refetch } = useFindManyRecords<Profile>({ objectNameSingular: 'lbBusinessProfile', filter: { profileKey: { eq: 'workspace' } }, recordGqlFields: { id: true, name: true, businessType: true, currency: true, locale: true, invoicePrefix: true, documentTemplate: true, documentNotes: true, identity: true, enabledModules: true }, limit: 1 });
  const objects = useAtomStateValue(objectMetadataItemsSelector);
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const profileMetadata = objects.find((object) => object.nameSingular === 'lbBusinessProfile');
  const canWrite = Boolean(profileMetadata && objectPermissionsByObjectMetadataId[profileMetadata.id]?.canUpdateObjectRecords);
  if (loading) return <p role="status">{t`Loading business settings…`}</p>;
  if (error) return <><p role="alert">{t`Business settings could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></>;
  return <ProfileForm key={records[0]?.id ?? 'new'} profile={records[0]} onSaved={refetch} canWrite={canWrite} />;
};
export const LessBusyBusinessSettings = () => <PageCardLayout header={<PageCardHeader title={t`Business settings`} />}><LessBusyContent><LessBusySection><LessBusyObjectGate objectName="lbBusinessProfile"><LoadProfile /></LessBusyObjectGate></LessBusySection></LessBusyContent></PageCardLayout>;
