import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { IconHome, IconBriefcase, IconMessage, IconUsers, IconCheckbox, IconBuildingSkyscraper, IconTargetArrow, IconTag, IconBox, IconFileText, IconChartBar, IconSettings, IconSettingsAutomation } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useLessBusyObjectAccess } from '@/lessbusy/hooks/useLessBusyObjectAccess';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { CollapsibleNavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/CollapsibleNavigationDrawerSection';

const StyledNavigation = styled.nav`
  padding: ${themeCssVariables.spacing[2]};
  .navigation-drawer-item { min-height: 44px; }
`;

export const LessBusyWorkflowNavigation = () => {
  const { pathname } = useLocation();
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);
  const destinations = useLessBusyDestinations();
  const workflow = useLessBusyObjectAccess('workflow');
  const dashboard = useLessBusyObjectAccess('dashboard');
  const find = (name: string) => destinations.find((destination) => destination.nameSingular === name);
  const deals = find('opportunity');
  const leads = find('lbLead');
  const companies = find('company');
  const products = find('lbProduct');
  const inventory = find('lbStockBalance');
  const invoices = find('lbInvoice');
  const active = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const dealsPath = leads ? '/leads' : deals ? '/deals' : undefined;
  return <StyledNavigation aria-label={t`Business workspace`}>
    <CollapsibleNavigationDrawerSection sectionId="lessbusy/workspace" label={t`Workspace`}>
      <NavigationDrawerItem label={t`Overview`} Icon={IconHome} to="/overview" active={pathname === '/overview'} />
      <NavigationDrawerItem label={t`Messages`} Icon={IconMessage} to="/messages" active={active('/messages')} />
      {find('person') && <NavigationDrawerItem label={t`Customers`} Icon={IconUsers} to="/customers" active={active('/customers')} />}
      {dealsPath && <NavigationDrawerItem label={t`Leads & Deals`} Icon={IconTargetArrow} to={dealsPath} active={active(dealsPath) || active('/deals') || active('/business/leads')} />}
      {find('task') && <NavigationDrawerItem label={t`Tasks`} Icon={IconCheckbox} to="/tasks" active={active('/tasks')} />}
      {companies && <NavigationDrawerItem label={t`Companies`} Icon={IconBuildingSkyscraper} to="/companies" active={active('/companies')} />}
    </CollapsibleNavigationDrawerSection>
    <CollapsibleNavigationDrawerSection sectionId="lessbusy/business" label={t`Business`}>
      {products && <NavigationDrawerItem label={t`Products`} Icon={IconTag} to="/products" active={active('/products')} />}
      {inventory && <NavigationDrawerItem label={t`Inventory`} Icon={IconBox} to="/inventory" active={active('/inventory') || active('/business/inventory') || active('/business/low-stock')} />}
      <NavigationDrawerItem label={t`Sales`} Icon={IconBriefcase} to="/sales" active={pathname === '/sales' || active('/sales/orders') || active('/sales/quotations') || active('/business/orders') || active('/business/quotations')} />
      {invoices && <NavigationDrawerItem label={t`Invoices`} Icon={IconFileText} to="/sales/invoices" active={active('/sales/invoices') || active('/business/invoices') || active('/business/unpaid-invoices')} />}
    </CollapsibleNavigationDrawerSection>
    {(workflow.canRead || dashboard.canRead || invoices) && <CollapsibleNavigationDrawerSection sectionId="lessbusy/intelligence" label={t`Intelligence`}>
      {workflow.canRead && workflow.object && <NavigationDrawerItem label={t`Automations`} Icon={IconSettingsAutomation} to="/automations" active={active('/automations')} />}
      {invoices && <NavigationDrawerItem label={t`Sales reports`} Icon={IconChartBar} to="/business/reports" active={active('/business/reports')} />}
      {dashboard.canRead && dashboard.object && <NavigationDrawerItem label={t`Custom dashboards`} Icon={IconChartBar} to={getAppPath(AppPath.RecordIndexPage, { objectNamePlural: dashboard.object.namePlural })} />}
    </CollapsibleNavigationDrawerSection>}
    <CollapsibleNavigationDrawerSection sectionId="lessbusy/platform" label={t`Platform`}>{hasAiPermission && <NavigationDrawerItem label={t`AI settings & allowance`} Icon={IconSettings} to="/intelligence" active={active('/intelligence')} />}<NavigationDrawerItem label={t`Integrations`} Icon={IconSettingsAutomation} to="/integrations" active={active('/integrations')} />{find('lbBusinessProfile') && <NavigationDrawerItem label={t`Business settings`} Icon={IconSettings} to="/business/settings" active={active('/business/settings')} />}<NavigationDrawerItem label={t`Settings`} Icon={IconSettings} to="/settings" active={active('/settings')} /></CollapsibleNavigationDrawerSection>
  </StyledNavigation>;
};
