import { LessBusyLocations } from '~/pages/lessbusy/LessBusyLocations';
import { LessBusyStockTransfer } from '@/lessbusy/components/LessBusyStockTransfer';
import { LessBusyReservationExpiry } from '@/lessbusy/components/LessBusyReservationExpiry';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { escapeForIlike, isValidUuid } from 'twenty-shared/utils';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { FormSingleRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormSingleRecordPicker';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

type Balance = ObjectRecord & { name: string; onHandUnits: number; reservedUnits: number; version: number; variantId: string; warehouseId: string };
type Reservation = ObjectRecord & { name: string; quantityUnits: number; status: string; expiresAt: string | null; salesOrderId: string | null };
type Movement = ObjectRecord & { kind: string; quantityUnits: number; reason: string | null; createdAt: string };

const StockCommand = ({ balanceId, reservation, onSaved }: { balanceId: string; reservation?: Reservation; onSaved: () => Promise<unknown> }) => {
  const { request, pending, error } = useLessBusyApi();
  const [action, setAction] = useState(reservation ? 'release' : 'receive');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (!confirmed || pending) return;
    setValidation(null);
    try {
      const command = reservation ? { action, reservationId: reservation.id } : { action, balanceId, quantityUnits: Number(quantity), ...(action === 'reserve' ? (expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}) : { reason }) };
      const payload = JSON.stringify(command);
      if (operation.current?.payload !== payload) operation.current = { payload, key: crypto.randomUUID() };
      await request('inventory/actions', 'POST', { ...command, confirmed: true, operationKey: operation.current.key });
      setConfirmed(false); await onSaved();
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not save this stock action.`); }
  }}><label>{t`Stock action`}<select value={action} onChange={(event) => { setAction(event.target.value); setConfirmed(false); }}>{reservation ? <><option value="release">{t`Release reservation`}</option><option value="commit" disabled={Boolean(reservation.expiresAt && new Date(reservation.expiresAt).getTime() <= Date.now())}>{t`Commit reservation`}</option></> : <><option value="receive">{t`Receive stock`}</option><option value="adjust">{t`Correct stock count`}</option><option value="reserve">{t`Reserve stock manually`}</option></>}</select></label>{!reservation && <label>{action === 'adjust' ? t`Quantity change (positive or negative)` : t`Quantity`}<input required type="number" step={1} min={action === 'adjust' ? -1000000000 : 1} max={1000000000} value={quantity} onChange={(event) => { setQuantity(event.target.value); setConfirmed(false); }} /></label>}{!reservation && action !== 'reserve' && <label>{t`Reason or receiving reference`}<input required minLength={3} maxLength={1000} value={reason} onChange={(event) => { setReason(event.target.value); setConfirmed(false); }} /></label>}{!reservation && action === 'reserve' && <label>{t`Expiry (optional)`}<input type="datetime-local" value={expiresAt} onChange={(event) => { setExpiresAt(event.target.value); setConfirmed(false); }} /></label>}<label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed the quantity and confirm this stock change.`}</label>{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyRetry type="submit" disabled={!confirmed || pending}>{pending ? t`Saving…` : t`Confirm stock action`}</LessBusyRetry></LessBusyForm>;
};

const StockHistory = ({ id, onSaved }: { id: string; onSaved: () => Promise<unknown> }) => {
  const { canWrite } = useLessBusyObjectAccess('lbStockReservation');
  const [selected, setSelected] = useState<string | null>(null);
  const reservations = useFindManyRecords<Reservation>({ objectNameSingular: 'lbStockReservation', filter: { and: [{ balanceId: { eq: id } }, { status: { eq: 'ACTIVE' } }] }, limit: 20, recordGqlFields: { id: true, name: true, quantityUnits: true, status: true, expiresAt: true, salesOrderId: true } });
  const movements = useFindManyRecords<Movement>({ objectNameSingular: 'lbStockMovement', filter: { balanceId: { eq: id } }, limit: 25, orderBy: [{ createdAt: 'DescNullsLast' }], recordGqlFields: { id: true, kind: true, quantityUnits: true, reason: true, createdAt: true } });
  return <><LessBusySection><h2>{t`Active reservations`}</h2>{reservations.loading && <p role="status">{t`Loading reservations…`}</p>}{reservations.error && <p role="alert">{t`Reservations could not be loaded.`}</p>}<LessBusyTaskList>{reservations.records.map((reservation) => <li key={reservation.id}><p>{t`${reservation.quantityUnits} units reserved`}{reservation.expiresAt && new Date(reservation.expiresAt).getTime() <= Date.now() ? ` · ${t`Expired — release required`}` : ''}</p>{reservation.expiresAt && <LessBusyDescription>{t`Expires`}: {new Date(reservation.expiresAt).toLocaleString()}</LessBusyDescription>}{reservation.salesOrderId ? <LessBusyLink to={`/business/orders/${reservation.salesOrderId}`}>{t`Manage from linked order`}</LessBusyLink> : canWrite && <><LessBusyRetry onClick={() => setSelected(selected === reservation.id ? null : reservation.id)}>{t`Manage reservation`}</LessBusyRetry>{selected === reservation.id && <StockCommand balanceId={id} reservation={reservation} onSaved={onSaved} />}</>}</li>)}</LessBusyTaskList>{!reservations.loading && !reservations.error && !reservations.records.length && <LessBusyDescription>{t`No active reservations.`}</LessBusyDescription>}{reservations.hasNextPage && <LessBusyRetry onClick={() => void reservations.fetchMoreRecords()}>{t`Load more reservations`}</LessBusyRetry>}</LessBusySection><LessBusySection><h2>{t`Stock movement history`}</h2>{movements.loading && <p role="status">{t`Loading movements…`}</p>}{movements.error && <p role="alert">{t`Movement history could not be loaded.`}</p>}<LessBusyTaskList>{movements.records.map((movement) => <li key={movement.id}><p>{movement.kind} · {movement.quantityUnits}</p><LessBusyDescription>{movement.reason}</LessBusyDescription><time dateTime={movement.createdAt}>{new Date(movement.createdAt).toLocaleString()}</time></li>)}</LessBusyTaskList>{!movements.loading && !movements.error && !movements.records.length && <LessBusyDescription>{t`No stock movements yet.`}</LessBusyDescription>}{movements.hasNextPage && <LessBusyRetry onClick={() => void movements.fetchMoreRecords()}>{t`Load older movements`}</LessBusyRetry>}</LessBusySection></>;
};

const BalanceDetails = ({ id }: { id: string }) => {
  const { canWrite } = useLessBusyObjectAccess('lbStockBalance');
  const { record, loading, error, refetch } = useFindOneRecord<Balance>({ objectNameSingular: 'lbStockBalance', objectRecordId: id, recordGqlFields: { id: true, name: true, variantId: true, warehouseId: true, onHandUnits: true, reservedUnits: true, version: true } });
  return <>{loading && <p role="status">{t`Loading stock balance…`}</p>}{error && <><p role="alert">{t`This stock balance could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></>}{record && <><LessBusySection><LessBusyLink to="/inventory">{t`All inventory`}</LessBusyLink><h1>{record.name}</h1><dl><dt>{t`Available`}</dt><dd>{record.onHandUnits - record.reservedUnits}</dd><dt>{t`On hand`}</dt><dd>{record.onHandUnits}</dd><dt>{t`Reserved`}</dt><dd>{record.reservedUnits}</dd></dl></LessBusySection>{canWrite && <LessBusySection><h2>{t`Record a stock change`}</h2><StockCommand key={record.version} balanceId={id} onSaved={refetch} /></LessBusySection>}<LessBusySection><LessBusyStockTransfer key={`transfer:${id}:${record.version}`} source={record} onSaved={refetch} /></LessBusySection><StockHistory key={`${id}:${record.version}`} id={id} onSaved={refetch} /></>}</>;
};

const InventoryDirectory = () => {
  const [query, setQuery] = useState(''); const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Balance>({ objectNameSingular: 'lbStockBalance', filter: { and: [...(search ? [{ name: { ilike: `%${escapeForIlike(search)}%` } }] : []), ...(warehouseId ? [{ warehouseId: { eq: warehouseId } }] : [])] }, orderBy: [{ name: 'AscNullsLast' }], limit: 25, recordGqlFields: { id: true, name: true, onHandUnits: true, reservedUnits: true, version: true } });
  return <><LessBusySection><h1>{t`Know what is available to sell.`}</h1><LessBusyDescription>{t`Available stock is on hand minus reserved. Open a balance to receive goods, correct counts and review reservations or movement history.`}</LessBusyDescription><LessBusyActions><LessBusyLink to="/inventory/locations">{t`Manage locations`}</LessBusyLink><LessBusyLink to="/business/low-stock">{t`Review low stock`}</LessBusyLink><LessBusyLink to="/business/inventory">{t`Set up stock at a location`}</LessBusyLink></LessBusyActions></LessBusySection><LessBusySection><LessBusyForm onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }}><label>{t`Search inventory`}<input type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} /></label><FormSingleRecordPicker label={t`Location (optional)`} objectNameSingulars={['lbWarehouse']} defaultValue={warehouseId} onClear={() => setWarehouseId(null)} onChange={(value) => setWarehouseId(typeof value === 'string' && isValidUuid(value) ? value : null)} /><LessBusyRetry type="submit">{t`Search`}</LessBusyRetry></LessBusyForm></LessBusySection><LessBusySection>{loading && <p role="status">{t`Loading inventory…`}</p>}{error ? <><p role="alert">{t`Inventory could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></> : <><LessBusyTaskList>{records.map((balance) => <li key={balance.id}><LessBusyLink to={`/inventory/${balance.id}`}>{balance.name}</LessBusyLink><LessBusyDescription>{t`${balance.onHandUnits - balance.reservedUnits} available · ${balance.onHandUnits} on hand · ${balance.reservedUnits} reserved`}</LessBusyDescription></li>)}</LessBusyTaskList>{!loading && !records.length && <LessBusyDescription>{t`No balances in this view. Set up a product option at a location to start receiving stock.`}</LessBusyDescription>}{hasNextPage && <LessBusyRetry onClick={() => void fetchMoreRecords()}>{t`Load more balances`}</LessBusyRetry>}</>}</LessBusySection></>;
};

export const LessBusyInventory = () => {
  const { balanceId } = useParams();
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Inventory`} />}><LessBusyContent><LessBusyObjectGate objectName="lbStockBalance">{balanceId === 'locations' ? <LessBusyLocations key={workspace?.id} /> : balanceId ? <BalanceDetails key={`${workspace?.id}:${balanceId}`} id={balanceId} /> : <><InventoryDirectory key={workspace?.id} /><LessBusyReservationExpiry key={`expiry:${workspace?.id}`} /></>}</LessBusyObjectGate></LessBusyContent></PageCardLayout>;
};
