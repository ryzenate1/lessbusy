import { isValidUuid } from 'twenty-shared/utils';
import { type BrowsingContext } from '@/ai/types/BrowsingContext';

type ContextObject = { id: string; nameSingular: string; isActive: boolean };
type ContextPermissions = Record<string, { canReadObjectRecords: boolean } | undefined>;

export const getLessBusyBrowsingContext = ({ pathname, objects, permissions }: { pathname: string; objects: ContextObject[]; permissions: ContextPermissions }): BrowsingContext | null | undefined => {
  const canRead = (name: string) => objects.some((object) => object.nameSingular === name && object.isActive && permissions[object.id]?.canReadObjectRecords);
  const recordRoutes: Array<{ pattern: RegExp; object: string }> = [
    { pattern: /^\/companies\/([^/]+)$/, object: 'company' },
    { pattern: /^\/inventory\/([^/]+)$/, object: 'lbStockBalance' },
    { pattern: /^\/customers\/([^/]+)$/, object: 'person' }, { pattern: /^\/products\/([^/]+)$/, object: 'lbProduct' },
    { pattern: /^\/business\/leads\/([^/]+)$/, object: 'lbLead' }, { pattern: /^\/business\/invoices\/([^/]+)(?:\/edit)?$/, object: 'lbInvoice' },
    { pattern: /^\/business\/orders\/([^/]+)$/, object: 'lbSalesOrder' }, { pattern: /^\/business\/quotations\/([^/]+)$/, object: 'lbQuotation' },
  ];
  for (const route of recordRoutes) {
    const match = pathname.match(route.pattern);
    if (match && isValidUuid(match[1])) return canRead(route.object) ? { type: 'recordPage', objectNameSingular: route.object, recordId: match[1] } : null;
  }
  const pages: Record<string, { page: string; object?: string }> = {
    '/overview': { page: 'overview' }, '/intelligence': { page: 'intelligence' }, '/deals': { page: 'deals', object: 'opportunity' }, '/inventory/locations': { page: 'locations', object: 'lbWarehouse' }, '/customers/import': { page: 'customer-import', object: 'person' }, '/sales': { page: 'sales' }, '/sales/orders': { page: 'sales', object: 'lbSalesOrder' }, '/sales/quotations': { page: 'sales', object: 'lbQuotation' }, '/sales/invoices': { page: 'unpaid-invoices', object: 'lbInvoice' }, '/automations': { page: 'automations', object: 'workflow' }, '/companies': { page: 'companies', object: 'company' }, '/leads': { page: 'leads', object: 'lbLead' }, '/business': { page: 'sales' }, '/customers': { page: 'customers', object: 'person' },
    '/tasks': { page: 'tasks', object: 'task' }, '/tasks/new': { page: 'tasks', object: 'task' }, '/products': { page: 'products', object: 'lbProduct' }, '/products/new': { page: 'product-create', object: 'lbProduct' }, '/products/import': { page: 'product-create', object: 'lbProduct' }, '/products/export': { page: 'products', object: 'lbProduct' }, '/business/reports': { page: 'sales-reports', object: 'lbInvoice' },
    '/messages': { page: 'messages' }, '/integrations': { page: 'integrations' }, '/inventory': { page: 'inventory', object: 'lbStockBalance' }, '/business/leads/new': { page: 'lead-create', object: 'lbLead' },
    '/business/hot-leads': { page: 'hot-leads', object: 'lbLead' }, '/business/low-stock': { page: 'low-stock', object: 'lbStockBalance' },
    '/business/unpaid-invoices': { page: 'unpaid-invoices', object: 'lbInvoice' }, '/business/inventory': { page: 'inventory', object: 'lbStockBalance' },
    '/business/settings': { page: 'business-settings', object: 'lbBusinessProfile' },
    '/business/new/invoice': { page: 'invoice-create', object: 'lbInvoice' }, '/business/new/quotation': { page: 'quotation-create', object: 'lbQuotation' }, '/business/new/order': { page: 'order-create', object: 'lbSalesOrder' },
  };
  const selected = pages[pathname];
  if (selected) return selected.object && !canRead(selected.object) ? null : { type: 'businessPage', page: selected.page, objectNameSingular: selected.object };
  return /^\/(customers|products|tasks|business|inventory|integrations|leads|companies|automations|sales|deals|intelligence)(\/|$)/.test(pathname) ? null : undefined;
};
