# LessBusy implementation roadmap

Updated 18 October 2026. The master transformation prompt remains the scope. This experimental pass follows the user's later instruction to implement source continuously and defer tests, builds, runtime execution, deployment and schema/application installation. No milestone is declared verified or complete.

## Source implementation reached

- Design/navigation: retained LessBusy branding, daily workflow navigation, contextual actions, theme-aware primitives, optional modules and progressive access to native advanced tools.
- CRM: customers, companies, leads, pipeline and tasks have dedicated workflows. Native records, rich notes, activity, saved views, dashboards and advanced editors are retained. Customer acquisition/import/archive/bulk operations and task assignment/reminders are now implemented in source.
- Mini-ERP: product/service catalogue, flexible variants, import, inventory/location management, transfers, receiving, reservations, order fulfillment, expiry batches, quote/order/invoice conversions, payments, corrections, document snapshots/PDF and sales reporting are implemented in source.
- AI: OpenRouter uses the existing provider/panel architecture. Authorized route/record context, suggestions, navigation, search, stock checks, customer summaries, own tasks and human-reviewed invoice/task proposals are implemented.
- Messaging: signed webhooks, deduplicated queue work, contact identity reuse, public conversation retrieval, separate reply/handling state, human handoff, customer creation/linking, manual classification protection and encrypted integration administration are implemented.

## Remaining implementation

1. Add further guided industry presets and refinements to product imports/exports and image uploads. Serial numbers and per-unit warranty records are not implemented.
2. Finish operational controls for the recurring reservation-expiry dispatcher. The dispatcher, guarded cron registration and bounded worker batches exist in source with LESSBUSY_STOCK_EXPIRY_ENABLED=false. No recurring schedule was registered or run.
3. Extend reminders beyond the in-app assigned-employee queue. No email, push or customer message reminder delivery is implemented or enabled.
4. Add provider-assisted qualification fallback, broader language handling, workspace classification/reply policy, fuller integration failure recovery operations. A last-twenty-attempt success/failure view is implemented. No autonomous customer reply is implemented.
5. Add practical tenant AI configuration, budgets, usage/cost reporting and the platform SaaS entitlement bridge using existing infrastructure.
6. Extend reporting with complete aggregates, historical payments/refunds by event date and further operations analytics. Current invoice-period reports show current document balances, with explicit batch completeness and separate currencies.
7. Package and install additive metadata through the existing application lifecycle, then resume verification only when requested. Stable identifiers must be retained; existing records must not be reset.

## Deferred verification and operational work

When the user resumes validation: exercise CRM relationships, import retries, bulk concurrency, pipeline updates, task reminders, product uniqueness, transfer/reservation races, sales conversion retries, financial calculations, PDFs, role boundaries, two independent tenants, session switches, provider failures, webhook replay/out-of-order events, worker reliability, accessibility and responsive layouts. Finish monitoring, backups/restore, workload controls and staged rollout afterward. No production work has been performed.
