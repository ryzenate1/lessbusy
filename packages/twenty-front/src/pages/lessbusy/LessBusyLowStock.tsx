import { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { LessBusyObjectGate } from '@/lessbusy/components/LessBusyObjectGate';
import { LessBusyContent, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusySection, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

const responseSchema = z.object({ items: z.array(z.object({ id: z.string().uuid(), name: z.string(), sku: z.string().nullable().optional(), availableUnits: z.number(), reservedUnits: z.number(), thresholdUnits: z.number() })), nextCursor: z.string().uuid().nullable(), hasMore: z.boolean() });
const LowStockList = () => {
  const { request, pending, error } = useLessBusyApi();
  const [items, setItems] = useState<z.infer<typeof responseSchema>['items']>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const load = useCallback(async (next?: string) => { try { const result = responseSchema.parse(await request(`inventory/low-stock${next ? `?cursor=${encodeURIComponent(next)}` : ''}`)); setItems((previous) => next ? [...new Map([...previous, ...result.items].map((item) => [item.id, item])).values()] : result.items); setCursor(result.nextCursor); setHasMore(result.hasMore); } catch { setHasMore(false); } }, [request]);
  useEffect(() => { void load(); }, [load]);
  return <><LessBusyTaskList>{items.map((item) => <li key={item.id}><LessBusyLink to={`/inventory/${item.id}`}>{item.name}</LessBusyLink><LessBusyDescription>{t`${item.availableUnits} available · ${item.reservedUnits} reserved · minimum ${item.thresholdUnits}`}</LessBusyDescription></li>)}</LessBusyTaskList>{pending && <p role="status">{t`Checking stock…`}</p>}{error && <p role="alert">{error}</p>}{!pending && !error && !items.length && <LessBusyDescription>{hasMore ? t`No low-stock items in the checked batch. Continue to check the rest of your inventory.` : t`No items with a configured threshold are currently low in stock within your access.`}</LessBusyDescription>}<LessBusyRetry disabled={pending} onClick={() => void load()}>{t`Refresh`}</LessBusyRetry>{hasMore && cursor && <LessBusyRetry disabled={pending} onClick={() => void load(cursor)}>{t`Check next batch`}</LessBusyRetry>}</>;
};
export const LessBusyLowStock = () => {
  const workspace = useAtomStateValue(currentWorkspaceState);
  return <PageCardLayout header={<PageCardHeader title={t`Low stock`} />}><LessBusyContent><LessBusySection><h1>{t`Know what needs replenishing.`}</h1><LessBusyDescription>{t`Available stock is what is on hand after reservations. Set a minimum level on each product variant to include it here.`}</LessBusyDescription></LessBusySection><LessBusySection><LessBusyObjectGate objectName="lbStockBalance"><LowStockList key={workspace?.id} /></LessBusyObjectGate></LessBusySection></LessBusyContent></PageCardLayout>;
};
