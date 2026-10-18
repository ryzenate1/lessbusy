import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyDescription, LessBusyLink, LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

type Props = { source: { id: string; variantId: string; warehouseId: string; version: number; onHandUnits: number; reservedUnits: number }; onSaved: () => Promise<unknown> };
type Target = ObjectRecord & { name: string; version: number; onHandUnits: number; reservedUnits: number };
const TransferForm = ({ source, onSaved }: Props) => {
  const { request, pending, error } = useLessBusyApi();
  const [targetId, setTargetId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  const { records, loading, error: loadError, hasNextPage, fetchMoreRecords, refetch } = useFindManyRecords<Target>({ objectNameSingular: 'lbStockBalance', filter: { and: [{ variantId: { eq: source.variantId } }, { warehouseId: { neq: source.warehouseId } }] }, orderBy: [{ name: 'AscNullsLast' }], limit: 25, recordGqlFields: { id: true, name: true, version: true, onHandUnits: true, reservedUnits: true } });
  const target = records.find((record) => record.id === targetId);
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending || !confirmed || !target || saved) return;
    const command = { sourceBalanceId: source.id, targetBalanceId: target.id, expectedSourceVersion: source.version, expectedTargetVersion: target.version, quantityUnits: Number(quantity), reason };
    const payload = JSON.stringify(command); if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
    try { await request('inventory/transfers', 'POST', { ...command, operationKey: operation.current.key, confirmed: true }); setSaved(true); setConfirmed(false); await onSaved(); } catch { setConfirmed(false); }
  }}><h2>{t`Transfer between locations`}</h2><LessBusyDescription>{t`Move available stock of this product option to another active location. Both balances and their movement histories are saved together. Reserved stock stays at its current location.`}</LessBusyDescription><p>{t`${source.onHandUnits - source.reservedUnits} units available here`}</p>{loading && <p role="status">{t`Loading destination balances…`}</p>}{loadError && <p role="alert">{t`Destination balances could not be loaded.`}</p>}<label>{t`Destination balance`}<select required value={targetId} onChange={(event) => { setTargetId(event.target.value); setConfirmed(false); }}><option value="">{t`Choose a location`}</option>{records.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}</select></label>{hasNextPage && <LessBusyRetry type="button" disabled={loading} onClick={() => void fetchMoreRecords()}>{t`More destinations`}</LessBusyRetry>}<LessBusyRetry type="button" disabled={loading || pending} onClick={() => { setConfirmed(false); void refetch(); }}>{t`Refresh destinations`}</LessBusyRetry>{target && <p>{t`${target.onHandUnits} units on hand at the destination`}</p>}<label>{t`Quantity to transfer`}<input type="number" required min={1} step={1} max={source.onHandUnits - source.reservedUnits} value={quantity} onChange={(event) => { setQuantity(event.target.value); setConfirmed(false); }} /></label><label>{t`Reason or transfer reference`}<input required minLength={3} maxLength={1000} value={reason} onChange={(event) => { setReason(event.target.value); setConfirmed(false); }} /></label><LessBusyLink to="/business/inventory">{t`Set up this option at another location`}</LessBusyLink><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I reviewed the source, destination and quantity.`}</label>{error && <p role="alert">{error}</p>}{saved && <p role="status">{t`Transfer recorded.`}</p>}<LessBusyRetry type="submit" disabled={pending || !confirmed || !target || saved}>{pending ? t`Transferring…` : t`Confirm transfer`}</LessBusyRetry></LessBusyForm>;
};
export const LessBusyStockTransfer = (props: Props) => {
  const balance = useLessBusyObjectAccess('lbStockBalance'); const operation = useLessBusyObjectAccess('lbInventoryOperation'); const movement = useLessBusyObjectAccess('lbStockMovement');
  return balance.canWrite && balance.canReadFields('variant', 'warehouse', 'version', 'onHandUnits', 'reservedUnits') && operation.canWrite && movement.canWrite ? <TransferForm {...props} /> : null;
};
