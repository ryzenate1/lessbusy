import { useEffect, useRef, useState } from 'react';
import { t } from '@lingui/core/macro';
import Papa from 'papaparse';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry, LessBusyTaskList } from '@/lessbusy/components/LessBusyStyles';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';

type Row = { source: Record<string, string>; key: string; state: 'ready' | 'saved' | 'failed'; allowDuplicate: boolean; id?: string; error?: string };
export const LessBusyCustomerImport = () => {
  const { request } = useLessBusyApi();
  const [rows, setRows] = useState<Row[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const paused = useRef(false);
  useEffect(() => () => { paused.current = true; }, []);
  const read = async (file?: File) => {
    if (!file || running.current) return;
    setRows([]); setError(null); setConfirmed(false);
    try {
      if (file.size > 1000000) throw new Error(t`Choose a CSV file smaller than 1 MB.`);
      const csv = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: 'greedy', transformHeader: (header) => header.trim().replace(/^\uFEFF/, '') });
      if (csv.errors.length) throw new Error(t`Check the CSV headings, columns and quotation marks.`);
      if (!csv.data.length || csv.data.length > 50) throw new Error(t`Import between 1 and 50 customers at a time.`);
      if (!['firstName', 'instagramIdentity', 'whatsappIdentity'].some((key) => csv.meta.fields?.includes(key))) throw new Error(t`Include firstName, instagramIdentity or whatsappIdentity as a heading.`);
      setRows(csv.data.map((source) => ({ source, key: crypto.randomUUID(), state: 'ready', allowDuplicate: false })));
    } catch (failure) { setError(failure instanceof Error ? failure.message : t`Could not read this file.`); }
  };
  const save = async () => {
    if (!confirmed || running.current) return;
    running.current = true; paused.current = false; setPending(true);
    try {
      for (const row of rows) {
        if (paused.current) break;
        if (row.state === 'saved') continue;
        try {
          const value = row.source;
          const customer = { firstName: (value.firstName ?? '').trim(), lastName: (value.lastName ?? '').trim(), email: (value.email ?? '').trim(), source: (value.source ?? '').trim(), tags: (value.tags ?? '').split('|').map((tag) => tag.trim()).filter(Boolean), instagramIdentity: (value.instagramIdentity ?? '').trim(), whatsappIdentity: (value.whatsappIdentity ?? '').trim() };
          const result = z.object({ id: z.string().uuid() }).parse(await request('customers/import', 'POST', { operationKey: row.key, customer, allowDuplicate: row.allowDuplicate, confirmed: true }));
          setRows((previous) => previous.map((item) => item.key === row.key ? { ...item, state: 'saved', id: result.id, error: undefined } : item));
        } catch (failure) { setRows((previous) => previous.map((item) => item.key === row.key ? { ...item, state: 'failed', error: failure instanceof Error ? failure.message : t`Could not save this customer.` } : item)); }
      }
    } finally { running.current = false; setPending(false); }
  };
  const template = () => {
    const url = URL.createObjectURL(new Blob(['firstName,lastName,email,source,tags,instagramIdentity,whatsappIdentity\n'], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'lessbusy-customer-import-template.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <><h1>{t`Import customers`}</h1><LessBusyDescription>{t`Preview up to 50 rows. A name or social identity is required; a phone number is optional. Separate tags with |. Each successful row is kept, and retries reuse its original operation key.`}</LessBusyDescription><LessBusyDescription>{t`Existing readable customers with the same email or social identity are flagged for review. This is a duplicate warning, not a global uniqueness guarantee.`}</LessBusyDescription><LessBusyActions><LessBusyRetry onClick={template}>{t`Download CSV template`}</LessBusyRetry><LessBusyLink to="/customers">{t`Back to customers`}</LessBusyLink></LessBusyActions><LessBusyForm onSubmit={(event) => { event.preventDefault(); void save(); }}><label>{t`CSV file`}<input type="file" accept=".csv,text/csv" disabled={pending} onChange={(event) => void read(event.target.files?.[0])} /></label>{error && <p role="alert">{error}</p>}{rows.length > 0 && <><p>{t`${rows.filter((row) => row.state === 'saved').length} of ${rows.length} customers saved`}</p><LessBusyTaskList>{rows.map((row, index) => <li key={row.key}><p>{index + 1}. {[row.source.firstName, row.source.lastName].filter(Boolean).join(' ') || row.source.instagramIdentity || row.source.whatsappIdentity}</p><LessBusyDescription>{[row.source.email, row.source.source, row.source.tags].filter(Boolean).join(' · ')}</LessBusyDescription><p>{row.state === 'saved' ? t`Saved` : row.state === 'failed' ? t`Needs attention` : t`Ready`}</p>{row.error && <p role="alert">{row.error}</p>}{row.state !== 'saved' && <label data-confirmation><input type="checkbox" disabled={pending} checked={row.allowDuplicate} onChange={(event) => { const allowDuplicate = event.target.checked; setRows((previous) => previous.map((item) => item.key === row.key ? { ...item, allowDuplicate } : item)); setConfirmed(false); }} />{t`Allow a matching email or social identity for this row`}</label>}{row.id && <LessBusyLink to={`/customers/${row.id}`}>{t`Open customer`}</LessBusyLink>}</li>)}</LessBusyTaskList><label data-confirmation><input type="checkbox" disabled={pending} checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I reviewed these customer details and duplicate choices.`}</label><LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed || rows.every((row) => row.state === 'saved')}>{pending ? t`Importing…` : t`Import pending or failed rows`}</LessBusyRetry>{pending && <LessBusyRetry type="button" onClick={() => { paused.current = true; }}>{t`Pause after current row`}</LessBusyRetry>}</LessBusyActions></>}</LessBusyForm></>;
};
