import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { isValidUuid } from 'twenty-shared/utils';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyDescription, LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

type Props = { records: { id: string; updatedAt: string }[]; onSaved: () => Promise<unknown> };
export const LessBusyCustomerBulkActions = ({ records, onSaved }: Props) => {
  const { canWriteFields } = useLessBusyObjectAccess('person');
  const employeeAccess = useLessBusyObjectAccess('workspaceMember');
  const { request, pending, error } = useLessBusyApi();
  const choices = [{ kind: 'archive', label: t`Archive`, fields: ['lbArchivedAt'] }, { kind: 'restore', label: t`Restore`, fields: ['lbArchivedAt'] }, { kind: 'addTags', label: t`Add tags`, fields: ['lbTags'] }, { kind: 'assign', label: t`Assign employee`, fields: ['lbAssignedEmployee'] }].filter((choice) => canWriteFields(...choice.fields) && (choice.kind !== 'assign' || employeeAccess.canRead));
  const [kind, setKind] = useState(choices[0]?.kind ?? '');
  const [tags, setTags] = useState('');
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  if (!choices.length) return null;
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending || !confirmed || !records.length) return;
    const action = kind === 'addTags' ? { kind, tags: tags.split(',').map((value) => value.trim()).filter(Boolean) } : kind === 'assign' ? { kind, employeeId } : { kind };
    try { await request('customers/bulk', 'POST', { records, action, confirmed: true }); setConfirmed(false); await onSaved(); } catch { setConfirmed(false); }
  }}><h2>{t`${records.length} customers selected`}</h2><LessBusyDescription>{t`All selected changes are saved together. Archiving hides a customer from the active directory and keeps their messages, invoices and history. Restore them from the archived view.`}</LessBusyDescription><label>{t`Action`}<select value={kind} disabled={pending} onChange={(event) => { setKind(event.target.value); setConfirmed(false); }}>{choices.map((choice) => <option key={choice.kind} value={choice.kind}>{choice.label}</option>)}</select></label>{kind === 'addTags' && <label>{t`Tags, separated by commas`}<input required maxLength={1000} value={tags} onChange={(event) => { setTags(event.target.value); setConfirmed(false); }} /></label>}{kind === 'assign' && <FormSingleRecordPicker label={t`Employee (leave empty to unassign)`} objectNameSingulars={['workspaceMember']} defaultValue={employeeId} onClear={() => { setEmployeeId(null); setConfirmed(false); }} onChange={(value) => { setEmployeeId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}<label data-confirmation><input type="checkbox" disabled={pending} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`Apply this action to the selected customers.`}</label>{error && <p role="alert">{error}</p>}<LessBusyRetry type="submit" disabled={pending || !confirmed || records.length > 50}>{pending ? t`Saving…` : t`Apply to selected customers`}</LessBusyRetry></LessBusyForm>;
};
