import { t } from '@lingui/core/macro';
import { useLessBusyDestinations } from '@/lessbusy/hooks/useLessBusyDestinations';
import { useLessBusyLabels } from '@/lessbusy/hooks/useLessBusyLabels';
import { LessBusyActions, LessBusyContent, LessBusyDescription, LessBusyLink, LessBusySection } from '@/lessbusy/components/LessBusyStyles';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

export const LessBusyBusiness = () => {
  const destinations = useLessBusyDestinations();
  const labels = useLessBusyLabels();
  const has = (name: string) => destinations.some((destination) => destination.nameSingular === name);
  const workflows: Record<string, string> = { lbProduct: '/products', lbStockBalance: '/inventory', lbLead: '/leads', lbSalesOrder: '/sales/orders', lbQuotation: '/sales/quotations', lbInvoice: '/sales/invoices', lbBusinessProfile: '/business/settings' };
  const businessDestinations = destinations.filter((destination) => destination.nameSingular.startsWith('lb'));
  return <PageCardLayout header={<PageCardHeader title={t`Business`} />}><LessBusyContent>
    <LessBusySection><h1>{t`The practical side of your business.`}</h1><LessBusyDescription>{t`Manage products, keep stock accurate and turn customer interest into clear sales documents.`}</LessBusyDescription></LessBusySection>
    <LessBusySection><h2>{t`Start something`}</h2><LessBusyActions>
      {has('lbInvoice') && <LessBusyLink to="/business/reports">{t`View sales report`}</LessBusyLink>}
      {has('lbInvoice') && <LessBusyLink to="/business/unpaid-invoices">{t`Review unpaid invoices`}</LessBusyLink>}
      {has('lbInvoice') && <LessBusyLink to="/business/new/invoice">{t`Create invoice`}</LessBusyLink>}
      {has('lbQuotation') && <LessBusyLink to="/business/new/quotation">{t`Create quotation`}</LessBusyLink>}
      {has('lbSalesOrder') && <LessBusyLink to="/business/new/order">{t`Create order`}</LessBusyLink>}
      {has('lbStockBalance') && <LessBusyLink to="/business/low-stock">{t`Check low stock`}</LessBusyLink>}
      {has('lbStockBalance') && <LessBusyLink to="/business/inventory">{t`Record a stock change`}</LessBusyLink>}
      {has('lbLead') && <LessBusyLink to="/business/leads/new">{t`Add a lead`}</LessBusyLink>}
      {has('lbLead') && <LessBusyLink to="/business/hot-leads">{t`Follow up with hot leads`}</LessBusyLink>}
    </LessBusyActions>{businessDestinations.length === 0 && <LessBusyDescription>{t`Business modules have not been enabled for your workspace access. Your administrator can install LessBusy Business and assign the modules your team needs.`}</LessBusyDescription>}</LessBusySection>
    {has('lbBusinessProfile') && <LessBusySection><LessBusyLink to="/business/settings">{t`Business settings and modules`}</LessBusyLink></LessBusySection>}
    <LessBusySection><h2>{t`Your business records`}</h2><LessBusyActions>{businessDestinations.map((destination) => <LessBusyLink key={destination.id} to={workflows[destination.nameSingular] ?? destination.path}>{labels[destination.nameSingular]}</LessBusyLink>)}</LessBusyActions></LessBusySection>
  </LessBusyContent></PageCardLayout>;
};
