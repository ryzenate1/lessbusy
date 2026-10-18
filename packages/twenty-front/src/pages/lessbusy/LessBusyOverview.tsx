import { LessBusyTaskReminders } from '@/lessbusy/components/LessBusyTaskReminders';
import { LessBusyAttentionQueues } from '@/lessbusy/components/LessBusyAttentionQueues';
import { LessBusyRecentActivity } from '@/lessbusy/components/LessBusyRecentActivity';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { LessBusyUnpaidInvoices } from '@/lessbusy/components/LessBusyUnpaidInvoices';
import { t } from '@lingui/core/macro';
import { IconArrowUpRight } from 'twenty-ui/icon';

import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useLessBusyLabels } from '@/lessbusy/hooks/useLessBusyLabels';
import { LessBusyDueTasks } from '@/lessbusy/components/LessBusyDueTasks';
import { LessBusyRecordSummary } from '@/lessbusy/components/LessBusyRecordSummary';
import {
  LessBusyActions,
  LessBusyContent,
  LessBusyDescription,
  LessBusyGrid,
  LessBusyLink,
  LessBusySection,
} from '@/lessbusy/components/LessBusyStyles';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';

export const LessBusyOverview = () => {
  const destinations = useLessBusyDestinations();
  const labels = useLessBusyLabels();
  const objects = useAtomStateValue(objectMetadataItemsSelector);
  const taskDestination = destinations.find(
    (destination) => destination.nameSingular === 'task',
  );
  const taskMetadata = objects.find(
    (object) => object.id === taskDestination?.id,
  );
  const canShowDueTasks =
    taskDestination &&
    ['title', 'dueAt', 'status'].every((name) =>
      taskMetadata?.readableFields.some((field) => field.name === name),
    );

  const metrics: Record<string, { label: string; path: string; filter?: RecordGqlOperationFilter }> = { person: { label: t`Customers`, path: '/customers' }, lbLead: { label: t`Hot leads`, path: '/business/hot-leads', filter: { temperature: { eq: 'HOT' } } }, task: { label: t`Open tasks`, path: '/tasks', filter: { status: { in: ['TODO', 'IN_PROGRESS'] } } }, lbInvoice: { label: t`Unpaid invoices`, path: '/business/unpaid-invoices', filter: { status: { in: ['FINALIZED', 'PART_PAID'] } } } };
  const paths: Record<string, string> = { person: '/customers', task: '/tasks', lbProduct: '/products', lbLead: '/business/hot-leads' };

  return (
    <PageCardLayout header={<PageCardHeader title={t`Overview`} />}>
      <PageTitle title={t`Overview`} />
      <LessBusyContent>
        <LessBusySection>
          <h1>{t`A little clarity for your day.`}</h1>
          <LessBusyDescription>{t`Your customers, work and next steps. All in one place.`}</LessBusyDescription>
        </LessBusySection>
        <LessBusySection aria-label={t`Workspace summary`}>
          {destinations.length > 0 ? (
            <LessBusyGrid>
              {destinations
                .filter((destination) => Boolean(metrics[destination.nameSingular]))
                .map((destination) => (
                  <LessBusyRecordSummary
                    key={destination.id}
                    destination={destination}
                    label={metrics[destination.nameSingular].label}
                    filter={metrics[destination.nameSingular].filter}
                    path={metrics[destination.nameSingular].path}
                  />
                ))}
            </LessBusyGrid>
          ) : (
            <LessBusyDescription>{t`Your workspace summary will appear when accessible records are available. If you need access, contact your workspace administrator.`}</LessBusyDescription>
          )}
        </LessBusySection>
        <LessBusySection aria-labelledby="lessbusy-attention-title">
          <h2 id="lessbusy-attention-title">{t`Needs your attention`}</h2>
          <LessBusyDescription>{t`Your earliest overdue tasks, ready for a follow-up.`}</LessBusyDescription>
          {canShowDueTasks ? (
            <LessBusyDueTasks />
          ) : (
            <LessBusyDescription>{t`Due tasks are shown when you have access to task titles, dates and status.`}</LessBusyDescription>
          )}
        </LessBusySection>
        {destinations.some((destination) => destination.nameSingular === 'lbInvoice') && <LessBusySection><h2>{t`Overdue invoices`}</h2><LessBusyUnpaidInvoices compact /></LessBusySection>}
        <LessBusySection><LessBusyTaskReminders /></LessBusySection><LessBusyAttentionQueues />
        <LessBusySection><h2>{t`Recent activity`}</h2><LessBusyRecentActivity /></LessBusySection>
        <LessBusySection aria-labelledby="lessbusy-work-title">
          <h2 id="lessbusy-work-title">{t`Pick up where work happens`}</h2>
          <LessBusyDescription>{t`Open a workspace to add records, follow up with customers or move a deal forward.`}</LessBusyDescription>
          <LessBusyActions>
            {destinations.map((destination) => (
              <LessBusyLink key={destination.id} to={paths[destination.nameSingular] ?? destination.path}>
                {labels[destination.nameSingular]}
                <IconArrowUpRight size={16} aria-hidden="true" />
              </LessBusyLink>
            ))}
          </LessBusyActions>
        </LessBusySection>
      </LessBusyContent>
    </PageCardLayout>
  );
};
