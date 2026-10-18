export const getBusinessPageContext = (page: unknown): string => {
  const descriptions: Record<string, string> = {
    deals: 'Deal pipeline: stages come from workspace metadata. The board contains loaded authorized deals; currencies are separate, and stage changes require confirmation.',
    locations: 'Stock locations: create and edit location names, addresses and active state. Inactive locations retain stock history but cannot receive new stock or reservations.',
    'customer-import': 'Customer CSV import: review up to 50 rows, duplicate warnings and per-row results. Uploaded CSV contents are not part of page context.',
    intelligence: 'AI workspace: server-provided model availability and the current applicable native usage allowance. An absent allowance is not proof of unlimited usage. No provider key or model billing balance is exposed.',
    integrations: 'Integration administration: Chatwoot account, allowed inboxes and signed webhooks. Credentials are private; never ask the user to paste secrets into chat.',
    'sales-reports': 'Sales report: finalized invoices within a selected period and their current balances. Totals are partial until all batches load; currencies remain separate.',
    leads: 'Lead workspace: curated hot, follow-up, priority, new, unassigned and converted enquiry views. An explicit conversion creates a separate deal and preserves the lead history.',
    companies: 'Companies: optional B2B organization records, related contacts, deals, notes, tasks and activity. Full native company tools remain available.',
    automations: 'Automation workspace: existing workflows, active/draft status and planning recipes. A suggested routine is not an enabled workflow; review triggers, permissions and actions before activation.',
    overview: 'LessBusy overview: daily attention, tasks and overdue invoices. Summaries must come from authorized tools; do not invent metrics.',
    sales: 'LessBusy sales workspace: quotations, orders and invoices are separate documents. Opportunities are not confirmed orders.',
    customers: 'Customer directory: search, sorting and profiles. Full native record tools retain advanced fields, notes, tasks and history.',
    tasks: 'Task planning: My Tasks, open, today, upcoming, overdue and completed views. Current form values are not included.',
    products: 'Products and services catalogue: sellable options, prices, stock rules and flexible attributes.',
    'product-create': 'Product editor: simple products use one standard option; services do not track physical stock. Form values are private until the user supplies them.',
    messages: 'Messaging workspace: Chatwoot is the message source. No message contents are included. Human handoff does not authorize sending a reply.',
    'lead-create': 'Lead creation: buying readiness, urgency, priority and handling status are independent.',
    'hot-leads': 'Hot leads: records explicitly classified HOT. Do not infer readiness solely from pipeline stage.',
    'low-stock': 'Low-stock review: available units equal on-hand minus reserved. Queries are bounded batches, not complete aggregate reports.',
    'unpaid-invoices': 'Unpaid invoices: finalized/part-paid customer invoices, with an overdue filter. Keep currencies separate.',
    inventory: 'Inventory actions: adjust, reserve, release and commit are confirmed domain operations. Never mutate stock through generic record tools.',
    'business-settings': 'Business identity and module visibility. Hidden modules remain governed by backend permissions.',
    'invoice-create': 'Invoice drafting: prepare an invoice proposal for review; never finalize, charge or send autonomously. Form values are not included.',
    'quotation-create': 'Quotation drafting: prices/taxes are server-calculated and customer acceptance is recorded separately.',
    'order-create': 'Order drafting: confirm separately, reserve stock explicitly, and create a linked invoice draft when appropriate.',
  };
  if (typeof page !== 'string' || !Object.prototype.hasOwnProperty.call(descriptions, page)) return '';
  return `The user is on a registered LessBusy business page. ${descriptions[page]} This is navigation context only; fetch permitted records through authorized tools when the user asks.`;
};
