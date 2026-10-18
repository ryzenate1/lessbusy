import { useEffect, useState, type ReactNode } from 'react';
import { t } from '@lingui/core/macro';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { LessBusyDescription } from '@/lessbusy/components/LessBusyStyles';

type LessBusyDefaultCurrencyProps = { children: (currency: string) => ReactNode };
const LoadDefaultCurrency = ({ children }: LessBusyDefaultCurrencyProps) => {
  const [ready, setReady] = useState(false);
  const { records, loading } = useFindManyRecords<ObjectRecord & { currency: string | null }>({ objectNameSingular: 'lbBusinessProfile', filter: { profileKey: { eq: 'workspace' } }, limit: 1, recordGqlFields: { id: true, currency: true } });
  useEffect(() => { if (!loading) setReady(true); }, [loading]);
  if (!ready) return <LessBusyDescription role="status">{t`Loading business defaults…`}</LessBusyDescription>;
  return <>{children(records[0]?.currency ?? '')}</>;
};

export const LessBusyDefaultCurrency = (props: LessBusyDefaultCurrencyProps) => {
  const { canReadFields } = useLessBusyObjectAccess('lbBusinessProfile');
  return canReadFields('currency', 'profileKey') ? <LoadDefaultCurrency {...props} /> : <>{props.children('')}</>;
};
