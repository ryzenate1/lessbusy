import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { moneyToMinorUnits } from '@/lessbusy/utils/moneyToMinorUnits';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';

type LessBusyLeadConversionProps = { id: string; version: number; name: string; customerId: string | null; convertedOpportunityId?: string | null };

export const LessBusyLeadConversion = ({ id, version, name: leadName, customerId, convertedOpportunityId }: LessBusyLeadConversionProps) => {
  const access = useLessBusyObjectAccess('opportunity');
  const { request, pending, error } = useLessBusyApi();
  const navigate = useNavigate();
  const stages = access.object?.fields.find((field) => field.name === 'stage')?.options ?? [];
  const [name, setName] = useState(leadName);
  const [stage, setStage] = useState(stages[0]?.value ?? '');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  if (convertedOpportunityId) return access.canRead ? <LessBusySection><LessBusyLink to={`/object/opportunity/${convertedOpportunityId}`}>{t`Open converted deal`}</LessBusyLink></LessBusySection> : null;
  if (!access.canWrite) return null;
  if (!customerId) return <LessBusySection><LessBusyDescription>{t`Link this lead to a customer before converting it into a deal.`}</LessBusyDescription></LessBusySection>;
  if (!reviewing) return <LessBusySection><LessBusyRetry onClick={() => setReviewing(true)}>{t`Convert lead to deal`}</LessBusyRetry></LessBusySection>;
  return <LessBusySection><LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending || !confirmed) return;
    setValidation(null);
    try {
      const command = { expectedVersion: version, name, stage, closeDate: closeDate ? new Date(`${closeDate}T12:00:00`).toISOString() : null, amount: amount ? { currency, amountMinor: moneyToMinorUnits(amount, currency) } : null };
      const payload = JSON.stringify(command);
      if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
      const result = z.object({ id: z.string().uuid() }).parse(await request(`leads/${id}/convert`, 'POST', { ...command, confirmed: true, operationKey: operation.current.key }));
      navigate(`/object/opportunity/${result.id}`);
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not convert this lead.`); }
  }}><h2>{t`Create a linked sales deal`}</h2><LessBusyDescription>{t`The lead and its qualification history are kept. The new deal is assigned to you, linked to the same customer and company, and added to your chosen pipeline stage.`}</LessBusyDescription><label>{t`Deal name`}<input required maxLength={250} value={name} onChange={(event) => { setName(event.target.value); setConfirmed(false); }} /></label><label>{t`Pipeline stage`}<select required value={stage} onChange={(event) => { setStage(event.target.value); setConfirmed(false); }}><option value="">{t`Choose stage`}</option>{stages.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><div data-row><label>{t`Expected amount (optional)`}<input inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setConfirmed(false); }} /></label><label>{t`Currency`}<input required={Boolean(amount)} maxLength={3} value={currency} onChange={(event) => { setCurrency(event.target.value.toUpperCase()); setConfirmed(false); }} /></label><label>{t`Expected closing date`}<input type="date" value={closeDate} onChange={(event) => { setCloseDate(event.target.value); setConfirmed(false); }} /></label></div><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed and confirm this conversion.`}</label>{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Converting…` : t`Create deal`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => setReviewing(false)}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm></LessBusySection>;
};
