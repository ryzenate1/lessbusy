import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyRetry, LessBusySection } from '@/lessbusy/components/LessBusyStyles';

export const LessBusyReservationExpiry = () => {
  const reservations = useLessBusyObjectAccess('lbStockReservation');
  const operations = useLessBusyObjectAccess('lbInventoryOperation');
  const { request, pending, error } = useLessBusyApi();
  const [reviewing, setReviewing] = useState(false);
  const [asOf, setAsOf] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<{ released: number; hasMore: boolean } | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const operationKey = useRef<string | null>(null);
  if (!reservations.canWrite || !operations.canWrite) return null;
  return <LessBusySection><h2>{t`Expired reservations`}</h2><LessBusyDescription>{t`Expired stock remains reserved until released. Process a bounded batch to make it available again. When an order reservation expires, its reserved items are released together and the order returns to unreserved stock.`}</LessBusyDescription>{!reviewing ? <LessBusyRetry onClick={() => { setAsOf(new Date().toISOString()); setReviewing(true); setResult(null); operationKey.current = null; }}>{t`Review expiry release`}</LessBusyRetry> : <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (pending || !confirmed) return;
    setValidation(null);
    try {
      operationKey.current ??= crypto.randomUUID();
      const saved = z.object({ released: z.number().int(), hasMore: z.boolean() }).parse(await request('inventory/expire-reservations', 'POST', { asOf, operationKey: operationKey.current, confirmed: true }));
      setResult(saved); setConfirmed(false); operationKey.current = null;
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not release expired reservations.`); }
  }}><p>{t`Release reservations expired by`}: {asOf ? new Date(asOf).toLocaleString() : ''}</p><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`Release this batch of expired reservations, including linked order stock`}</label>{result && <p role="status">{result.hasMore ? t`${result.released} reservations released. More expired reservations remain; confirm another batch to continue.` : t`${result.released} reservations released. No more expired reservations were found in this cutoff and your access.`}</p>}{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed || Boolean(result && !result.hasMore)}>{pending ? t`Releasing…` : t`Release expired batch`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => { setReviewing(false); setConfirmed(false); }}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm>}</LessBusySection>;
};
