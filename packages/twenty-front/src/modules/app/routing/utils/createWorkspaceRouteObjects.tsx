import { lazy } from 'react';
import { LESSBUSY_OVERVIEW_PATH } from '@/lessbusy/utils/getLessBusyDestinations';
import { AppPath } from 'twenty-shared/types';

import { LazyRoute } from '@/app/components/LazyRoute';
import {
  createSettingsRouteObjects,
  SettingsRouteOutlet,
} from '@/app/components/SettingsRoutes';
import { type WorkspaceRouteObject } from '@/app/routing/types/WorkspaceRouteObject';
import { RecordIndexSkeletonLoader } from '@/object-record/record-index/components/RecordIndexSkeletonLoader';

const AgentCoreIndexPage = lazy(() =>
  import('~/pages/object-core/AgentCoreIndexPage').then((module) => ({
    default: module.AgentCoreIndexPage,
  })),
);

const AgentCoreShowPage = lazy(() =>
  import('~/pages/object-core/AgentCoreShowPage').then((module) => ({
    default: module.AgentCoreShowPage,
  })),
);

const WorkflowCoreShowPage = lazy(() =>
  import('~/pages/object-core/WorkflowCoreShowPage').then((module) => ({
    default: module.WorkflowCoreShowPage,
  })),
);

const RecordIndexPage = lazy(() =>
  import('~/pages/object-record/RecordIndexPage').then((module) => ({
    default: module.RecordIndexPage,
  })),
);

const RecordShowPage = lazy(() =>
  import('~/pages/object-record/RecordShowPage').then((module) => ({
    default: module.RecordShowPage,
  })),
);

const StandalonePageLayoutPage = lazy(() =>
  import('~/pages/page-layout/StandalonePageLayoutPage').then((module) => ({
    default: module.StandalonePageLayoutPage,
  })),
);

const AiChatPage = lazy(() =>
  import('~/pages/ai-chat/AiChatPage').then((module) => ({
    default: module.AiChatPage,
  })),
);

const AiChatInboxPage = lazy(() =>
  import('~/pages/ai-chat/AiChatInboxPage').then((module) => ({
    default: module.AiChatInboxPage,
  })),
);

const MobileHomePage = lazy(() =>
  import('~/pages/mobile-home/MobileHomePage').then((module) => ({
    default: module.MobileHomePage,
  })),
);

const NotFound = lazy(() =>
  import('~/pages/not-found/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

type CreateWorkspaceRouteObjectsArgs = {
  isAdminPageEnabled?: boolean;
};

const LessBusyOverview = lazy(() =>
  import('~/pages/lessbusy/LessBusyOverview').then((module) => ({
    default: module.LessBusyOverview,
  })),
);

const LessBusySales = lazy(() => import('~/pages/lessbusy/LessBusySales').then((module) => ({ default: module.LessBusySales })));
const LessBusyAutomations = lazy(() => import('~/pages/lessbusy/LessBusyAutomations').then((module) => ({ default: module.LessBusyAutomations })));
const LessBusyCompanies = lazy(() => import('~/pages/lessbusy/LessBusyCompanies').then((module) => ({ default: module.LessBusyCompanies })));
const LessBusyLeads = lazy(() => import('~/pages/lessbusy/LessBusyLeads').then((module) => ({ default: module.LessBusyLeads })));
const LessBusyCreateTask = lazy(() => import('~/pages/lessbusy/LessBusyCreateTask').then((module) => ({ default: module.LessBusyCreateTask })));
const LessBusyInventory = lazy(() => import('~/pages/lessbusy/LessBusyInventory').then((module) => ({ default: module.LessBusyInventory })));
const LessBusyIntegrations = lazy(() => import('~/pages/lessbusy/LessBusyIntegrations').then((module) => ({ default: module.LessBusyIntegrations })));
const LessBusyReports = lazy(() => import('~/pages/lessbusy/LessBusyReports').then((module) => ({ default: module.LessBusyReports })));
const LessBusyProducts = lazy(() => import('~/pages/lessbusy/LessBusyProducts').then((module) => ({ default: module.LessBusyProducts })));
const LessBusyTasks = lazy(() => import('~/pages/lessbusy/LessBusyTasks').then((module) => ({ default: module.LessBusyTasks })));
const LessBusyCustomers = lazy(() => import('~/pages/lessbusy/LessBusyCustomers').then((module) => ({ default: module.LessBusyCustomers })));
const LessBusyLead = lazy(() => import('~/pages/lessbusy/LessBusyLead').then((module) => ({ default: module.LessBusyLead })));
const LessBusyBusiness = lazy(() => import('~/pages/lessbusy/LessBusyBusiness').then((module) => ({ default: module.LessBusyBusiness })));
const LessBusyCreateSalesDocument = lazy(() => import('~/pages/lessbusy/LessBusyCreateSalesDocument').then((module) => ({ default: module.LessBusyCreateSalesDocument })));
const LessBusyEditInvoice = lazy(() => import('~/pages/lessbusy/LessBusyEditInvoice').then((module) => ({ default: module.LessBusyEditInvoice })));
const LessBusySalesDocument = lazy(() => import('~/pages/lessbusy/LessBusySalesDocument').then((module) => ({ default: module.LessBusySalesDocument })));
const LessBusyInvoice = lazy(() => import('~/pages/lessbusy/LessBusyInvoice').then((module) => ({ default: module.LessBusyInvoice })));
const LessBusyInventoryActions = lazy(() => import('~/pages/lessbusy/LessBusyInventoryActions').then((module) => ({ default: module.LessBusyInventoryActions })));
const LessBusyDeals = lazy(() => import('~/pages/lessbusy/LessBusyDeals').then((module) => ({ default: module.LessBusyDeals })));
const LessBusyIntelligence = lazy(() => import('~/pages/lessbusy/LessBusyIntelligence').then((module) => ({ default: module.LessBusyIntelligence })));
const LessBusyHotLeads = lazy(() => import('~/pages/lessbusy/LessBusyHotLeads').then((module) => ({ default: module.LessBusyHotLeads })));
const LessBusyMessages = lazy(() => import('~/pages/lessbusy/LessBusyMessages').then((module) => ({ default: module.LessBusyMessages })));

const LessBusyBusinessSettings = lazy(() => import('~/pages/lessbusy/LessBusyBusinessSettings').then((module) => ({ default: module.LessBusyBusinessSettings })));

const LessBusyUnpaidInvoices = lazy(() => import('~/pages/lessbusy/LessBusyUnpaidInvoices').then((module) => ({ default: module.LessBusyUnpaidInvoices })));
const LessBusyLowStock = lazy(() => import('~/pages/lessbusy/LessBusyLowStock').then((module) => ({ default: module.LessBusyLowStock })));

const MAIN_AND_SIDE_PANEL = ['main', 'side-panel'] as const;
const SETTINGS_ROOT_PATH = AppPath.SettingsCatchAll.replace('/*', '');

export const createWorkspaceRouteObjects = ({
  isAdminPageEnabled,
}: CreateWorkspaceRouteObjectsArgs): WorkspaceRouteObject[] => {
  const settingsRouteObjects = createSettingsRouteObjects({
    isAdminPageEnabled,
  });

  return [
    { path: '/business/unpaid-invoices', element: <LazyRoute><LessBusyUnpaidInvoices /></LazyRoute> },
    { path: '/business/low-stock', element: <LazyRoute><LessBusyLowStock /></LazyRoute> },
    { path: '/business/settings', element: <LazyRoute><LessBusyBusinessSettings /></LazyRoute> },
    { path: '/inventory', element: <LazyRoute><LessBusyInventory /></LazyRoute> },
    { path: '/inventory/:balanceId', element: <LazyRoute><LessBusyInventory /></LazyRoute> },
    { path: '/intelligence', element: <LazyRoute><LessBusyIntelligence /></LazyRoute> },
    { path: '/integrations', element: <LazyRoute><LessBusyIntegrations /></LazyRoute> },
    { path: '/business/reports', element: <LazyRoute><LessBusyReports /></LazyRoute> },
    { path: '/products', element: <LazyRoute><LessBusyProducts /></LazyRoute> },
    { path: '/products/:productId', element: <LazyRoute><LessBusyProducts /></LazyRoute> },
    { path: '/sales/:salesKind?', element: <LazyRoute><LessBusySales /></LazyRoute> },
    { path: '/automations', element: <LazyRoute><LessBusyAutomations /></LazyRoute> },
    { path: '/companies', element: <LazyRoute><LessBusyCompanies /></LazyRoute> },
    { path: '/companies/:companyId', element: <LazyRoute><LessBusyCompanies /></LazyRoute> },
    { path: '/deals', element: <LazyRoute><LessBusyDeals /></LazyRoute> },
    { path: '/leads', element: <LazyRoute><LessBusyLeads /></LazyRoute> },
    { path: '/tasks/new', element: <LazyRoute><LessBusyCreateTask /></LazyRoute> },
    { path: '/tasks', element: <LazyRoute><LessBusyTasks /></LazyRoute> },
    { path: '/customers', element: <LazyRoute><LessBusyCustomers /></LazyRoute> },
    { path: '/customers/:customerId', element: <LazyRoute><LessBusyCustomers /></LazyRoute> },
    { path: '/business/leads/new', element: <LazyRoute><LessBusyLead /></LazyRoute> },
    { path: '/business/leads/:leadId', element: <LazyRoute><LessBusyLead /></LazyRoute> },
    { path: '/business', element: <LazyRoute><LessBusyBusiness /></LazyRoute> },
    { path: '/business/new/:documentKind', element: <LazyRoute><LessBusyCreateSalesDocument /></LazyRoute> },
    { path: '/business/:salesKind/:documentId', element: <LazyRoute><LessBusySalesDocument /></LazyRoute> },
    { path: '/business/invoices/:invoiceId/edit', element: <LazyRoute><LessBusyEditInvoice /></LazyRoute> },
    { path: '/business/invoices/:invoiceId', element: <LazyRoute><LessBusyInvoice /></LazyRoute> },
    { path: '/business/inventory', element: <LazyRoute><LessBusyInventoryActions /></LazyRoute> },
    { path: '/business/hot-leads', element: <LazyRoute><LessBusyHotLeads /></LazyRoute> },
    { path: '/messages', element: <LazyRoute><LessBusyMessages /></LazyRoute> },

    {
      path: LESSBUSY_OVERVIEW_PATH,
      element: (
        <LazyRoute>
          <LessBusyOverview />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.WorkflowCoreShowPage,
      element: (
        <LazyRoute>
          <WorkflowCoreShowPage />
        </LazyRoute>
      ),
      handle: {
        workspaceSurfaces: MAIN_AND_SIDE_PANEL,
        isLocationExpandableFromSidePanel: true,
      },
    },
    {
      path: AppPath.AgentIndexPage,
      element: (
        <LazyRoute fallback={<RecordIndexSkeletonLoader />}>
          <AgentCoreIndexPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.AgentShowPage,
      element: (
        <LazyRoute>
          <AgentCoreShowPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.Index,
      element: <RecordIndexSkeletonLoader />,
    },
    {
      path: AppPath.RecordIndexPage,
      element: (
        <LazyRoute fallback={<RecordIndexSkeletonLoader />}>
          <RecordIndexPage />
        </LazyRoute>
      ),
      handle: {
        workspaceSurfaces: MAIN_AND_SIDE_PANEL,
        isLocationExpandableFromSidePanel: true,
      },
    },
    {
      path: AppPath.RecordShowPage,
      element: (
        <LazyRoute>
          <RecordShowPage />
        </LazyRoute>
      ),
      handle: { workspaceSurfaces: MAIN_AND_SIDE_PANEL },
    },
    {
      path: AppPath.PageLayoutPage,
      element: (
        <LazyRoute>
          <StandalonePageLayoutPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.AiChat,
      element: (
        <LazyRoute>
          <AiChatPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.AiChatInbox,
      element: (
        <LazyRoute>
          <AiChatInboxPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.Home,
      element: (
        <LazyRoute>
          <MobileHomePage />
        </LazyRoute>
      ),
    },
    {
      path: SETTINGS_ROOT_PATH,
      element: <SettingsRouteOutlet />,
      children: settingsRouteObjects,
    },
    {
      path: AppPath.Dpa,
      element: null,
    },
    {
      path: AppPath.NotFoundWildcard,
      element: (
        <LazyRoute>
          <NotFound />
        </LazyRoute>
      ),
    },
  ];
};
