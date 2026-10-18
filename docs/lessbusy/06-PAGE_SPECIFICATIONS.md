# LessBusy page specifications and current source coverage

Updated 18 October 2026. All new pages below are source implementations awaiting deferred validation and workspace-app installation where applicable.

| Page | Current interaction | Next work |
|---|---|---|
| Overview `/overview` | Permission-aware record counts, overdue tasks/invoices, workflow links | Priority attention feed, messaging/stock previews, activity, sales periods |
| Customers `/customers` | Name/email search, sorting, basic create/edit; advanced native list tools retained | Curated filters/tags/source/assignment and richer profile sections |
| Customer `/customers/:customerId` | Contact summary and related leads/deals/quotes/orders/invoices/conversations; full native notes/tasks/activity link | Embed notes/tasks/timeline and identity/sales summaries |
| Leads `/business/leads/:leadId` | Manual qualification, next action, protected overrides, follow-up task creation/history | Lead views, source/assignment, conversion into deal |
| Deals / Companies | Native lists/details/kanban and relationships retained | Distilled shells and business-related sections |
| Tasks `/tasks` | My/open/today/upcoming/overdue/completed views, create, complete/reopen; native rich editor | Reminders/priority where required and relationship-oriented creation |
| Products / Variants | Native metadata record tools and flexible attributes | Guided editor, cost/tax/images/status and variant management |
| Inventory `/business/inventory` | Balance initialization and confirmed adjust/reserve/release/commit | Receiving, order fulfillment, expiry and history |
| Low stock `/business/low-stock` | Truthful bounded scan, threshold comparison, cursor continuation | Replenishment workflow and location policy |
| Business `/business` | Module links and creation actions | Clearer Sales workspace and linked conversion flow |
| Quotations / Orders `/business/:salesKind/:documentId` | Draft edit, versioned status changes, totals/history, reuse items in new draft | Persistent conversion provenance, stock/deal integration |
| Invoices `/business/invoices/:invoiceId` | Draft editor, finalize, payments, cancellation, PDF/history | Corrections/refunds, billing details/templates and explicit print flow |
| Unpaid invoices `/business/unpaid-invoices` | Paginated unpaid/overdue records and outstanding balances | Collection workflow and currency-separated reporting |
| Messages `/messages` | Real setup/health states, public conversations/messages, handoff, CRM linking and conversation deep links | Identity reuse, admin lifecycle and monitoring |
| Business settings `/business/settings` | Business profile/identity/currency/locale and module visibility | Tax/template/preset refinements and entitlement integration |
| Automations / Reports | Existing workflow and dashboard engines reachable from grouped navigation | Distilled landing pages and meaningful operating summaries |
| Ask LessBusy AI | Existing panel with server provider and authorized business tools | Route/filter/record context, suggested prompts, tenant budgets/usage |

The configurable workspace menu is under “Saved views & workspace menu”; favorites and native advanced operations remain available. Module preferences control presentation, while backend permissions remain authoritative. No invented dashboard metrics, sales totals or conversations are used.

## 18 October expanded source implementation

- `/customers` adds active/archived/all views, selection of at most 50 loaded customers, confirmed batch assignment/tags/archive/restore, loaded-result CSV export and `/customers/import` with previews and duplicate warnings. Archive preserves all native relationships and financial history.
- `/companies` and company profiles reuse native company records, contact/deal relationships and rich notes/tasks/activity.
- `/leads` supplies daily enquiry queues. `/deals` supplies a metadata-driven board with actual stored amounts and dates, search/owner/stage filters, notes and confirmed concurrency-checked stage/date changes. Native pipeline tools remain linked.
- `/tasks/new` supports description, priority, due date, employee assignment, customer/deal links and an optional in-app reminder. Overview and Tasks display due reminders for the authenticated assignee, with one-hour snooze and acknowledge. This is not background outbound notification delivery.
- `/products` has a full product/service editor, flexible attribute/value controls, variant SKUs/prices/costs/taxes/barcodes/thresholds, archive/status and image URL inputs. `/products/import` handles up to 50 simple products with independent results and retry keys.
- `/inventory` has search, location filters and real balance detail. `/inventory/locations` manages active locations. Balance detail includes receiving/corrections/manual reservations, expiry awareness, movement history and atomic transfer to another balance for the same option. Order-owned reservations are managed through their order.
- `/sales` has quote/order/invoice directories and persistent conversion actions. Document screens add deal links, billing snapshots, template/locale notes, printable PDFs, payments, internal credits/refunds and adjusted outstanding balances. `/business/reports` reports finalized-invoice cohorts with current balances and explicit partial-result labels.
- `/messages` separates reply status from handling state and offers atomic customer acquisition/linking with optional provider-contact recognition. `/integrations` manages encrypted Chatwoot connection settings, inbox allowlists and an explicit saved-account health check.
- `/intelligence` reads native model availability and membership-scoped AI allowance; model and budget controls remain in existing settings and preserve existing entitlements. The global assistant remains accessible without leaving the current form.

These are source routes and workflows. No browser or runtime verification was performed for this implementation pass.

Additional source routes: `/products/export` supports batched option-level CSV export with optional authorized costs, partial-file labels and a 1,000-row file bound. Integration settings display the last twenty sanitized worker outcomes. Reservation expiry has disabled-by-default recurring dispatcher/registration source; no cron was registered or executed.
