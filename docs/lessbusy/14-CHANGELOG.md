# Transformation changelog

## 18 October 2026 — initial audit and design foundation
- Created branch `feature/lessbusy-transformation` from rebrand branch, preserving all existing modifications.
- Added the fourteen requested architecture/audit/report documents.
- Identified running release/source skew and host dependency gap.
- Planned an additive overview, real authorized workflow shortcuts and access to the existing AI side panel.

Removed functionality: none. Relocated functionality: none in first increment. Database migrations: none. Data reset/deletion: none. Production deployment: none. Existing LessBusy branding, technical identifiers, legal files, custom menus, CRUD and workspace ownership are retained.

## 18 October 2026 — implementation-only continuation

User directed implementation to continue while deferring tests, builds and runtime troubleshooting. The following describes source changes, not verified deployed functionality.

- Added a metadata/permission-aware Overview, native CRM wording improvements, business navigation and persistent access to the existing AI panel.
- Added a LessBusy Business application schema with fifteen workspace objects, stable identifiers, role definitions, views and record layouts. No application installation or database sync was run.
- Added transactional inventory commands, idempotency ledger, reservation actions and bounded low-stock retrieval.
- Added quotations/orders/invoices, decimal-safe totals, draft editing, versioned status changes, invoice finalization, partial payments, cancellation and PDF generation. Added unpaid/overdue invoice review and native-record links to business actions.
- Added configurable server-side OpenRouter provider integration and assistant tools for authorized navigation, hot leads, low stock, overdue invoices and invoice proposals. Proposal confirmation opens an editable form before saving.
- Added server-managed Chatwoot account/workspace bindings, signed webhook ingestion, queued reference synchronization, deterministic lead qualification, authorized inbox/message retrieval, human handoff and confirmed customer/lead linking. Conversation reference versions protect concurrent updates.
- Added workspace business identity and module-visibility settings; module visibility remains a presentation preference rather than authorization.

Implementation paths: `packages/twenty-front/src/modules/lessbusy/`, `packages/twenty-front/src/pages/lessbusy/`, `packages/twenty-server/src/modules/lessbusy/`, `packages/twenty-server/src/engine/core-modules/tool-provider/tools/lessbusy-*.tool.ts`, and `packages/twenty-apps/lessbusy-business/`.

No functionality removed in this continuation. No production deployment, CRM data deletion or real messaging-account connection performed. Milestones remain unverified until the deferred validation and installation work is completed.

## 18 October 2026 — lead qualification and follow-up implementation

- Added a lead workspace for creation, manual qualification, customer association, buying readiness, priority, handling status, next-step guidance and follow-up dates.
- Added explicit protection of manual qualifications, with a visible option to allow future synchronized message classifications. This does not enable outbound messaging.
- Added transactionally created follow-up tasks assigned to the authenticated workspace member, linked to the customer where present, with retry keys and lead review history.
- Added lead version comparisons and protected business mutation handling; native lead lists and record pages link to the dedicated actions. Existing standard People, Opportunities and Tasks operations are retained.
- Added native list actions for protected sales, stock and business-profile objects, so users can discover supported creation workflows.

Source: `packages/twenty-server/src/modules/lessbusy/services/lessbusy-leads.service.ts`, `packages/twenty-front/src/pages/lessbusy/LessBusyLead.tsx`, `packages/twenty-front/src/modules/lessbusy/components/LessBusyRecordActions.tsx`, and the existing LessBusy application metadata. No tests, builds, application sync, migrations or runtime investigation executed in this continuation.

## 18 October 2026 — master-prompt reconciliation and CRM distillation

- Re-read the master prompt and replaced stale milestone-only documents with a requirement-level coverage/gap matrix and implementation queue. Source work is distinguished from retained upstream functionality and missing workflows.
- Added `/customers` directory and customer workspace using existing record hooks: name/email search, sorting, basic create/edit, optional contacts and related business/conversation sections. Advanced native record/list tools remain linked.
- Added `/tasks` with personal/open/date/completed views, creation and completion/reopening using native permission-aware operations.
- Grouped primary workflow navigation by Workspace, Business, Intelligence and Platform; moved the existing configurable workspace menu into a disclosure without deleting its entries.
- Added conversation deep links from customer profiles, shared field-access checks and customer-workspace links on native person records.

This remains partial implementation of the full prompt. Tests/builds/runtime troubleshooting remain deferred; no schema install, database reset or production deployment performed.

## 18 October 2026 — richer workflow implementation (source only)

Implemented catalogue editing/import, customer billing/social/assignment fields, company/customer profiles with native notes/tasks/activity, customer sales summaries and quick actions, transactional customer import/bulk archive/restore/tags/assignment, metadata-driven deal pipeline, lead-to-deal conversion, detailed task proposals/assignment/in-app reminders, quote→order→invoice provenance, order-owned stock reservations/fulfillment, receiving/corrections/history, expiry batches/worker, location management and atomic stock transfers.

Added internal invoice credit/refund ledgers, adjusted settlement calculations, frozen document identity/template/locale notes, quote/invoice print/download, sales directories/export and invoice-period reporting. Added encrypted integration administration, saved-account probes, contact recognition, atomic conversation-to-customer creation, independent reply/handling state and improved monotonic deterministic qualification. Added server-authorized AI context/search/product/stock/customer/task tools, contextual prompts/navigation and a native-model/allowance AI workspace. Added additive query indexes and session/workspace request protection.

Main source paths: `packages/twenty-front/src/pages/lessbusy/`, `packages/twenty-front/src/modules/lessbusy/`, `packages/twenty-server/src/modules/lessbusy/`, `packages/twenty-server/src/engine/core-modules/tool-provider/tools/lessbusy-*.tool.ts`, and `packages/twenty-apps/lessbusy-business/src/`.

Retained native CRM records, relationships, notes, pipeline/view tools, dashboards/workflows, platform billing, legal notices and earlier LessBusy changes. No tests, builds, app/runtime commands, application sync, database migration execution, deployment, real Meta connections, commits or pushes were performed for this experimental implementation pass. Current code has not been verified end to end.

Follow-on source work adds option-level catalogue CSV export, sanitized integration synchronization activity and disabled-by-default recurring reservation-expiry dispatch/registration. Existing native queue and cron services are reused. No cron registration or execution occurred.
