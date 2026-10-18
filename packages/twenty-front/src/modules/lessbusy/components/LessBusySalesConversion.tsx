import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useLessBusyApi } from '@/lessbusy/hooks/useLessBusyApi';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyForm } from '@/lessbusy/components/LessBusyForm';
import { LessBusyActions, LessBusyDescription, LessBusyLink, LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

type LessBusySalesConversionProps = { id: string; kind: 'quotation' | 'order'; version: number; convertedId?: string | null };

export const LessBusySalesConversion = ({ id, kind, version, convertedId }: LessBusySalesConversionProps) => {
  const { request, pending, error } = useLessBusyApi();
  const navigate = useNavigate();
  const target = useLessBusyObjectAccess(kind === 'quotation' ? 'lbSalesOrder' : 'lbInvoice');
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const operationKey = useRef(crypto.randomUUID());
  const targetPath = kind === 'quotation' ? 'orders' : 'invoices';
  if (convertedId) return target.canRead ? <LessBusyLink to={`/business/${targetPath}/${convertedId}`}>{kind === 'quotation' ? t`Open linked order` : t`Open linked invoice`}</LessBusyLink> : null;
  if (!target.canWrite) return null;
  if (!reviewing) return <LessBusyRetry onClick={() => setReviewing(true)}>{kind === 'quotation' ? t`Convert to order` : t`Create linked invoice`}</LessBusyRetry>;
  return <LessBusyForm onSubmit={async (event) => {
    event.preventDefault(); if (!confirmed || pending) return;
    setValidation(null);
    try {
      const result = z.object({ id: z.string().uuid(), kind: z.enum(['order', 'invoice']) }).parse(await request(`${kind === 'quotation' ? 'quotations' : 'orders'}/${id}/convert`, 'POST', { expectedVersion: version, confirmed: true, operationKey: operationKey.current }));
      navigate(`/business/${result.kind === 'order' ? 'orders' : 'invoices'}/${result.id}`);
    } catch (failure) { setValidation(failure instanceof Error ? failure.message : t`Could not convert this document.`); }
  }}><h2>{kind === 'quotation' ? t`Review quotation conversion` : t`Review invoice creation`}</h2><LessBusyDescription>{kind === 'quotation' ? t`Create one linked order draft using the accepted customer, items, prices, discounts and taxes. Review and confirm that order separately before reserving stock.` : t`Create one linked invoice draft using this order's customer, items, prices, discounts and taxes. Finalize the invoice separately after checking its billing details.`}</LessBusyDescription><label data-confirmation><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />{t`I have reviewed and confirm this conversion.`}</label>{(error || validation) && <p role="alert">{error || validation}</p>}<LessBusyActions><LessBusyRetry type="submit" disabled={pending || !confirmed}>{pending ? t`Creating…` : t`Create linked draft`}</LessBusyRetry><LessBusyRetry type="button" onClick={() => { setReviewing(false); setConfirmed(false); }}>{t`Back`}</LessBusyRetry></LessBusyActions></LessBusyForm>;
};
