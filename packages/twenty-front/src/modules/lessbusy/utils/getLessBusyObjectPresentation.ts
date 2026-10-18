import { t } from '@lingui/core/macro';

type PresentationObject = {
  nameSingular: string;
  labelSingular: string;
  labelPlural: string;
  isCustom?: boolean;
};

export const getLessBusyObjectPresentation = (object: PresentationObject) => {
  const descriptions: Record<string, string> = {
    person: t`Keep customer details, conversations and follow-ups together.`,
    company: t`Build a clear picture of the businesses you work with.`,
    opportunity: t`Track interested buyers and move each deal towards a sale.`,
    task: t`Know what to do next, who owns it and when it is due.`,
    note: t`Keep useful context close to the people and work it belongs to.`,
    lbProduct: t`Your products and services, with flexible attributes for your business.`,
    lbProductVariant: t`Manage each sellable option with its own SKU and price.`,
    lbStockBalance: t`See what is on hand, reserved and available at each location.`,
    lbInvoice: t`Prepare customer invoices and keep track of what is still owed.`,
    lbSalesOrder: t`Follow each order from confirmation to fulfilment.`,
    lbQuotation: t`Prepare clear proposals for your customers.`,
    lbLead: t`Prioritise enquiries using buying readiness and the next follow-up.`,
  };
  const isDefaultPeople = !object.isCustom && object.nameSingular === 'person' && object.labelPlural === 'People';
  const isDefaultDeals = !object.isCustom && object.nameSingular === 'opportunity' && object.labelPlural === 'Opportunities';

  return {
    singular: isDefaultPeople ? t`Customer` : isDefaultDeals ? t`Deal` : object.labelSingular,
    plural: isDefaultPeople ? t`Customers` : isDefaultDeals ? t`Leads & Deals` : object.labelPlural,
    description: descriptions[object.nameSingular],
  };
};
