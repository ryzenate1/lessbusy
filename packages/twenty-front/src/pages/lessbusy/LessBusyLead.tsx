import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyLeadConversion } from '@/lessbusy/components/LessBusyLeadConversion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { isValidUuid } from 'twenty-shared/utils';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

const leadSchema = z.object({
  source: z.string().nullable().optional(), assignedEmployeeId: z.string().uuid().nullable().optional(),
  convertedOpportunityId: z.string().uuid().nullable().optional(),
  id: z.string().uuid(), name: z.string().nullable(), version: z.number().int().nonnegative(), customerId: z.string().uuid().nullable(),
  temperature: z.enum(['COLD', 'WARM', 'HOT']).nullable(), priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).nullable(), handlingStatus: z.string().nullable(),
  intent: z.string().nullable(), productInterest: z.string().nullable(), requestedQuantity: z.string().nullable(), budget: z.string().nullable(), urgency: z.string().nullable(),
  recommendedAction: z.string().nullable(), followUpRequired: z.boolean().nullable(), nextFollowUpAt: z.string().nullable(), classificationSource: z.string().nullable(), confidence: z.number().nullable(), classifiedAt: z.string().nullable(),
  lastFollowUpTaskId: z.string().uuid().nullable(), reviewHistory: z.array(z.object({ action: z.string(), at: z.string(), taskId: z.string().optional() })).nullable(),
});
type Lead = z.infer<typeof leadSchema>;

const localDateTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const LeadForm = ({ lead, onSaved, onCancel }: { lead?: Lead; onSaved: (id: string) => Promise<void>; onCancel?: () => void }) => {
  const { request, pending, error } = useLessBusyApi();
  const destinations = useLessBusyDestinations();
  const operation = useRef<{ payload: string; key: string } | null>(null);
  const employeeAccess = useLessBusyObjectAccess('workspaceMember');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string | null>(lead?.assignedEmployeeId ?? null);
  const [source, setSource] = useState(lead?.source ?? '');
  const [customerId, setCustomerId] = useState<string | null>(lead?.customerId ?? null);
  const [values, setValues] = useState({ name: lead?.name ?? '', temperature: lead?.temperature ?? 'COLD', priority: lead?.priority ?? 'NORMAL', handlingStatus: lead?.handlingStatus === 'AI_HANDLING' ? 'HUMAN_HANDLING' : lead?.handlingStatus ?? 'AWAITING_BUSINESS', intent: lead?.intent ?? '', productInterest: lead?.productInterest ?? '', requestedQuantity: lead?.requestedQuantity ?? '', budget: lead?.budget ?? '', urgency: lead?.urgency ?? '', recommendedAction: lead?.recommendedAction ?? '', nextFollowUpAt: localDateTime(lead?.nextFollowUpAt ?? null) });
  const [followUpRequired, setFollowUpRequired] = useState(lead?.followUpRequired ?? true);
  const [protectManualQualification, setProtectManualQualification] = useState(lead ? lead.classificationSource === 'HUMAN' : true);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const update = (key: keyof typeof values, value: string) => { setValues((previous) => ({ ...previous, [key]: value })); setConfirmed(false); };
  const textFields: Array<{ key: 'intent' | 'productInterest' | 'requestedQuantity' | 'budget' | 'urgency'; label: string; maximum: number }> = [
    { key: 'intent', label: t`What does the customer need?`, maximum: 1000 }, { key: 'productInterest', label: t`Products or services of interest`, maximum: 1000 }, { key: 'requestedQuantity', label: t`Requested quantity`, maximum: 100 }, { key: 'budget', label: t`Budget supplied by the customer`, maximum: 250 }, { key: 'urgency', label: t`Timing and urgency`, maximum: 250 },
  ];
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (!confirmed || pending) return;
    setValidation(null);
    try {
      const qualification = { ...values, assignedEmployeeId, source, name: values.name.trim(), customerId, nextFollowUpAt: values.nextFollowUpAt ? new Date(values.nextFollowUpAt).toISOString() : null, followUpRequired, protectManualQualification };
      const payload = JSON.stringify(qualification);
      if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
      const result = leadSchema.parse(await request(lead ? `leads/${lead.id}` : 'leads', lead ? 'PUT' : 'POST', { qualification, confirmed: true, expectedVersion: lead?.version ?? null, operationKey: operation.current.key }));
      await onSaved(result.id);
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not save this lead.`); }
  }}>
    <h1>{lead ? t`Review lead qualification` : t`Add a lead`}</h1><LessBusyDescription>{t`Keep buying readiness, urgency and conversation handling separate. Save only what the customer has actually told you.`}</LessBusyDescription>
    <label>{t`Lead name`}<input required maxLength={250} value={values.name} onChange={(event) => update('name', event.target.value)} /></label>
    {destinations.some((destination) => destination.nameSingular === 'person') && <FormSingleRecordPicker label={t`Customer (optional)`} objectNameSingulars={['person']} defaultValue={customerId} onClear={() => { setCustomerId(null); setConfirmed(false); }} onChange={(value) => { setCustomerId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}
    <label>{t`Lead source`}<input maxLength={250} value={source} onChange={(event) => { setSource(event.target.value); setConfirmed(false); }} /></label>
    {employeeAccess.canRead && <FormSingleRecordPicker label={t`Assigned employee (optional)`} objectNameSingulars={['workspaceMember']} defaultValue={assignedEmployeeId} onClear={() => { setAssignedEmployeeId(null); setConfirmed(false); }} onChange={(value) => { setAssignedEmployeeId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}
    <div data-row><label>{t`Buying readiness`}<select value={values.temperature} onChange={(event) => update('temperature', event.target.value)}><option value="COLD">{t`Cold — needs clarification`}</option><option value="WARM">{t`Warm — interested`}</option><option value="HOT">{t`Hot — ready to buy`}</option></select></label><label>{t`Priority`}<select value={values.priority} onChange={(event) => update('priority', event.target.value)}><option value="LOW">{t`Low`}</option><option value="NORMAL">{t`Normal`}</option><option value="HIGH">{t`High`}</option><option value="CRITICAL">{t`Critical`}</option></select></label><label>{t`Conversation handling`}<select value={values.handlingStatus} onChange={(event) => update('handlingStatus', event.target.value)}><option value="AWAITING_BUSINESS">{t`Awaiting our team`}</option><option value="AWAITING_CUSTOMER">{t`Awaiting customer`}</option><option value="HUMAN_HANDLING">{t`Handled by a person`}</option><option value="RESOLVED">{t`Resolved`}</option></select></label></div>
    {textFields.map((field) => <label key={field.key}>{field.label}<input maxLength={field.maximum} value={values[field.key]} onChange={(event) => update(field.key, event.target.value)} /></label>)}
    <label>{t`Recommended next step`}<textarea maxLength={2000} value={values.recommendedAction} onChange={(event) => update('recommendedAction', event.target.value)} /></label>
    <label data-confirmation><input type="checkbox" checked={followUpRequired} onChange={(event) => { setFollowUpRequired(event.target.checked); setConfirmed(false); }} />{t`This lead needs a follow-up`}</label>
    <label>{t`Next follow-up date`}<input type="datetime-local" value={values.nextFollowUpAt} onChange={(event) => update('nextFollowUpAt', event.target.value)} /></label>
    <label data-confirmation><input type="checkbox" checked={protectManualQualification} onChange={(event) => { setProtectManualQualification(event.target.checked); setConfirmed(false); }} />{t`Protect my qualification from automatic message updates`}</label>
    {!protectManualQualification && <LessBusyDescription>{t`Future synchronized messages may update buying readiness, intent, urgency, priority and the recommended next step. This does not enable automatic customer replies.`}</LessBusyDescription>}
    <label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed and confirm these details.`}</label>
    {(validation || error) && <p role="alert">{validation || error}</p>}
    <LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Saving…` : t`Save lead`}</LessBusyRetry>{onCancel && <LessBusyRetry type="button" onClick={onCancel}>{t`Back to lead`}</LessBusyRetry>}</LessBusyActions>
  </LessBusyForm>;
};

const FollowUpForm = ({ lead, onCreated }: { lead: Lead; onCreated: () => Promise<void> }) => {
  const { request, pending, error } = useLessBusyApi();
  const operation = useRef<{ payload: string; key: string } | null>(null);
  const [title, setTitle] = useState((lead.recommendedAction || `${t`Follow up`}: ${lead.name ?? ''}`).slice(0, 250));
  const [dueAt, setDueAt] = useState(localDateTime(lead.nextFollowUpAt));
  const [confirmed, setConfirmed] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  return <LessBusySection><LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (!confirmed || pending) return;
    setValidation(null);
    try {
      const command = { title, dueAt: new Date(dueAt).toISOString() };
      const payload = JSON.stringify(command);
      if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
      const result = z.object({ taskId: z.string().uuid() }).parse(await request(`leads/${lead.id}/follow-up`, 'POST', { ...command, confirmed: true, operationKey: operation.current.key, expectedVersion: lead.version }));
      setTaskId(result.taskId); setConfirmed(false); await onCreated();
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not create a follow-up task.`); }
  }}><h2>{t`Create a follow-up task`}</h2><LessBusyDescription>{t`This creates a real task assigned to you. If the lead has a customer, the task will also appear on that customer's record.`}</LessBusyDescription><label>{t`Task title`}<input required maxLength={250} value={title} onChange={(event) => { setTitle(event.target.value); setConfirmed(false); }} /></label><label>{t`Due date`}<input type="datetime-local" required value={dueAt} onChange={(event) => { setDueAt(event.target.value); setConfirmed(false); }} /></label><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`Create this follow-up and assign it to me`}</label>{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed || Boolean(taskId)}>{pending ? t`Creating…` : t`Create task`}</LessBusyRetry>{taskId && <LessBusyLink to={`/object/task/${taskId}`}>{t`Open created task`}</LessBusyLink>}</LessBusyActions></LessBusyForm></LessBusySection>;
};

const LeadWorkspace = ({ leadId }: { leadId?: string }) => {
  const { request, pending, error } = useLessBusyApi();
  const destinations = useLessBusyDestinations();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [editing, setEditing] = useState(false);
  const leadDestination = destinations.find((destination) => destination.nameSingular === 'lbLead');
  const taskDestination = destinations.find((destination) => destination.nameSingular === 'task');
  const canWrite = Boolean(leadDestination && objectPermissionsByObjectMetadataId[leadDestination.id]?.canUpdateObjectRecords);
  const canCreateTask = Boolean(taskDestination && objectPermissionsByObjectMetadataId[taskDestination.id]?.canUpdateObjectRecords);
  const load = useCallback(async () => {
    if (!leadId) return;
    try { setLead(leadSchema.parse(await request(`leads/${leadId}`))); }
    catch { setLead(null); }
  }, [request, leadId]);
  useEffect(() => { void load(); }, [load]);
  if (!leadId) return <LessBusySection>{canWrite ? <LeadForm onSaved={async (id) => { navigate(`/business/leads/${id}`); }} /> : <LessBusyDescription>{t`Your role can view leads. Ask your administrator for permission to add or review them.`}</LessBusyDescription>}</LessBusySection>;
  if (!lead) return <LessBusySection>{pending ? <p role="status">{t`Loading lead…`}</p> : <><p role="alert">{error || t`This lead could not be loaded.`}</p><LessBusyRetry onClick={() => void load()}>{t`Reload lead`}</LessBusyRetry></>}</LessBusySection>;
  if (editing && canWrite) return <LessBusySection><LeadForm key={`${lead.id}:${lead.version}`} lead={lead} onSaved={async () => { setEditing(false); await load(); }} onCancel={() => setEditing(false)} /></LessBusySection>;
  return <>
    <LessBusySection><h1>{lead.name || t`Lead`}</h1><LessBusyDescription>{lead.temperature ?? t`Not classified`} · {lead.priority ?? t`Normal priority`} · {lead.handlingStatus?.replaceAll('_', ' ') || t`Awaiting review`}</LessBusyDescription><LessBusyActions>{canWrite && <LessBusyRetry onClick={() => setEditing(true)}>{t`Review qualification`}</LessBusyRetry>}{lead.customerId && destinations.some((destination) => destination.nameSingular === 'person') && <LessBusyLink to={`/object/person/${lead.customerId}`}>{t`Open customer`}</LessBusyLink>}<LessBusyLink to={`/object/lbLead/${lead.id}`}>{t`Open full record`}</LessBusyLink><LessBusyRetry disabled={pending} onClick={() => void load()}>{t`Refresh lead`}</LessBusyRetry></LessBusyActions></LessBusySection>
    <LessBusySection><h2>{t`What we know`}</h2><dl>{[[t`Intent`, lead.intent], [t`Product or service interest`, lead.productInterest], [t`Requested quantity`, lead.requestedQuantity], [t`Budget`, lead.budget], [t`Urgency`, lead.urgency], [t`Recommended next step`, lead.recommendedAction]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || t`Not supplied`}</dd></div>)}</dl><LessBusyDescription>{lead.classificationSource === 'HUMAN' ? t`Reviewed by your team. Automatic messages will not overwrite this qualification.` : t`Automatic message qualification is allowed. Review the customer's actual requirements before acting.`}</LessBusyDescription>{lead.confidence != null && <LessBusyDescription>{t`Automatic classification confidence`}: {Math.round(lead.confidence * 100)}%</LessBusyDescription>}{lead.nextFollowUpAt && <p>{t`Next follow-up`}: <time dateTime={lead.nextFollowUpAt}>{new Date(lead.nextFollowUpAt).toLocaleString()}</time></p>}{lead.lastFollowUpTaskId && taskDestination && <LessBusyLink to={`/object/task/${lead.lastFollowUpTaskId}`}>{t`Open latest follow-up task`}</LessBusyLink>}</LessBusySection>
    {canWrite && <LessBusyLeadConversion key={`${lead.id}:${lead.version}`} id={lead.id} version={lead.version} name={lead.name ?? ''} customerId={lead.customerId} convertedOpportunityId={lead.convertedOpportunityId} />}
    {canWrite && canCreateTask && <FollowUpForm key={`${lead.id}:${lead.version}`} lead={lead} onCreated={load} />}
    <LessBusySection><h2>{t`Review history`}</h2><ul>{(lead.reviewHistory ?? []).map((entry, index) => <li key={index}>{entry.action.replaceAll('_', ' ')} · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>{entry.taskId && taskDestination && <> · <LessBusyLink to={`/object/task/${entry.taskId}`}>{t`Open task`}</LessBusyLink></>}</li>)}</ul></LessBusySection>
  </>;
};

export const LessBusyLead = () => {
  const { leadId } = useParams();
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Lead workspace`} />}><LessBusyContent><LessBusyObjectGate objectName="lbLead"><LeadWorkspace key={`${workspace?.id}:${leadId ?? 'new'}`} leadId={leadId} /></LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
