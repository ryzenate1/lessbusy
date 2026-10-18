import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type Location = ObjectRecord & { name: string; address: string | null; isActive: boolean | null };
const LocationForm = ({ location, onSaved, onCancel }: { location?: Location; onSaved: () => Promise<unknown>; onCancel: () => void }) => {
  const [name, setName] = useState(location?.name ?? ''); const [address, setAddress] = useState(location?.address ?? ''); const [active, setActive] = useState(location?.isActive ?? true);
  const [confirmed, setConfirmed] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState<string | null>(null);
  const id = useRef(crypto.randomUUID()); const running = useRef(false);
  const { createOneRecord } = useCreateOneRecord<Location>({ objectNameSingular: 'lbWarehouse', recordGqlFields: { id: true } });
  const { updateOneRecord } = useUpdateOneRecord();
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (!confirmed || running.current) return; running.current = true; setPending(true); setError(null);
    try {
      const values = { name: name.trim(), address: address.trim() || null, isActive: active };
      if (location) { const result = await updateOneRecord({ objectNameSingular: 'lbWarehouse', idToUpdate: location.id, updateOneRecordInput: values, recordGqlFields: { id: true } }); if (!result) throw new Error(t`The location could not be saved.`); }
      else { const result = await createOneRecord({ id: id.current, ...values }); if (!result) throw new Error(t`The location could not be created.`); }
      await onSaved();
    } catch (failure) { setError(failure instanceof Error ? failure.message : t`Could not save this location.`); }
    finally { running.current = false; setPending(false); }
  }}><h2>{location ? t`Edit location` : t`Add stock location`}</h2><label>{t`Location name`}<input required maxLength={250} value={name} onChange={(event) => { setName(event.target.value); setConfirmed(false); }} placeholder={t`Main store, warehouse, service centre…`} /></label><label>{t`Address (optional)`}<textarea rows={3} maxLength={4000} value={address} onChange={(event) => { setAddress(event.target.value); setConfirmed(false); }} /></label><label data-confirmation><input type="checkbox" checked={active} onChange={(event) => { setActive(event.target.checked); setConfirmed(false); }} />{t`Active location`}</label><LessBusyDescription>{t`Inactive locations keep their balances and movement history. New receiving, reservations and transfers require active locations.`}</LessBusyDescription><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I reviewed these location details.`}</label>{error && <p role="alert">{error}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={!confirmed || pending}>{pending ? t`Saving…` : t`Save location`}</LessBusyRetry><LessBusyRetry type="button" disabled={pending} onClick={onCancel}>{t`Cancel`}</LessBusyRetry></LessBusyActions></LessBusyForm>;
};
export const LessBusyLocations = () => {
  const access = useLessBusyObjectAccess('lbWarehouse');
  const [editing, setEditing] = useState<Location | 'new' | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const { records, loading, error, refetch, hasNextPage, fetchMoreRecords } = useFindManyRecords<Location>({ objectNameSingular: 'lbWarehouse', skip: !access.canReadFields('name', 'address', 'isActive'), filter: activeOnly ? { isActive: { eq: true } } : undefined, orderBy: [{ name: 'AscNullsLast' }], limit: 25, recordGqlFields: { id: true, name: true, address: true, isActive: true } });
  if (!access.canReadFields('name', 'address', 'isActive')) return <LessBusySection><p>{t`Location management requires access to location names, addresses and active status.`}</p></LessBusySection>;
  return <><LessBusySection><LessBusyLink to="/inventory">{t`Back to inventory`}</LessBusyLink><h1>{t`Your stock locations`}</h1><LessBusyDescription>{t`Keep stores, warehouses and other stock locations organized in one workspace.`}</LessBusyDescription><LessBusyActions>{access.canWriteFields('name', 'address', 'isActive') && <LessBusyRetry onClick={() => setEditing('new')}>{t`Add location`}</LessBusyRetry>}<LessBusyRetry aria-pressed={activeOnly} onClick={() => setActiveOnly((value) => !value)}>{activeOnly ? t`Show all locations` : t`Show active locations only`}</LessBusyRetry></LessBusyActions></LessBusySection>{editing && <LessBusySection><LocationForm key={editing === 'new' ? 'new' : editing.id} location={editing === 'new' ? undefined : editing} onSaved={async () => { setEditing(null); await refetch(); }} onCancel={() => setEditing(null)} /></LessBusySection>}<LessBusySection>{loading && <p role="status">{t`Loading locations…`}</p>}{error && <><p role="alert">{t`Locations could not be loaded.`}</p><LessBusyRetry onClick={() => void refetch()}>{t`Retry`}</LessBusyRetry></>}<LessBusyTaskList>{records.map((location) => <li key={location.id}><h2>{location.name || t`Unnamed location`}</h2><LessBusyDescription>{location.isActive ? t`Active` : t`Inactive`}</LessBusyDescription>{location.address && <p style={{ whiteSpace: 'pre-wrap' }}>{location.address}</p>}<LessBusyActions>{access.canWriteFields('name', 'address', 'isActive') && <LessBusyRetry onClick={() => setEditing(location)}>{t`Edit location`}</LessBusyRetry>}<LessBusyLink to={`/object/lbWarehouse/${location.id}`}>{t`Open full record`}</LessBusyLink></LessBusyActions></li>)}</LessBusyTaskList>{!loading && !error && !records.length && <p>{t`No locations in this view. Add your first stock location to begin.`}</p>}{hasNextPage && <LessBusyRetry disabled={loading} onClick={() => void fetchMoreRecords()}>{t`Load more locations`}</LessBusyRetry>}</LessBusySection></>;
};
