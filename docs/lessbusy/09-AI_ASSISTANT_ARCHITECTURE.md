# AI assistant architecture

Verified reuse: frontend `src/modules/ai/`, `useOpenAskAiPageInSidePanel`; server metadata `ai/ai-models`, `ai/ai-agent-execution`, `ai/ai-chat`, plus core `tool-provider`. Existing missing-key banner and history should be retained.

OpenRouter official contract checked 18 October 2026: https://openrouter.ai/docs/quickstart. It supports server-side chat completions at `/api/v1/chat/completions` and streaming. Adapt the existing OpenAI-compatible SDK factory, not a second autonomous agent runtime.

Required configuration (planned, not wired by M1): OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL, LESSBUSY_AI_ENABLED=false, LESSBUSY_AI_MAX_OUTPUT_TOKENS=1500, LESSBUSY_AI_REQUEST_TIMEOUT_MS=30000. No VITE/REACT_APP secret. Empty credentials must leave ordinary CRM operational.

Business tools: allowlisted capabilities, strict schemas, server-derived workspace/actor, permission-aware repositories, bounded output, audit metadata and idempotency. Never accept a workspace ID or URL from model text as authority. Retrieve minimal authorized record fields. Route registry maps capability IDs to existing valid paths; reject arbitrary URLs and unknown filters.

Context allowlist: route/module, explicitly selected record IDs and known filters. No scraping arbitrary page content. Financial operations prepare a draft proposal, then require explicit confirmation bound to actor/workspace/version before persistence/finalization. Background customer replies use separate policies.

Before activation: timeout, invalid-model, missing-key, retry bounds, cancellation, streaming termination, usage/cost per workspace, unauthorized tools and cross-tenant tests. Existing general-purpose tools require review before financial objects become available. M1 adds only branded access to the existing assistant, not a new provider or safety claim.

## Expanded context and tool source — 18 October 2026

The LessBusy route-context whitelist sends a registered page identifier or an authorized record ID. It excludes form contents, CSV contents, arbitrary query strings and hidden page data. Server descriptions are independently allowlisted. Session-bound API requests reject stale user/workspace generations and require a workspace header that is checked against authenticated tenancy; it never selects a tenant.

Additional tools registered through the existing tool provider are `lessbusy_search_business`, `lessbusy_get_product_details`, `lessbusy_check_stock`, `lessbusy_get_customer_summary`, `lessbusy_get_my_tasks` and `lessbusy_prepare_task`. Retrieval uses effective field permissions and bounded records. Stock availability is derived from stored on-hand/reserved quantities; missing balances are never inferred to mean zero. Selling-option retrieval excludes cost prices. Invoice/task proposal output opens an editable review form only on a user click and saves only after explicit confirmation.

`/intelligence` reuses native model tiers and the existing `aiChatUsage` query. It shows the applicable allowance as a percentage and period end, and links to existing AI/usage-limit settings. Missing consumption is shown as unavailable; no allowance is not advertised as unlimited. It does not bypass existing entitlement gates or manufacture provider costs/billing balances. Additional tenant provider/budget configuration and cost-reporting work remain.

`lessbusy_get_deal_details` retrieves an exact permitted native opportunity with expected amount, stage, owner and close date. Optional bounded quote/order/invoice sections are independently permission-checked; expected deal value is never presented as paid revenue.
