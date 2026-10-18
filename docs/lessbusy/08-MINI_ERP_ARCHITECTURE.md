# Mini-ERP implementation

Source has been added; it has not been installed in a workspace or validated end to end. Tests, builds and runtime troubleshooting are deferred at the user's request.

## Workspace schema

`packages/twenty-apps/lessbusy-business/src/objects/` defines products, flexible variants, locations, stock balances, movements, reservations, quotations, orders, invoices, payments, number sequences and business profiles. Additional conversation references and integration-event receipts support messaging. Stable identifiers live in `src/constants/universal-identifiers.ts`; roles, default views and page layouts accompany the definitions. This extends Twenty's workspace object system rather than introducing another tenant database. No database migration or application sync has been applied.

## Domain operations

`packages/twenty-server/src/modules/lessbusy/services/lessbusy-inventory.service.ts` implements balance initialization and confirmed adjust/reserve/release/commit commands. Transactions, version comparisons, operation-key hashes and an append-only movement ledger provide concurrency and retry controls in source. Negative balances and reservations above on-hand quantities are rejected. Low-stock queries scan bounded, cursor-paginated balance batches and explicitly report whether more remain.

`services/lessbusy-sales.service.ts` implements draft creation and editing for quotations, orders and invoices. Quotation transitions are draft → sent → accepted/declined, with cancellation before acceptance. Orders progress draft → confirmed → fulfilled, with cancellation before fulfillment. These actions record status only: sending, stock operations and payments are separate explicit actions.

Invoice finalization allocates a workspace/year number, snapshots business identity and customer name, and freezes the financial document. Payment records support partial settlement, idempotency and overpayment rejection. Unpaid invoices may be cancelled with a reason; paid documents require a future credit/refund workflow.

`utils/calculate-document-totals.util.ts` calculates integer minor-unit amounts with BigInt, line/document discounts, proportional discount allocation and taxes. Document discount basis points are persisted so draft editing retains the original calculation inputs. `utils/render-invoice-pdf.util.ts` renders authorized finalized snapshots with the existing PDF renderer. Business invoices remain separate from platform subscriptions.

`query-hooks/protected-business-mutations.ts` rejects generic mutations of protected financial, stock and integration objects. The human-facing domain controller requires standard authenticated workspace sessions; financially meaningful operations require explicit confirmation.

## Product surfaces

`packages/twenty-front/src/pages/lessbusy/` includes business setup, sales creation, invoice details/editing, quotation/order details, unpaid invoices, inventory commands and low-stock review. Existing record pages link to the matching business actions. Accepted quotation/order items can prefill a new document for review; this is not an accounting conversion or fulfillment transaction.

Still required: application installation/sync, automated concurrency and tenant-isolation coverage, accounting corrections, serial/warranty workflows, reservation-expiry processing, richer customer billing snapshots/templates and verified operational rollout. No tax-compliance certification is claimed.

## Expanded commercial implementation — 18 October 2026

`lessbusy-catalogue.service.ts` owns product/options saves, canonical attribute combinations, SKU uniqueness, service stock restrictions, audit history and optimistic version checks. The React editor uses attribute/value controls; the simple-product CSV importer records per-row outcomes and reuses original operation keys.

`lessbusy-sales-conversion.service.ts` persists accepted quote→order draft and confirmed/fulfilled order→invoice draft conversions. Source/target IDs, unique source-document keys, source pointers and immutable line snapshots retain provenance. Native opportunities remain separate from orders; optional deal links are verified against the selected customer.

`lessbusy-order-inventory.service.ts` reserves a confirmed order's tracked options at a location and releases/fulfills all order-owned reservations transactionally. `lessbusy-stock-expiry.service.ts` releases bounded expired batches; order reservations are released together. A queued expiry processor, bounded cross-workspace dispatcher and cron registration command now exist in source. LESSBUSY_STOCK_EXPIRY_ENABLED defaults to false; no recurring schedule was registered or run. `lessbusy-stock-transfer.service.ts` moves only unreserved units between active locations for the same option, with source/target version checks, paired movement records and an idempotent operation receipt.

`lessbusy-invoice-adjustments.service.ts` records internal credit adjustments and refunds, validates ceilings and preserves issued invoice data. `get-invoice-settlement.util.ts` derives adjusted receivable, net paid, outstanding and refund due using BigInt. Refund entry records money already returned externally; no payment-provider transaction occurs. Credits are not a claim of regulatory credit-note compliance.

Document issue/finalization freezes business identity, customer billing identity, tax identifiers, locale, template and notes. Quote/invoice PDF endpoints support inline printing and download. The sales report selects finalized invoices by period and reports their current balances, currency by currency; it is not a historical cash-flow or tax filing report.

Additive metadata now includes credit/refund records, provider-contact identities, inventory operation receipts, customer extensions on native Person and reminder/priority extensions on native Task. Query indexes cover reservation expiry/order status, invoice status/due/finalization, contact interaction/reply state, hot-lead follow-up, customer archive/assignment and task reminders. These definitions have not been synced or applied to any database.

`LessBusyStockExpiryDispatchJob` pages through installed LessBusy applications in batches of fifty, revalidates bindings in each worker and uses stable operation IDs per five-minute window. Each workspace worker processes at most three bounded expiry transactions; empty queues create no receipts. Existing queue retry/backoff and Sentry cron instrumentation are reused. The server flag is checked both at registration and execution.

`LessBusyCatalogueService.exportBatch` pages through fifty options, batch-loads permitted parent products and optionally includes authorized costs. The UI makes live-read/partial-file behavior explicit and does not claim the simple importer is a multi-option restore tool.
