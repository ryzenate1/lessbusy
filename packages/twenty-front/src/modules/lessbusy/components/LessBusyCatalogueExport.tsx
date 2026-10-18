import { useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import Papa from 'papaparse';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

const rowSchema = z.object({ productId: z.string().uuid(), variantId: z.string().uuid(), name: z.string(), description: z.string(), category: z.string(), isService: z.boolean(), status: z.string().nullable(), currency: z.string(), sku: z.string(), attributes: z.record(z.string(), z.string()), unitAmountMinor: z.string().regex(/^\d+$/), costAmountMinor: z.string().regex(/^\d+$/).nullable().optional(), taxBasisPoints: z.number(), lowStockThreshold: z.number(), barcode: z.string(), optionStatus: z.string().nullable(), tracksInventory: z.boolean() });
const batchSchema = z.object({ rows: z.array(rowSchema), scannedOptions: z.number(), inaccessibleProducts: z.number(), nextCursor: z.string().uuid().nullable(), asOf: z.string() });
type ExportRow = z.infer<typeof rowSchema>;
export const LessBusyCatalogueExport = () => {
  const { request, pending, error } = useLessBusyApi();
  const access = useLessBusyObjectAccess('lbProductVariant');
  const [rows, setRows] = useState<ExportRow[]>([]); const [cursor, setCursor] = useState<string | null | undefined>(undefined); const [includeCost, setIncludeCost] = useState(false); const [skipped, setSkipped] = useState(0); const [asOf, setAsOf] = useState<string | null>(null); const running = useRef(false);
  const load = async () => {
    if (running.current || cursor === null || rows.length >= 1000) return; running.current = true;
    try {
      const batch = batchSchema.parse(await request(`products/export?includeCost=${includeCost}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`));
      setRows((previous) => [...new Map([...previous, ...batch.rows].map((row) => [row.variantId, row])).values()]); setCursor(batch.nextCursor); setSkipped((previous) => previous + batch.inaccessibleProducts); setAsOf(batch.asOf);
    } catch { /* Error is shown by the API hook. */ } finally { running.current = false; }
  };
  const download = () => {
    const decimal = (minor: string, currency: string) => formatLessBusyMoney(minor, currency).slice(currency.length + 1);
    const content = Papa.unparse(rows.map((row) => ({ name: row.name, sku: row.sku, currency: row.currency, price: decimal(row.unitAmountMinor, row.currency), ...(includeCost ? { cost: row.costAmountMinor ? decimal(row.costAmountMinor, row.currency) : '' } : {}), taxPercent: String(row.taxBasisPoints / 100), category: row.category, isService: String(row.isService), status: row.status ?? '', lowStockThreshold: row.lowStockThreshold, barcode: row.barcode, description: row.description, productId: row.productId, variantId: row.variantId, optionStatus: row.optionStatus ?? '', tracksInventory: String(row.tracksInventory), attributes: JSON.stringify(row.attributes) })), { escapeFormulae: true });
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = cursor === null ? 'lessbusy-catalogue.csv' : 'lessbusy-catalogue-partial.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <><h1>{t`Export your catalogue`}</h1><LessBusyDescription>{t`Load up to 50 sellable options per batch. Each CSV row keeps its product and option IDs, configured attributes, exact decimal selling price and stock rules. This export is a live read and may change while you load it.`}</LessBusyDescription><LessBusyDescription>{t`The simple-product importer creates new products. It does not update records or restore a multi-option catalogue from this export.`}</LessBusyDescription><LessBusyLink to="/products">{t`Back to products`}</LessBusyLink>{access.canReadFields('costAmountMinor') && <label style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44 }}><input type="checkbox" checked={includeCost} disabled={cursor !== undefined || pending} onChange={(event) => setIncludeCost(event.target.checked)} />{t`Include authorized cost prices`}</label>}<p>{t`${rows.length} options loaded into this export file`}</p>{cursor === null && <p role="status">{t`All remaining permitted options have been checked.`}</p>}{cursor && <p>{t`This file is partial. More options remain to be checked.`}</p>}{skipped > 0 && <LessBusyDescription>{t`${skipped} options were omitted because their product was unavailable in your access.`}</LessBusyDescription>}{asOf && <LessBusyDescription>{t`Last batch read`}: {new Date(asOf).toLocaleString()}</LessBusyDescription>}{error && <p role="alert">{error}</p>}<LessBusyActions><LessBusyRetry disabled={pending || cursor === null || rows.length >= 1000} onClick={() => void load()}>{pending ? t`Loading…` : cursor === undefined ? t`Load first batch` : t`Load next batch`}</LessBusyRetry><LessBusyRetry disabled={!rows.length || pending} onClick={download}>{cursor === null ? t`Download loaded results` : t`Download partial results`}</LessBusyRetry>{rows.length >= 1000 && cursor && <LessBusyRetry disabled={pending} onClick={() => { setRows([]); setSkipped(0); }}>{t`Start the next export file after downloading`}</LessBusyRetry>}</LessBusyActions><LessBusyTaskList>{rows.slice(-10).map((row) => <li key={row.variantId}>{row.name} · {row.sku} · {formatLessBusyMoney(row.unitAmountMinor, row.currency)}</li>)}</LessBusyTaskList></>;
};
