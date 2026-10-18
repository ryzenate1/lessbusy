import { LessBusyCatalogueLineDetails } from '@/lessbusy/components/LessBusyCatalogueLineDetails';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useState, useRef } from 'react';
import { t } from '@lingui/core/macro';
import { useNavigate } from 'react-router-dom';
import { isValidUuid } from 'twenty-shared/utils';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { lessBusyInvoiceProposalSchema } from '@/lessbusy/utils/lessBusyInvoiceProposal';
import { type z } from 'zod';
import { moneyToMinorUnits } from '@/lessbusy/utils/moneyToMinorUnits';

type SalesLine = { key: string; description: string; quantity: string; price: string; tax: string; discount: string; variantId?: string };
const newLine = (): SalesLine => ({ key: crypto.randomUUID(), description: '', quantity: '1', price: '', tax: '0', discount: '0' });
const kinds = { invoice: { object: 'lbInvoice', endpoint: 'invoices' }, quotation: { object: 'lbQuotation', endpoint: 'quotations' }, order: { object: 'lbSalesOrder', endpoint: 'orders' } } as const;

export const LessBusySalesDocumentForm = ({ kind, proposal, draft, onSaved, defaultCurrency, initialCustomerId }: { kind: keyof typeof kinds; proposal?: z.infer<typeof lessBusyInvoiceProposalSchema>; draft?: { id: string; version: number }; onSaved?: () => Promise<void>; defaultCurrency?: string; initialCustomerId?: string }) => {
  const navigate = useNavigate();
  const destinations = useLessBusyDestinations();
  const canChooseVariant = destinations.some((destination) => destination.nameSingular === 'lbProductVariant');
  const [discount, setDiscount] = useState(String((proposal?.document.discountBasisPoints ?? 0) / 100));
  const [customerId, setCustomerId] = useState<string | null>(proposal?.document.customerId ?? initialCustomerId ?? null);
  const [opportunityId, setOpportunityId] = useState<string | null>(proposal?.document.opportunityId ?? null);
  const [currency, setCurrency] = useState(proposal?.document.currency ?? defaultCurrency ?? '');
  const [dueAt, setDueAt] = useState(proposal?.document.dueAt?.slice(0, 10) ?? '');
  const [lines, setLines] = useState<SalesLine[]>(() => proposal ? proposal.document.lines.map((line) => { const decimals = new Intl.NumberFormat('en', { style: 'currency', currency: proposal.document.currency }).resolvedOptions().maximumFractionDigits ?? 2; const digits = line.unitAmountMinor.padStart(decimals + 1, '0'); return { key: crypto.randomUUID(), variantId: line.variantId, description: line.description, quantity: String(line.quantity), price: decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}` : digits, tax: String(line.taxBasisPoints / 100), discount: String(line.discountBasisPoints / 100) }; }) : [newLine()]);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const operation = useRef<{ key: string; payload: string } | null>(null);
  const { request, pending, error } = useLessBusyApi();
  const updateLine = (key: string, field: keyof SalesLine, value: string) => { setConfirmed(false); setLines((previous) => previous.map((line) => line.key === key ? { ...line, [field]: value } : line)); };
  const basisPoints = (value: string) => {
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(value) || Number(value) > 100) throw new Error(t`Tax and discount must be between 0 and 100 percent, with at most two decimal places.`);
    const [whole, fraction = ''] = value.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  };
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault();
    if (pending || !confirmed) return;
    setValidation(null);
    try {
      if (!customerId || !/^[A-Z]{3}$/.test(currency)) throw new Error(t`Select a customer and enter a three-letter currency code.`);
      const document = { customerId, ...(opportunityId ? { opportunityId } : {}), currency, discountBasisPoints: basisPoints(discount), ...(dueAt ? { dueAt: new Date(`${dueAt}T23:59:59`).toISOString() } : {}), lines: lines.map((line) => ({ description: line.description.trim(), ...(line.variantId ? { variantId: line.variantId } : {}), quantity: Number(line.quantity), unitAmountMinor: moneyToMinorUnits(line.price, currency), taxBasisPoints: basisPoints(line.tax), discountBasisPoints: basisPoints(line.discount) })) };
      const payload = JSON.stringify(document);
      const operationKey = operation.current?.payload === payload ? operation.current.key : crypto.randomUUID();
      operation.current = { key: operationKey, payload };
      const result = draft ? await request<{ id: string }>(`${kinds[kind].endpoint}/${draft.id}/draft`, 'PUT', { document, expectedVersion: draft.version, confirmed: true }) : await request<{ id: string }>(kinds[kind].endpoint, 'POST', { document, operationKey, confirmed: true });
      if (onSaved) { await onSaved(); return; }
      navigate(kind === 'invoice' ? `/business/invoices/${result.id}` : `/business/${kinds[kind].endpoint}/${result.id}`);
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Unable to prepare this document.`); }
  }}>
    <h1>{draft ? (kind === 'invoice' ? t`Edit draft invoice` : kind === 'quotation' ? t`Edit draft quotation` : t`Edit draft order`) : kind === 'invoice' ? t`Create invoice` : kind === 'quotation' ? t`Create quotation` : t`Create order`}</h1>
    <LessBusyDescription>{t`Review the customer, items and prices before saving. Invoices start as drafts and require a separate finalization.`}</LessBusyDescription>
    <FormSingleRecordPicker label={t`Customer`} objectNameSingulars={['person']} defaultValue={customerId} onChange={(value) => { setCustomerId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />
    {destinations.some((destination) => destination.nameSingular === 'opportunity') && <FormSingleRecordPicker label={t`Related deal (optional)`} objectNameSingulars={['opportunity']} defaultValue={opportunityId} onClear={() => { setOpportunityId(null); setConfirmed(false); }} onChange={(value) => { setOpportunityId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} />}
    <div data-row><label>{t`Currency`}<input required maxLength={3} placeholder="INR, USD, EUR" value={currency} onChange={(event) => { setCurrency(event.target.value.toUpperCase()); setConfirmed(false); }} /></label>{kind !== 'order' && <label>{kind === 'quotation' ? t`Valid until` : t`Due date`}<input type="date" value={dueAt} onChange={(event) => { setDueAt(event.target.value); setConfirmed(false); }} /></label>}</div>
    <label>{t`Document discount %`}<input required inputMode="decimal" value={discount} onChange={(event) => { setDiscount(event.target.value); setConfirmed(false); }} /></label>
    {lines.map((line, index) => <fieldset key={line.key}><legend>{t`Item ${index + 1}`}</legend>
      {canChooseVariant && <FormSingleRecordPicker label={t`Product variant (optional)`} objectNameSingulars={['lbProductVariant']} defaultValue={line.variantId ?? null} onClear={() => updateLine(line.key, 'variantId', '')} onChange={(value) => updateLine(line.key, 'variantId', typeof value === 'string' && isValidUuid(value) ? value : '')} />}
      {line.variantId && <LessBusyCatalogueLineDetails variantId={line.variantId} currency={currency} onApply={(details) => { setLines((previous) => previous.map((item) => item.key === line.key ? { ...item, ...details } : item)); setConfirmed(false); }} />}
      <label>{t`Description`}<input required maxLength={500} value={line.description} onChange={(event) => updateLine(line.key, 'description', event.target.value)} /></label>
      <div data-row><label>{t`Quantity`}<input type="number" required min={1} max={1000000} step={1} value={line.quantity} onChange={(event) => updateLine(line.key, 'quantity', event.target.value)} /></label><label>{t`Unit price`}<input required inputMode="decimal" value={line.price} onChange={(event) => updateLine(line.key, 'price', event.target.value)} /></label><label>{t`Tax %`}<input required inputMode="decimal" value={line.tax} onChange={(event) => updateLine(line.key, 'tax', event.target.value)} /></label><label>{t`Discount %`}<input required inputMode="decimal" value={line.discount} onChange={(event) => updateLine(line.key, 'discount', event.target.value)} /></label></div>
      {lines.length > 1 && <LessBusyRetry type="button" onClick={() => { setLines((previous) => previous.filter((item) => item.key !== line.key)); setConfirmed(false); }}>{t`Remove item`}</LessBusyRetry>}
    </fieldset>)}
    {lines.length < 200 && <LessBusyRetry type="button" onClick={() => { setLines((previous) => [...previous, newLine()]); setConfirmed(false); }}>{t`Add item`}</LessBusyRetry>}
    <label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{draft ? t`I have reviewed these details and want to update this draft.` : t`I have reviewed these details and want to create this draft.`}</label>
    {(validation || error) && <p role="alert">{validation || error}</p>}
    <LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Saving…` : draft ? t`Save draft` : t`Create draft`}</LessBusyRetry></LessBusyActions>
  </LessBusyForm>;
};

