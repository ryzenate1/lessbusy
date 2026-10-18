import { useEffect, useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import Papa from 'papaparse';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { moneyToMinorUnits } from '@/lessbusy/utils/moneyToMinorUnits';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';

type ImportRow = { operationKey: string; source: Record<string, string>; status: 'pending' | 'saved' | 'failed'; id?: string; error?: string };

export const LessBusyCatalogueImport = () => {
  const { request } = useLessBusyApi();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paused = useRef(false);
  const running = useRef(false);
  useEffect(() => () => { paused.current = true; }, []);
  const readFile = async (file?: File) => {
    if (!file || running.current) return;
    setError(null); setRows([]); setConfirmed(false);
    try {
      if (file.size > 1000000) throw new Error(t`Use a CSV file smaller than 1 MB.`);
      const result = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: 'greedy', transformHeader: (header) => header.trim().replace(/^\uFEFF/, '') });
      if (result.errors.length) throw new Error(t`The CSV could not be read. Check its headings, quotes and columns.`);
      if (!result.data.length || result.data.length > 50) throw new Error(t`Import between 1 and 50 simple products at a time.`);
      const headings = result.meta.fields ?? [];
      if (['name', 'sku', 'currency', 'price'].some((heading) => !headings.includes(heading))) throw new Error(t`Include the required headings: name, sku, currency, price.`);
      setRows(result.data.map((source) => ({ source, operationKey: crypto.randomUUID(), status: 'pending' })));
    } catch (failure) { setError(failure instanceof Error ? failure.message : t`Could not read the import file.`); }
  };
  const importRows = async () => {
    if (!confirmed || running.current) return;
    running.current = true; paused.current = false; setPending(true); setError(null);
    try {
      for (const row of rows) {
        if (paused.current) break;
        if (row.status === 'saved') continue;
        try {
          const value = row.source;
          const currency = (value.currency ?? '').trim().toUpperCase();
          const serviceValue = (value.isService ?? 'false').trim().toLowerCase();
          if (!['true', 'false'].includes(serviceValue)) throw new Error(t`isService must be true or false.`);
          const isService = serviceValue === 'true';
          const product = { name: (value.name ?? '').trim(), description: value.description ?? '', category: value.category ?? '', isService, status: (value.status || 'DRAFT').trim().toUpperCase(), currency, attributes: {}, images: [], variants: [{ sku: (value.sku ?? '').trim(), attributes: {}, unitAmountMinor: moneyToMinorUnits(value.price ?? '', currency), costAmountMinor: value.cost?.trim() ? moneyToMinorUnits(value.cost, currency) : null, taxBasisPoints: Number(moneyToMinorUnits(value.taxPercent?.trim() || '0', 'USD')), lowStockThresholdUnits: Number(value.lowStockThreshold?.trim() || '0'), barcode: value.barcode ?? '', status: 'ACTIVE', tracksInventory: !isService }] };
          const result = z.object({ id: z.string().uuid() }).parse(await request('products', 'POST', { product, operationKey: row.operationKey, expectedVersion: null, confirmed: true }));
          setRows((previous) => previous.map((item) => item.operationKey === row.operationKey ? { ...item, status: 'saved', id: result.id, error: undefined } : item));
        } catch (failure) { setRows((previous) => previous.map((item) => item.operationKey === row.operationKey ? { ...item, status: 'failed', error: failure instanceof Error ? failure.message : t`Could not import this row.` } : item)); }
      }
    } finally { running.current = false; setPending(false); }
  };
  const template = () => {
    const content = 'name,sku,currency,price,cost,taxPercent,category,isService,status,lowStockThreshold,barcode,description\nConsultation,CONSULT-001,INR,1500,,0,Services,true,DRAFT,0,,Initial consultation\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'lessbusy-product-import-template.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <><h1>{t`Import products and services`}</h1><LessBusyDescription>{t`Import up to 50 simple products per file. Each row creates one product and its standard sellable option. Prices use normal decimal amounts in the supplied currency. Add more options later in the product editor.`}</LessBusyDescription><LessBusyActions><LessBusyRetry onClick={template}>{t`Download CSV template`}</LessBusyRetry><LessBusyLink to="/products">{t`Back to products`}</LessBusyLink></LessBusyActions><LessBusyForm onSubmit={(event) => { event.preventDefault(); void importRows(); }}><label>{t`Choose CSV file`}<input type="file" accept=".csv,text/csv" disabled={pending} onChange={(event) => void readFile(event.target.files?.[0])} /></label>{error && <p role="alert">{error}</p>}{rows.length > 0 && <><p>{t`${rows.filter((row) => row.status === 'saved').length} of ${rows.length} products saved`}</p><LessBusyDescription>{t`Each row is saved independently. Successful rows are kept if another row fails. Retry uses the original operation keys; pausing stops before the next row.`}</LessBusyDescription><LessBusyTaskList>{rows.map((row, index) => <li key={row.operationKey}><p>{index + 1}. {row.source.name} · {row.source.sku} · {row.source.currency} {row.source.price}</p><LessBusyDescription>{row.status === 'saved' ? t`Saved` : row.status === 'failed' ? t`Needs attention` : t`Ready to import`}</LessBusyDescription>{row.error && <p role="alert">{row.error}</p>}{row.id && <LessBusyLink to={`/products/${row.id}`}>{t`Open product`}</LessBusyLink>}</li>)}</LessBusyTaskList><label data-confirmation><input type="checkbox" checked={confirmed} disabled={pending} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed these products, currencies and prices and want to import them.`}</label><LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed || rows.every((row) => row.status === 'saved')}>{pending ? t`Importing…` : t`Import pending or failed rows`}</LessBusyRetry>{pending && <LessBusyRetry type="button" onClick={() => { paused.current = true; }}>{t`Pause after current row`}</LessBusyRetry>}</LessBusyActions></>}</LessBusyForm></>;
};
