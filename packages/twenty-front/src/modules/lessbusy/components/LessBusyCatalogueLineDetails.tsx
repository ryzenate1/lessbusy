import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { formatLessBusyMoney } from '@/lessbusy/utils/formatLessBusyMoney';
import { LessBusyDescription, LessBusyRetry } from '@/lessbusy/components/LessBusyStyles';

type LessBusyCatalogueLineDetailsProps = { variantId: string; currency: string; onApply: (details: { description: string; price: string; tax: string }) => void };
const optionSchema = z.object({ name: z.string(), currency: z.string(), unitAmountMinor: z.string().regex(/^\d+$/), taxBasisPoints: z.number().nullable(), status: z.string().nullable() });

const CatalogueLineDetails = ({ variantId, currency, onApply }: LessBusyCatalogueLineDetailsProps) => {
  const { record, loading, error } = useFindOneRecord({ objectNameSingular: 'lbProductVariant', objectRecordId: variantId, recordGqlFields: { id: true, name: true, currency: true, unitAmountMinor: true, taxBasisPoints: true, status: true } });
  if (loading) return <LessBusyDescription>{t`Loading catalogue price…`}</LessBusyDescription>;
  const parsed = optionSchema.safeParse(record);
  if (error || !parsed.success) return <LessBusyDescription>{t`Catalogue details are unavailable. Review the description, price and tax manually.`}</LessBusyDescription>;
  const option = parsed.data;
  if (option.status !== 'ACTIVE') return <LessBusyDescription>{t`This option is not active. Choose an active product option before creating the document.`}</LessBusyDescription>;
  if (option.currency !== currency) return <LessBusyDescription>{t`Catalogue currency is ${option.currency}. Match the document currency before applying the price.`}</LessBusyDescription>;
  return <LessBusyRetry type="button" onClick={() => onApply({ description: option.name, price: formatLessBusyMoney(option.unitAmountMinor, currency).slice(currency.length + 1), tax: String((option.taxBasisPoints ?? 0) / 100) })}>{t`Use catalogue description, price and tax`}</LessBusyRetry>;
};

export const LessBusyCatalogueLineDetails = (props: LessBusyCatalogueLineDetailsProps) => {
  const { canReadFields } = useLessBusyObjectAccess('lbProductVariant');
  return canReadFields('name', 'currency', 'unitAmountMinor', 'taxBasisPoints', 'status') ? <CatalogueLineDetails {...props} /> : null;
};
