import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { isValidUuid } from 'twenty-shared/utils';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyContent, LessBusyDescription, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';

const InventoryForms = () => {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [balanceId, setBalanceId] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [action, setAction] = useState('adjust');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [operation, setOperation] = useState<{ key: string; payload: string } | null>(null);
  const { request, pending, error } = useLessBusyApi();
  const asId = (value: unknown) => typeof value === 'string' && isValidUuid(value) ? value : null;
  return <>
    <LessBusySection><h1>{t`Keep stock accurate`}</h1><LessBusyDescription>{t`Use base units for quantities. Reservations keep stock aside; committing a reservation records fulfilment.`}</LessBusyDescription></LessBusySection>
    <LessBusySection><LessBusyForm onSubmit={async (event) => { event.preventDefault(); if (!variantId || !warehouseId || pending) return; try { const balance = await request<{ id: string }>('inventory/balances', 'POST', { variantId, warehouseId }); setBalanceId(balance.id); setResult(t`Stock location is ready. Select an action below.`); } catch { setResult(null); } }}>
      <h2>{t`Set up stock for a location`}</h2>
      <FormSingleRecordPicker label={t`Product variant`} objectNameSingulars={['lbProductVariant']} defaultValue={variantId} onChange={(value) => setVariantId(asId(value))} />
      <FormSingleRecordPicker label={t`Location`} objectNameSingulars={['lbWarehouse']} defaultValue={warehouseId} onChange={(value) => setWarehouseId(asId(value))} />
      <LessBusyRetry type="submit" disabled={pending || !variantId || !warehouseId}>{t`Use this stock location`}</LessBusyRetry>
    </LessBusyForm></LessBusySection>
    <LessBusySection><LessBusyForm onSubmit={async (event) => {
      event.preventDefault(); if (!confirmed || pending) return;
      const command = action === 'adjust' || action === 'reserve' ? { action, balanceId, quantityUnits: Number(quantity), ...(action === 'adjust' ? { reason } : {}) } : { action, reservationId };
      const payload = JSON.stringify(command);
      const operationKey = operation?.payload === payload ? operation.key : crypto.randomUUID();
      setOperation({ key: operationKey, payload });
      try { const change = await request<{ onHandUnits: number; reservedUnits: number; availableUnits: number }>('inventory/actions', 'POST', { ...command, confirmed: true, operationKey }); setResult(t`Stock updated: ${change.onHandUnits} on hand, ${change.reservedUnits} reserved, ${change.availableUnits} available.`); setConfirmed(false); setOperation(null); } catch { setResult(null); }
    }}>
      <h2>{t`Record a stock change`}</h2>
      <label>{t`Action`}<select value={action} onChange={(event) => { setAction(event.target.value); setConfirmed(false); }}><option value="adjust">{t`Adjust stock`}</option><option value="reserve">{t`Reserve for an order`}</option><option value="commit">{t`Fulfil a reservation`}</option><option value="release">{t`Release a reservation`}</option></select></label>
      {['adjust','reserve'].includes(action) ? <><FormSingleRecordPicker key={balanceId ?? 'balance'} label={t`Stock balance`} objectNameSingulars={['lbStockBalance']} defaultValue={balanceId} onChange={(value) => { setBalanceId(asId(value)); setConfirmed(false); }} /><label>{t`Quantity in base units`}<input required type="number" step={1} min={action === 'reserve' ? 1 : -1000000000} max={1000000000} value={quantity} onChange={(event) => { setQuantity(event.target.value); setConfirmed(false); }} /></label></> : <FormSingleRecordPicker label={t`Reservation`} objectNameSingulars={['lbStockReservation']} defaultValue={reservationId} onChange={(value) => { setReservationId(asId(value)); setConfirmed(false); }} />}
      {action === 'adjust' && <label>{t`Reason`}<textarea required minLength={3} maxLength={1000} value={reason} onChange={(event) => { setReason(event.target.value); setConfirmed(false); }} /></label>}
      <label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed and confirm this stock change.`}</label>
      <LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Saving…` : t`Record change`}</LessBusyRetry>
    </LessBusyForm></LessBusySection>
    {error && <LessBusySection><p role="alert">{error}</p></LessBusySection>}{result && <LessBusySection><p role="status">{result}</p></LessBusySection>}
  </>;
};

export const LessBusyInventoryActions = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Inventory`} />}><LessBusyContent><LessBusyObjectGate objectName="lbStockBalance"><InventoryForms key={workspace?.id} /></LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
