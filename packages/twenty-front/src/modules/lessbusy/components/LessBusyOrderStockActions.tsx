import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { isValidUuid } from 'twenty-shared/utils';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';

type LessBusyOrderStockActionsProps = { id: string; version: number; inventoryState?: string | null; onSaved: () => Promise<void> };

export const LessBusyOrderStockActions = ({ id, version, inventoryState, onSaved }: LessBusyOrderStockActionsProps) => {
  const balanceAccess = useLessBusyObjectAccess('lbStockBalance');
  const orderAccess = useLessBusyObjectAccess('lbSalesOrder');
  const { request, pending, error } = useLessBusyApi();
  const [action, setAction] = useState<'reserve' | 'release' | 'fulfill' | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  if (!balanceAccess.canWrite || !orderAccess.canWrite) return null;
  return <LessBusySection><h2>{t`Order inventory`}</h2><LessBusyDescription>{inventoryState === 'RESERVED' ? t`Stock is reserved for this order. Fulfill to commit those quantities, or release them before cancellation or reallocation.` : t`Reserve stock-tracked product options from one location. Service lines and manually entered lines without a product option do not change stock.`}</LessBusyDescription><LessBusyActions>{inventoryState === 'RESERVED' ? <><LessBusyRetry onClick={() => { setAction('fulfill'); setConfirmed(false); }}>{t`Fulfill reserved stock`}</LessBusyRetry><LessBusyRetry onClick={() => { setAction('release'); setConfirmed(false); }}>{t`Release stock`}</LessBusyRetry></> : <LessBusyRetry onClick={() => { setAction('reserve'); setConfirmed(false); }}>{t`Reserve order stock`}</LessBusyRetry>}</LessBusyActions>
    {action && <LessBusyForm onSubmit={async (event) => {
      event.preventDefault(); if (!confirmed || pending) return;
      setValidation(null);
      try {
        if (action === 'reserve' && !warehouseId) throw new Error(t`Choose a stock location.`);
        const command = { action, expectedVersion: version, ...(action === 'reserve' ? { warehouseId, ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}) } : {}) };
        const payload = JSON.stringify(command);
        if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
        await request(`orders/${id}/inventory`, 'POST', { ...command, confirmed: true, operationKey: operation.current.key });
        await onSaved(); setAction(null); setConfirmed(false);
      } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not update order stock.`); }
    }}>{action === 'reserve' && <><FormSingleRecordPicker label={t`Stock location`} objectNameSingulars={['lbWarehouse']} defaultValue={warehouseId} onChange={(value) => { setWarehouseId(typeof value === 'string' && isValidUuid(value) ? value : null); setConfirmed(false); }} /><label>{t`Reservation expiry (optional)`}<input type="datetime-local" value={expiresAt} onChange={(event) => { setExpiresAt(event.target.value); setConfirmed(false); }} /></label></>}<label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{action === 'fulfill' ? t`Commit the reserved quantities and mark this order fulfilled` : action === 'release' ? t`Release this order's stock reservations` : t`Reserve all stock-tracked items at the selected location`}</label>{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Saving…` : t`Confirm stock action`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => setAction(null)}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm>}
  </LessBusySection>;
};
