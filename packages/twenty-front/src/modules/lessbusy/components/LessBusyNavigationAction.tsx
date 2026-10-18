import { t } from '@lingui/core/macro';
import { z } from 'zod';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { LessBusyLink } from '@/lessbusy/components/LessBusyStyles';

const OBJECTS = { reports: 'lbInvoice', 'create-invoice': 'lbInvoice', 'create-quotation': 'lbQuotation', 'create-order': 'lbSalesOrder', 'create-product': 'lbProduct', 'create-task': 'task', 'stock-locations': 'lbWarehouse', customers: 'person', companies: 'company', deals: 'opportunity', tasks: 'task', notes: 'note', leads: 'lbLead', products: 'lbProduct', variants: 'lbProductVariant', inventory: 'lbStockBalance', 'low-stock': 'lbStockBalance', invoices: 'lbInvoice', orders: 'lbSalesOrder', quotations: 'lbQuotation', 'business-settings': 'lbBusinessProfile', 'hot-leads': 'lbLead' } as const;
const PATHS: Record<string, string> = { 'stock-locations': '/inventory/locations', deals: '/deals', reports: '/business/reports', 'create-invoice': '/business/new/invoice', 'create-quotation': '/business/new/quotation', 'create-order': '/business/new/order', 'create-product': '/products/new', 'create-task': '/tasks/new', customers: '/customers', companies: '/companies', tasks: '/tasks', leads: '/leads', products: '/products', inventory: '/inventory', invoices: '/sales/invoices', orders: '/sales/orders', quotations: '/sales/quotations', 'hot-leads': '/business/hot-leads', 'low-stock': '/business/low-stock', 'business-settings': '/business/settings', 'unpaid-invoices': '/business/unpaid-invoices' };
const outputSchema = z.object({ success: z.literal(true), result: z.object({ lessbusyNavigation: z.object({ destination: z.string(), workspaceId: z.string().uuid() }).strict() }) });

export const LessBusyNavigationAction = ({ output }: { output: unknown }) => {
  const workspace = useAtomStateValue(currentWorkspaceState); const destinations = useLessBusyDestinations(); const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const parsed = outputSchema.safeParse(output);
  if (!parsed.success || parsed.data.result.lessbusyNavigation.workspaceId !== workspace?.id) return null;
  const capability = parsed.data.result.lessbusyNavigation.destination;
  if (capability === 'overview') return <LessBusyLink to="/overview">{t`Open Overview`}</LessBusyLink>;
  if (capability === 'integrations') return <LessBusyLink to="/integrations">{t`Open integrations`}</LessBusyLink>;
  const objectName = capability === 'unpaid-invoices' ? 'lbInvoice' : Object.hasOwn(OBJECTS, capability) ? OBJECTS[capability as keyof typeof OBJECTS] : null;
  if (!objectName) return null;
  const destination = destinations.find((item) => item.nameSingular === objectName);
  if (!destination || (capability.startsWith('create-') && !objectPermissionsByObjectMetadataId[destination.id]?.canUpdateObjectRecords)) return null;
  return <LessBusyLink to={PATHS[capability] ?? destination.path}>{t`Open page`}</LessBusyLink>;
};
