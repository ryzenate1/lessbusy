import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { t } from '@lingui/core/macro';
import { IconArrowUpRight } from 'twenty-ui/icon';
import { AggregateOperations } from '~/generated-metadata/graphql';

import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type LessBusyDestination } from '@/lessbusy/utils/getLessBusyDestinations';
import {
  LessBusyDescription,
  LessBusyLink,
  LessBusyRetry,
  LessBusySummary,
} from '@/lessbusy/components/LessBusyStyles';

const COUNT_FIELDS = { id: [AggregateOperations.COUNT] };

export const LessBusyRecordSummary = ({
  destination,
  label, filter, path,
}: {
  destination: LessBusyDestination;
  label: string;
  filter?: RecordGqlOperationFilter;
  path?: string;
}) => {
  const { formatNumber } = useNumberFormat();
  const { data, loading, error, refetch } = useAggregateRecords<{
    id: { COUNT: number };
  }>({
    objectNameSingular: destination.nameSingular,
    recordGqlFieldsAggregate: COUNT_FIELDS,
    filter,
  });
  const count = data.id?.COUNT;

  return (
    <LessBusySummary aria-label={label} aria-busy={loading}>
      <LessBusyDescription>{label}</LessBusyDescription>
      {error ? (
        <>
          <p role="alert">{t`Could not load this summary.`}</p>
          <LessBusyRetry
            onClick={() => void refetch()}
          >{t`Retry`}</LessBusyRetry>
        </>
      ) : (
        <strong aria-live="polite">
          {loading
            ? t`Loading…`
            : count === undefined
              ? t`Unavailable`
              : formatNumber(count)}
        </strong>
      )}
      <LessBusyLink to={path ?? destination.path}>
        {t`View records`}
        <IconArrowUpRight size={16} aria-hidden="true" />
      </LessBusyLink>
    </LessBusySummary>
  );
};
