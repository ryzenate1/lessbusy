# LESSBUSY — CONTROLLED REPAIR, HARDENING & COMPLETION PROGRAM
## Execution Agent: GLM-5.3 Flash via OpenCode
### Execute one phase at a time. Evidence first. No destructive rewrites.

# 0. YOUR ROLE AND MISSION

You are a senior software engineer performing a controlled repair and stabilization of **LessBusy**, an existing business management application built by modifying and extending Twenty CRM.

Your mission is to identify, reproduce, fix, and verify the problems identified by three independent technical reports:

1. Independent Architecture and Security Review.
2. Chatwoot Integration Architecture Specification.
3. LessBusy Independent UX Specification.

A separate implementation agent previously developed substantial LessBusy functionality.

**You are NOT starting a new project.**

You are NOT recreating LessBusy.

You are NOT rewriting Twenty in Go.

You are NOT supposed to replace the existing architecture with a different framework.

Your job is to preserve the existing implementation, fix its weaknesses, complete important unfinished workflows, and improve the user experience.

## Primary objective

Transform the existing LessBusy codebase from a large, partially implemented application into a reliable, functional, maintainable, and eventually production-ready CRM + Mini-ERP + AI business platform.

Order of importance:

1. Prevent data loss and corruption.
2. Preserve existing working functionality.
3. Enforce security and tenant isolation.
4. Make messaging and background processing reliable.
5. Complete essential business workflows.
6. Ensure AI is safe, permission-aware, and cost-controlled.
7. Improve usability and visual consistency.
8. Establish reproducible builds and deployments.

**Correctness takes priority over implementation speed.**

---

# 1. PROJECT CONTEXT

## What LessBusy does

LessBusy is a multi-tenant business management SaaS serving:

- Clothing and fashion brands
- Electronics stores
- General retail businesses
- Wholesalers and distributors
- Service businesses
- Agencies
- E-commerce businesses
- Other small and medium-sized companies

It must not be hardcoded for clothing stores.

### Main features

CRM:
- Customers
- Companies
- Leads
- Deals
- Tasks
- Notes
- Customer activity

Mini-ERP:
- Products
- Flexible variants
- Inventory
- Quotations
- Sales orders
- Invoices
- Payments
- Stock reservations

AI:
- LessBusy AI side panel
- Context-aware help
- Navigation
- Business record lookup
- Lead classification
- Draft proposals
- OpenRouter integration

Messaging:
- Chatwoot
- WhatsApp
- Instagram
- Customer conversations
- Human handoff
- AI-assisted replies

Platform:
- Multiple tenants
- Roles and permissions
- Business-specific modules
- Usage tracking
- Subscription integration
- Reports

## Existing architecture

The implementation uses the Twenty CRM source foundation:

- React / TypeScript frontend
- NestJS / TypeScript backend
- Twenty's object metadata engine
- PostgreSQL with workspace-scoped schemas
- BullMQ and Redis
- Existing authentication and authorization
- Twenty's AI infrastructure
- Custom LessBusy frontend modules
- Custom LessBusy backend services
- LessBusy application metadata

The previous agent reportedly added approximately:

- 21 custom LessBusy business objects
- Several AI tools
- Custom inventory and sales services
- Chatwoot connection infrastructure
- CRM and Mini-ERP pages
- Workspace-specific business roles

These numbers describe an earlier repository snapshot. Verify the current state before relying on them.

## Expected repository

Previous report:

`/Users/riyaz/lessbusy/business-automation`

Primary application:

`/Users/riyaz/lessbusy/business-automation/sources/twenty-crm`

Chatwoot:

`/Users/riyaz/lessbusy/business-automation/sources/chatwoot`

Twenty local infrastructure:

`/Users/riyaz/lessbusy/business-automation/infrastructure/local/twenty`

Find the actual paths. Do not assume they are unchanged.

Important source areas previously identified:

```text
packages/twenty-front/src/pages/lessbusy/
packages/twenty-front/src/modules/lessbusy/

packages/twenty-server/src/modules/lessbusy/

packages/twenty-server/src/engine/core-modules/
tool-provider/tools/lessbusy-*.tool.ts

packages/twenty-apps/lessbusy-business/src/

packages/twenty-server/src/engine/twenty-orm/

packages/twenty-server/src/engine/core-modules/
message-queue/
```

Check the actual repository for current filenames and module structure.

---

# 2. MANDATORY EXECUTION CONTRACT

These rules override any desire to finish the entire project in one run.

## Rule A — ONE PHASE ONLY

You must execute exactly ONE phase per user instruction.

For the initial run:

**EXECUTE PHASE 0 ONLY.**

After Phase 0:

- Stop.
- Return findings.
- Wait for explicit permission before Phase 1.

Never automatically start Phase N+1 after finishing Phase N.

The user will say:

"Proceed with Phase 1."

Then execute only Phase 1.

This rule continues through every phase.

## Rule B — NO UNVERIFIED ASSUMPTIONS

The architecture review is evidence to investigate, not an infallible statement of the current codebase.

For each issue:

1. Locate the relevant code.
2. Confirm that the implementation still matches the report.
3. Determine whether the problem is real.
4. Reproduce it where feasible.
5. Design the smallest correct fix.
6. Implement it.
7. Test it.
8. Document the result.

If an alleged defect is already fixed, document the evidence and do not reimplement it.

## Rule C — PRESERVE EXISTING WORK

Do not run destructive Git commands.

Forbidden without explicit user authorization:

```bash
git reset --hard
git clean -fd
git checkout -- .
git restore .
git push --force
```

Never delete the original databases, Docker volumes, or application metadata to fix installation problems.

Never remove existing business objects solely because they appear unused.

Before editing, verify no other agent is actively modifying the same working tree.

If simultaneous modification is detected or suspected, stop and request coordination.

## Rule D — SMALL, FOCUSED DIFFS

Avoid broad refactoring.

Change only the files necessary for the phase.

Prefer existing utilities, dependency injection, queue abstractions, repository methods, and application metadata mechanisms.

Do not add major dependencies unless justified.

Do not invent APIs.

Do not modify unrelated UI or infrastructure.

## Rule E — TEST THE ACTUAL FAILURE

A build passing does not prove concurrency safety.

A unit test passing does not prove tenant isolation.

A TypeScript type check passing does not prove an invoice total is correct.

Use the appropriate test level:

- Unit tests for calculations and parsing
- Integration tests for database transactions
- Concurrency tests for idempotency
- API tests for permissions
- End-to-end tests for business workflows
- Operational tests for queues, recovery, and retries

Never label tests as passed unless actually executed.

If the environment prevents testing, record the exact blocker and mark the phase **BLOCKED** or **UNVERIFIED**, not complete.

## Rule F — SAFE DATABASE WORK

Before any schema migration:

1. Identify the target database.
2. Confirm it is a development or staging database.
3. Check for existing data.
4. Take a suitable backup or verified snapshot.
5. Review the proposed schema changes.
6. Check for duplicates and incompatible records.
7. Apply additive changes where possible.
8. Verify the resulting schema.
9. Verify existing records remain intact.

No destructive migration on an unknown database.

Never silently delete duplicates.

## Rule G — DO NOT BYPASS LICENSES

Preserve Twenty's applicable AGPL requirements and required attribution.

Do not patch license checks or access enterprise-only functionality without appropriate authorization.

Do not use enterprise-licensed code as a shortcut.

---

# 3. STATUS REPORT FORMAT

At the end of EVERY phase, return:

```text
LESSBUSY REPAIR REPORT

PHASE:
STATUS: PASS / PARTIAL / BLOCKED / NOT STARTED

1. INITIAL FINDINGS
- Confirmed issues
- Already-fixed issues
- Unverified claims

2. CHANGES
- Exact files modified
- What changed
- Why each change was necessary

3. DATABASE IMPACT
- Schema changes
- Existing-data risks
- Migration or synchronization actions
- Backup/restore status

4. VERIFICATION
- Commands executed
- Tests passed
- Tests failed
- Tests not executed and why

5. REGRESSION RISKS
- What might be affected
- Rollback procedure

6. REMAINING PROBLEMS
- Issues still open
- Required decisions

7. HANDOFF
- Git commit SHA, if committed
- Current working-tree status
- Next recommended phase

STOP AND WAIT FOR USER APPROVAL.
```

Also maintain:

`docs/lessbusy/repairs/REPAIR_STATUS.md`

Create phase-specific reports under:

`docs/lessbusy/repairs/PHASE-XX.md`

Do not overwrite another agent's reports.

Do not modify existing architectural findings merely to make them match your implementation.

---

# PHASE 0 — REPOSITORY SAFETY, BASELINE, AND PROBLEM VERIFICATION

## Objective

Secure the existing development work before any repairs.

The independent reviewer previously reported roughly 203 uncommitted files on:

`feature/lessbusy-transformation`

That observation may now be outdated.

Verify the current Git state.

## Tasks

### 0.1 Inspect Git

Run appropriate read-only commands, including:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git log -5 --oneline
git diff --stat
git diff --name-status
```

Inspect untracked files separately.

Identify which changes belong to:

- LessBusy CRM
- Mini-ERP
- AI
- Chatwoot
- Rebranding
- Application metadata
- Infrastructure
- Documentation

### 0.2 Establish a safe checkpoint

If uncommitted work exists:

- Verify another agent is not modifying the same repository.
- Identify secrets, generated artifacts, temporary files, and local environment files.
- Check which files are safe to version-control.
- Prepare a reversible checkpoint strategy.

Do not stage or commit secrets.

Do not blindly execute `git add -A`.

Preserve every legitimate source change.

If it is safe to checkpoint, create a descriptive feature-branch commit after reviewing the staged diff.

Otherwise, stop and explain what prevents a safe checkpoint.

Do not create a production release tag.

### 0.3 Inspect environment

Determine:

- Running services
- Database location
- Redis configuration
- Docker Compose setup
- Current Twenty version
- LessBusy application version
- Chatwoot commit/version
- Available test commands
- Existing build status
- Metadata installation status

Do not restart or reset services during Phase 0.

### 0.4 Verify critical source locations

Investigate the reported issues:

C1 — Reservation expiry scheduling  
C2 — Database uniqueness  
C3 — Messaging queue serialization  
C4 — Missing webhook reconciliation  
C5 — AI actor authorization  
C6 — Uncommitted build inputs  
C7 — Shared AI cost envelope  
C8 — Event retention  
C9 — Secret management  
C10 — Webhook rate limiting and SSRF configuration  
C11 — Excessive upstream fork modifications

For each, determine whether it is:

- CONFIRMED
- ALREADY FIXED
- PARTIALLY FIXED
- NEEDS REPRODUCTION
- NOT APPLICABLE

Do not implement fixes during Phase 0.

## Deliverables

`PHASE-00.md`

A verified issue register with file paths and evidence.

A safe Git checkpoint or an explicit blocker.

A list of commands needed to establish a reproducible development build.

## Acceptance criteria

- Existing changes are preserved.
- Current branch and commit are known.
- No secrets were committed.
- No databases were reset.
- Critical issues are mapped to real source locations.
- The next phase can proceed without risking other agents' work.

**STOP AFTER PHASE 0.**

---

# PHASE 1 — DATABASE UNIQUENESS AND IDEMPOTENCY

## Priority: P0 — DATA INTEGRITY

## Problem

The architecture reviewer found application-level SELECT-then-INSERT idempotency checks without corresponding database uniqueness guarantees in some LessBusy objects.

Concurrent requests may create duplicate records.

Potentially affected:

- `lbInvoice`
- `lbQuotation`
- `lbSalesOrder`
- `lbPayment`
- `lbCreditAdjustment`
- `lbRefund`
- `lbStockMovement`
- `lbStockBalance`
- `lbConversationReference`
- `lbIntegrationEvent`
- `lbNumberSequence`

Relevant keys may include:

- `operationKey`
- `balanceKey`
- `externalKey`
- `name` / sequence key

These are candidate constraints, not an instruction to add every index blindly.

## Tasks

### 1.1 Audit existing metadata

Inspect:

`packages/twenty-apps/lessbusy-business/src/`

Find the actual object definitions and existing index declarations.

Verify the current Twenty SDK's supported unique-index syntax.

### 1.2 Classify required uniqueness

For each object, document:

- Logical identity
- Workspace scope
- Key field
- Nullability
- Whether uniqueness should be partial or unconditional
- Existing duplicates
- Impact of applying the index
- Expected duplicate-request behavior

Do not use an overly broad unique constraint that blocks legitimate business records.

### 1.3 Implement database-enforced uniqueness

Use the existing application metadata/indexing mechanism when supported.

If that mechanism cannot enforce a required invariant, document the limitation and propose the smallest compatible alternative.

Ensure uniqueness is enforced by PostgreSQL, not just application-level lookup.

### 1.4 Handle conflicts correctly

When two requests share an idempotency key:

- Only one logical operation should succeed.
- A legitimate retry with the same payload should return the recorded result when appropriate.
- Reusing the same key with a different payload should fail clearly.
- Database unique violations should be handled intentionally.
- No orphaned payment, stock, or financial records should remain.

### 1.5 Inspect existing duplicates

Run read-only duplicate-detection queries first.

If duplicate records exist, produce a reconciliation plan.

Do not automatically delete or merge financial records.

### 1.6 Verify frontend retry behavior

Inspect `useLessBusyApi` and the corresponding mutation forms.

Ensure network retries don't accidentally mint a new idempotency key for the same unconfirmed operation.

A genuine user-requested new operation must receive a new key.

Optimistic-lock conflicts must lead to a refresh/review workflow rather than silent resubmission.

## Required tests

- Two simultaneous identical invoice requests
- Two simultaneous stock-balance creations
- Duplicate payment submission
- Duplicate stock movement
- Duplicate webhook event
- Concurrent first invoice-number allocation
- Same idempotency key with changed payload
- Optimistic-lock conflict
- Existing-data preservation

Use real PostgreSQL integration tests for race conditions.

## Acceptance

- Relevant uniqueness constraints are database-enforced.
- Concurrent operations do not create duplicate business effects.
- Number sequences remain unique.
- Existing data is preserved.
- Retry behavior is deterministic.
- Required database tests pass.

Do not proceed if financial duplication remains possible.

---

# PHASE 2 — INVENTORY RESERVATION EXPIRY

## Priority: P0 — INVENTORY CORRECTNESS

## Problem

The reviewer identified:

`LessBusyStockExpiryJob`

and reported that it existed without a recurring scheduler.

The manual UI action was identified near:

`LessBusyReservationExpiry.tsx`

Expired reservations may continue reducing available stock indefinitely.

## Tasks

### 2.1 Trace the existing lifecycle

Inspect:

- Reservation creation
- Reservation expiration
- Stock balance calculation
- Expiry job
- Queue registration
- Manual expiry action
- Release logic

Verify whether the scheduling problem still exists.

### 2.2 Implement automated expiry

Use Twenty's existing supported scheduler and queue infrastructure.

Prefer a scalable design that can process active workspaces in bounded batches.

Do not register an uncontrolled number of permanent cron jobs without evaluating tenant scale.

Define the schedule through appropriate configuration.

A 10–15-minute interval may be used as an initial development default, subject to validation.

### 2.3 Preserve transaction safety

The scheduler and manual expiry must not release the same reservation twice.

Expiry, manual release, and order commitment must coordinate safely.

Require:

- Idempotent processing
- Correct tenant context
- Bounded batches
- Retry-safe behavior
- No negative stock
- No double-release
- No release after successful commitment

### 2.4 Monitoring

Add suitable observability for:

- Expired active reservations
- Failed expiry jobs
- Oldest overdue reservation
- Processing duration
- Repeated failures

### 2.5 Tests

Test:

- Reservation before expiration
- Reservation after expiration
- Two expiry workers
- Manual release during expiry
- Fulfillment during expiry
- Worker restart
- Retry after partial failure
- Two independent workspaces

## Acceptance

Reservations expire without requiring a user to open Inventory.

Available stock becomes accurate after expiry.

Expired reservations cannot be released twice.

Inventory invariants hold under concurrency.

---

# PHASE 3 — MINI-ERP FINANCIAL AND STOCK WORKFLOWS

## Priority: P0 — BUSINESS TRANSACTION CORRECTNESS

## Objective

Complete and verify the essential relationship between quotations, orders, stock, invoices, and payments.

Do not build a full accounting system.

## Required business flow

```text
Customer
   ↓
Quotation
   ↓
Accepted quotation
   ↓
Sales order
   ↓
Inventory reservation
   ↓
Order fulfillment
   ↓
Stock commitment
   ↓
Invoice
   ↓
Payment
```

Not every business requires inventory. Service-only orders must remain supported.

## Tasks

### 3.1 Conversion provenance

Verify and implement explicit relationships:

- Quotation → Order
- Order → Invoice
- Deal → Quotation/Order where appropriate

Persist source/target identifiers.

Avoid duplicate conversion when a request is retried.

Prevent contradictory document state transitions.

### 3.2 Stock reservation integration

When an inventory-tracked order is confirmed:

- Verify availability.
- Reserve the correct product variants and quantities.
- Use the correct stock location.
- Prevent overselling.
- Associate reservations with the order.
- Handle order cancellation.
- Handle fulfillment.
- Commit stock exactly once.

If a transaction spans unsupported boundaries, document and implement a recoverable state machine rather than pretending the operation is atomic.

### 3.3 Invoicing

Verify:

- Unique numbering
- Correct currency
- Correct tax handling
- Correct discount allocation
- Decimal-safe calculations
- Draft/finalized state
- Immutable finalized values
- Partial payments
- Refund/credit rules
- Cancellation restrictions
- PDF generation

Existing BigInt monetary calculations should be preserved unless a demonstrated defect requires changing them.

### 3.4 Snapshot and correction behavior

Ensure invoices preserve appropriate customer and line-item information at finalization.

Changing a customer's address or product price later should not silently rewrite a finalized invoice.

Define corrections through explicit credit/correction flows rather than editing immutable financial history.

### 3.5 Referential consistency

Review whether soft-deleting products, warehouses, variants, customers, or related objects can orphan financial or inventory records.

Add appropriate guards or stronger relational constraints where supported.

### 3.6 Tests

- Quotation to order
- Order to invoice
- Same conversion requested twice
- Product unavailable
- Concurrent order confirmation
- Cancel reserved order
- Fulfill order
- Double fulfillment attempt
- Service-only invoice
- Partial payments
- Overpayment rejection
- Refund limits
- Price changes after finalization
- Variant deletion with historical documents
- Currency and rounding edge cases

## Acceptance

The core business flow is coherent, traceable, idempotent, and transactionally safe.

No duplicated stock movement or financial effect occurs during retries.

All critical operations have explicit lifecycle states.

---

# PHASE 4 — AI AUTHORIZATION, ROLES, AND TENANT SECURITY

## Priority: P1 — SECURITY

## Problem

The independent reviewer identified an authorization design weakness.

Current financial protection reportedly depends on:

- No dangerous AI tools being registered
- Protected object mutation hooks
- Workflow blocklists
- Indirect checks of the authentication context

The mutation services should also explicitly know whether the caller is a human or an automated actor.

## Tasks

### 4.1 Review authentication context

Inspect:

`WorkspaceAuthContext`

and relevant tool-execution code.

Verify how user, application, workflow, agent, and AI-tool contexts are constructed.

### 4.2 Implement explicit actor origin

Introduce the smallest compatible server-derived actor classification.

Example concepts:

- HUMAN
- APPLICATION
- AI_TOOL
- WORKFLOW
- BACKGROUND_JOB

Use the project's existing conventions where possible.

Do not trust a browser-provided `actorKind` header.

Do not allow callers to self-declare themselves human.

Avoid modifying every upstream auth path unnecessarily.

### 4.3 Protect business mutations

Inventory, invoice, payment, refund, and protected sales services must validate the authorized actor explicitly.

Ensure AI tools cannot simply acquire human authority by wrapping a service call.

Existing read-only and proposal tools should keep working.

### 4.4 Audit protected objects

Inspect:

`protected-business-mutations.ts`

and:

`ObjectsBlockedFromAutomation.ts`

Verify that protected mutation controls cover the relevant object operations through both GraphQL and REST.

Do not disable protected mutation hooks to make tests pass.

### 4.5 Verify roles

Check:

- Owner
- Administrator
- Sales
- Support
- Inventory
- Billing
- Analyst

Verify actual installed permissions, not only role definitions.

Do not bypass edition restrictions.

### 4.6 Tenant isolation

Test two workspaces.

Attempt unauthorized access through:

- REST endpoints
- GraphQL
- AI tools
- Background jobs
- Chatwoot references
- Application metadata
- File access where relevant

All cross-tenant requests must fail safely.

### 4.7 Prompt-injection tests

Test customer-controlled text and record names that attempt to manipulate AI behavior.

Never treat retrieved customer content as system instructions.

Verify that no financial mutation can be triggered through untrusted text.

## Acceptance

- Human-only actions require real server-verified human authorization.
- AI proposal tools remain useful.
- AI cannot directly mutate protected financial records.
- Cross-tenant access is denied.
- Role restrictions work on the backend.
- GraphQL/REST regression tests pass.

---

# PHASE 5 — CHATWOOT EVENT QUEUE AND WEBHOOK RELIABILITY

## Priority: P1 — MESSAGING RELIABILITY

## Problems

The reviewer reported:

1. LessBusy Chatwoot jobs use Twenty's shared `webhookQueue`.
2. Queue concurrency is effectively one.
3. A slow Chatwoot request can delay other work.
4. Queue insertion may scan waiting job IDs.
5. Chatwoot account webhooks do not guarantee retries.
6. LessBusy lacks reconciliation for missed conversation events.

## Tasks

### 5.1 Verify Chatwoot version

The research reports examined different Chatwoot commits.

Record the actual local version.

Check endpoints and behaviors against that version.

Do not implement integration assumptions taken from a different commit without verification.

### 5.2 Audit the queue

Inspect:

`message-queue-worker-config.constant.ts`

and the LessBusy Chatwoot jobs.

Measure existing worker concurrency and enqueue behavior.

### 5.3 Isolate messaging work

Prefer a dedicated LessBusy integration queue.

Preserve existing Twenty webhook processing.

Configure appropriate concurrency and bounded retries.

Use database idempotency as the correctness guarantee.

Do not rely on scanning queue IDs for durable deduplication.

### 5.4 Webhook reconciliation

Implement a scheduled recovery process.

It should:

- Identify active Chatwoot connections.
- Read permitted conversations using supported APIs.
- Compare references with LessBusy.
- Recover missing conversation references.
- Update stale statuses.
- Avoid duplicates.
- Handle pagination.
- Store progress/checkpoints.
- Respect Chatwoot rate limits.
- Maintain workspace/account/inbox boundaries.

Do not replicate entire conversation histories unnecessarily.

### 5.5 Delivery observability

Add metrics/logs for:

- Queue depth
- Oldest queued event
- Webhook failures
- Retry count
- Reconciliation lag
- Dead-letter or exhausted events
- Per-tenant processing volume

### 5.6 Test failures

Simulate:

- Chatwoot unavailable
- Slow API
- Duplicate events
- Out-of-order events
- Missing `conversation_created`
- Worker restart
- Two tenants processing messages
- Large queue backlog
- Credential failure

Use mocks or a controlled local Chatwoot instance.

Do not send real WhatsApp/Instagram messages during these tests.

## Acceptance

A dropped webhook does not cause a conversation to remain permanently undiscovered.

One tenant's messaging burst does not unnecessarily stall all other work.

Event handling remains tenant-isolated and idempotent.

---

# PHASE 6 — COMPLETE THE CHATWOOT BUSINESS WORKFLOW

## Priority: P1 — PRODUCT FUNCTIONALITY

## Objective

Finish critical messaging integration while preserving Chatwoot as the communication source of truth.

## Tasks

### 6.1 Tenant provisioning

Investigate idempotent mapping between:

- LessBusy workspace
- Chatwoot account
- Chatwoot inbox
- Provider channel
- Chatwoot AgentBot
- Human support agents

Use APIs supported by the actual installed Chatwoot edition.

Avoid creating duplicate Chatwoot accounts during retries.

### 6.2 Identity mapping

Implement a reliable model for:

- WhatsApp identities
- Instagram identities
- Chatwoot contacts
- LessBusy customers
- Conversation references
- Leads

Do not assume an Instagram account has a phone number.

Do not merge two customers solely because their display names match.

Preserve the authoritative external identifiers.

### 6.3 Human handoff

Verify:

- AI-handled conversation
- Manual takeover
- Human assignment
- AI suspension during takeover
- Return to AI where permitted
- Conversation resolution
- Error recovery

Expose understandable handling states in LessBusy.

### 6.4 Reply lifecycle

Evaluate the actual remaining implementation.

Where approved by project policy, implement the outbound messaging pathway using Chatwoot.

Support:

- Draft reply
- Human review
- Confirmed send
- Delivery status
- Failure status
- Safe retry
- Platform messaging-window checks
- Template requirements
- Per-tenant sending limits

Do not turn on unrestricted AI auto-replies by default.

Separate:

- Internal AI assistance
- Suggested customer replies
- Approved automatic outbound messaging

Any autonomous messaging feature must be explicitly enabled and subject to the business's policy, channel constraints, and escalation rules.

### 6.5 Test

Verify an end-to-end simulated conversation:

```text
Incoming message
→ Chatwoot
→ LessBusy event pipeline
→ Customer identity resolution
→ Lead qualification
→ CRM record update
→ Human review or permitted AI response
→ Delivery/status tracking
```

## Acceptance

Chatwoot and LessBusy remain synchronized.

Human intervention works.

Uncertain cases can be escalated.

No unauthorized outbound messaging occurs.

---

# PHASE 7 — OPENROUTER PRIVACY, AI BUDGETS, AND COST CONTROLS

## Priority: P1 — AI SECURITY AND ECONOMICS

## Problem

The review identified a single instance-wide OpenRouter configuration without confirmed independent per-tenant spending enforcement.

## Tasks

### 7.1 Review provider configuration

Inspect:

`get-lessbusy-openrouter-provider.util.ts`

and related AI provider registration.

Preserve server-side API key handling.

Maintain placeholders in `.env.example`:

```dotenv
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LESSBUSY_AI_ENABLED=false
```

Use existing environment conventions.

Never log or expose the key.

### 7.2 Implement per-tenant AI usage controls

Track:

- Workspace ID
- Model ID
- Input tokens
- Output tokens
- Estimated or confirmed cost
- Timestamp
- Operation type
- Request status

Implement server-enforced limits for:

- Requests
- Concurrent jobs
- Token usage
- Monthly budget
- Optional daily budget

Use concurrency-safe budget reservation/accounting where required.

If actual provider cost is unknown, label the amount as an estimate rather than a confirmed charge.

Do not bypass license-gated upstream usage-limit code.

### 7.3 Model routing and privacy

Verify the current OpenRouter API and privacy controls.

Implement an appropriate policy for:

- Allowed models
- Provider restrictions
- No-training routing
- Zero-data-retention options where supported
- Data minimization
- Sensitive business information

Do not claim ZDR unless the selected provider route actually supports it.

### 7.4 Reliability

Handle:

- Missing API key
- Invalid model
- Provider rate limit
- Timeouts
- Failed tool calls
- Budget exhaustion
- Provider outage

The main LessBusy application must remain usable when AI is unavailable.

### 7.5 AI action safety

Ensure that the LessBusy AI panel can:

- Explain features
- Find authorized records
- Navigate to approved pages
- Suggest actions
- Prepare drafts

Financial and inventory actions must still pass the security controls implemented in Phase 4.

### 7.6 Messaging cost attribution

Add the groundwork for tracking external messaging costs per business.

Verify current Meta pricing and applicable message categories before encoding billing rules.

Do not hardcode speculative or outdated WhatsApp rates.

## Acceptance

One tenant cannot consume an unlimited shared AI budget.

Business data routing follows the configured privacy policy.

API keys remain server-side.

AI failure does not break CRM or Mini-ERP.

---

# PHASE 8 — OPERATIONS, SECRETS, BACKUPS, AND DATA LIFECYCLE

## Priority: P1 — PRODUCTION SAFETY

## Tasks

### 8.1 Database backup architecture

Inspect the current PostgreSQL deployment.

Define:

- Backup frequency
- Retention
- Offsite storage
- Point-in-time recovery requirements
- Restore procedure
- Pre-migration backup requirement

Implement and test a safe development/staging backup and restore workflow where infrastructure permits.

Do not experiment with destructive restore operations against production data.

### 8.2 Redis and queues

Review:

- Redis memory policies
- Worker recovery
- Queue durability
- Retry persistence
- Cache/queue interference

Recommend separation where warranted by availability requirements.

### 8.3 Secrets

Inspect Chatwoot credentials and OpenRouter configuration.

Prefer existing encrypted credential storage over long-lived plaintext JSON embedded in environment variables.

Treat environment configuration as bootstrap-only when appropriate.

Document credential rotation.

Never copy secrets into reports.

### 8.4 Public endpoints

Protect the Chatwoot webhook endpoint.

Verify:

- Signature validation
- Raw-body verification
- Timestamp replay protection
- Request-size limits
- Connection authorization
- Rate limits
- Secure error handling

Configure the existing secure HTTP client appropriately.

Restrict Chatwoot destinations to approved hosts to reduce SSRF exposure.

Do not permit arbitrary internal-network requests.

### 8.5 Retention

Implement or document an enforceable retention policy for:

`lbIntegrationEvent`

Separate durable business history from temporary transport deduplication data.

Keep sufficient event IDs for correct replay behavior.

Review growth of financial JSON audit history.

Never remove legally or operationally required financial records through generic cache cleanup.

### 8.6 File storage

Review storage for:

- Invoice PDFs
- Product images
- Attachments
- Imported files

Ensure workspace isolation.

Document production object-storage configuration.

### 8.7 Tenant offboarding

Design a safe lifecycle covering:

- Account suspension
- Data export
- Retention requirements
- Credential revocation
- Chatwoot unbinding
- Workspace deletion
- Files and integration data cleanup

Do not implement irreversible deletion without explicit confirmation and test coverage.

### 8.8 Monitoring

Add or document:

- API error rates
- Worker failures
- Database health
- Queue latency
- Reservation expiry lag
- AI spend
- Webhook delivery errors
- Reconciliation failures
- Per-workspace usage

## Acceptance

Critical operational failures can be detected.

Recovery procedures are documented and tested where feasible.

Secrets are not exposed.

Business data retention is intentional.

---

# PHASE 9 — LESSBUSY UX AND NAVIGATION REFINEMENT

## Priority: P2 — PRODUCT EXPERIENCE

## Objective

Apply the independent UX specification without disturbing verified business logic.

LessBusy should be simple, spacious, clean, readable, and pleasant to use.

It must not feel like a dense enterprise CRM.

## Important rule

Do not rebuild all frontend pages from scratch.

Reuse verified existing components and application routes.

Change presentation and interaction patterns incrementally.

## Tasks

### 9.1 Overview

Prioritize:

**What needs my attention today?**

Build a unified attention view backed by real business data:

- Hot leads requiring action
- Unanswered conversations
- Overdue invoices
- Low-stock items
- Overdue tasks

Do not invent urgency or counts.

Unknown values must not display as zero.

### 9.2 Simplify navigation

Prefer:

Workspace:
- Overview
- Messages
- Customers
- Leads & Deals
- Tasks
- Companies when enabled

Business:
- Products
- Inventory
- Sales
- Invoices

Intelligence:
- Automations
- Reports

Platform:
- Settings

Keep AI globally accessible.

Do not duplicate the same action across multiple menu destinations unnecessarily.

### 9.3 Replace unnecessary pages with presets

Evaluate:

- Hot Leads → Leads preset
- Low Stock → Inventory preset
- Unpaid Invoices → Invoices preset

Preserve old URLs through redirects or compatibility routing.

Do not break AI navigation tools or saved links.

### 9.4 Improve customer pages

Provide a unified customer profile containing:

- Contact information
- Related leads
- Deals
- Orders
- Invoices
- Tasks
- Notes
- Messaging references
- Activity

Use clear sections rather than showing every field simultaneously.

### 9.5 Improve business forms

Prioritize common operations:

- Create customer
- Create product
- Adjust stock
- Create quotation
- Create invoice
- Record payment

Use guided forms where helpful.

Show clear consequences before financial and inventory changes.

### 9.6 Improve LessBusy AI panel

Preserve existing working AI integration.

Refine:

- Context indicators
- Suggested questions
- Navigation actions
- Proposal review
- Clear loading states
- Friendly error messages
- Keyboard accessibility

The AI panel must not unexpectedly erase unsaved form data.

### 9.7 Mobile and accessibility

Implement or verify:

- Responsive navigation
- Readable mobile record views
- Keyboard support
- Visible focus indicators
- Proper form labels
- Adequate color contrast
- Reduced-motion support
- Screen-reader-friendly business statuses

### 9.8 Visual direction

Prefer:

- Comfortable spacing
- Readable typography
- Restrained colors
- Consistent components
- Clear hierarchy
- Calm surfaces
- Useful empty states

Avoid:

- Excessive dashboards
- Tiny buttons
- Fake KPI cards
- Decorative charts without business meaning
- Overwhelming settings
- Unnecessary gradients
- Long multi-step flows for simple actions

Preserve configurable advanced functionality where justified.

## Acceptance

Every main page has consistent navigation and interaction patterns.

Ordinary business tasks are easy to locate.

Existing backend behavior remains unchanged unless a demonstrated UX issue requires an API adjustment.

All important actions still work.

---

# PHASE 10 — FULL INTEGRATION AND REGRESSION VERIFICATION

## Priority: RELEASE BLOCKER

## Objective

Verify the complete application in a controlled development or staging environment.

This phase is not optional before production.

## Tasks

### 10.1 Install/synchronize metadata

Verify installation of:

`lessbusy-business`

and all required application metadata.

Check:

- Object definitions
- Roles
- Indexes
- Relations
- Permissions
- App lifecycle
- Schema synchronization

Do not reset databases to work around a failed install.

### 10.2 Build and compile

Run the repository's actual supported commands for:

- Type checking
- Linting
- Frontend build
- Backend build
- Unit tests
- Integration tests

Do not invent command names.

Determine them from package scripts and project documentation.

### 10.3 Functional verification

Test these workflows in a disposable workspace:

```text
Create business workspace
→ Create customer
→ Create product
→ Add stock
→ Create lead
→ Create quotation
→ Create order
→ Reserve stock
→ Fulfill order
→ Create invoice
→ Finalize invoice
→ Record payment
→ Generate PDF
→ View accurate reports
```

Also test a service business that does not track inventory.

### 10.4 Messaging verification

Using controlled test data:

```text
Chatwoot event
→ LessBusy webhook
→ Queue
→ Customer mapping
→ Conversation reference
→ Lead classification
→ CRM update
→ Human escalation
```

Verify loss recovery and duplicate protection.

### 10.5 AI verification

Test:

- AI side panel opens
- Provider is configured
- Authorized data retrieval
- Navigation
- Correct workspace context
- Missing provider
- Quota exceeded
- Injection attempts
- Financial tool restrictions

### 10.6 Two-tenant isolation

Create two distinct disposable businesses.

Each receives different customers, products, conversations, invoices, and credentials.

Ensure neither workspace can access the other's information.

Verify both normal application paths and direct APIs.

### 10.7 Performance

Benchmark representative workloads:

- High message volume
- Concurrent webhook processing
- Concurrent stock reservation
- Invoice creation
- Multiple active workspaces
- AI request concurrency

Use realistic controlled test data.

Record actual throughput, latency, error rate, resource use, and test configuration.

Do not claim the platform supports thousands of businesses solely because tests ran with a few tenants.

### 10.8 Failure recovery

Test:

- Chatwoot outage
- OpenRouter outage
- Redis restart
- Worker restart
- Failed webhook delivery
- Database conflict
- Partial business operation
- Retried transaction

Document any tests that could not safely be performed.

## Acceptance

Critical end-to-end flows succeed.

No known P0 data-integrity defects remain.

Tenant isolation is verified.

Messaging recovery is reliable.

AI permissions are validated.

Builds and relevant tests pass.

Any remaining limitations are explicitly documented.

---

# PHASE 11 — RELEASE READINESS AND UPSTREAM MAINTENANCE

## Priority: RELEASE BLOCKER

## Objective

Prepare LessBusy for a reproducible release without silently introducing licensing, deployment, or upgrade problems.

## Tasks

### 11.1 Git hygiene

Verify:

- All intended changes committed
- No secret files committed
- No accidental generated artifacts
- No unrelated source changes
- Clean or explicitly accounted-for working tree
- Clear commit history

Do not create a release tag until verification is complete.

### 11.2 Reproducible build

Pin relevant source versions.

Build from reviewed source.

Record the Git SHA and image digest.

Do not base production releases on an untracked dirty tree.

### 11.3 Upstream fork maintenance

Document the exact differences from Twenty.

Classify:

- Core modifications
- LessBusy modules
- Shared-library changes
- AI integration hooks
- Branding modifications
- Binary assets
- Application metadata

Identify likely upstream merge conflicts.

Prefer reducing unnecessary fork surface without destabilizing working code.

### 11.4 Licensing review

Document:

- Applicable Twenty AGPL obligations
- Required network-source availability obligations
- Chatwoot Community/Enterprise boundaries
- Third-party dependency licenses
- Attribution requirements
- Commercial deployment limitations

Do not make unsupported legal-compliance claims.

Flag matters requiring qualified legal review.

### 11.5 Configuration validation

Document required and optional environment variables.

Verify no real API keys are embedded in example files.

Test startup with:

- Missing optional AI key
- Missing optional Chatwoot connection
- Valid local database
- Configured integrations

Core CRM should operate when optional integrations are disabled.

### 11.6 Deployment and rollback

Create:

- Setup procedure
- Upgrade procedure
- Database backup procedure
- Migration process
- Health checks
- Rollback limitations
- Recovery runbook
- Smoke tests

Explicitly identify migrations that cannot safely be rolled back without restoring data.

### 11.7 Release gate

Do not mark production-ready unless:

- P0 defects are resolved
- Required security tests pass
- Tenant isolation is verified
- Backups and restore procedures exist
- Critical functional flows work
- License posture has been reviewed
- Secrets are protected
- Deployment is reproducible
- Monitoring and recovery are sufficient for the intended launch

## Acceptance

Produce a final release-readiness report with evidence.

Classify the release as:

- READY
- READY WITH DOCUMENTED LIMITATIONS
- NOT READY

Do not automatically deploy to production.

---

# 4. MASTER ISSUE COVERAGE MATRIX

Use this to ensure nothing is forgotten.

| Reported issue | Assigned phase |
|---|---|
| C1 — Missing reservation-expiry scheduler | 2 |
| C2 — Missing uniqueness constraints | 1 |
| C3 — Shared low-concurrency webhook queue | 5 |
| C4 — Missed-webhook reconciliation | 5 |
| C5 — AI actor authorization | 4 |
| C6 — Uncommitted code/reproducibility | 0, 11 |
| C7 — Instance-wide AI cost controls | 7 |
| C8 — Unlimited integration-event growth | 8 |
| C9 — Credential storage hygiene | 8 |
| C10 — Rate limiting and SSRF controls | 8 |
| C11 — Upstream fork maintenance | 11 |
| CRM/Mini-ERP transaction linkage | 3 |
| Chatwoot identity and handoff lifecycle | 6 |
| OpenRouter privacy and provider behavior | 7 |
| Database backups and recovery | 8 |
| Tenant-scale and isolation verification | 4, 10 |
| Incomplete LessBusy UI polish | 9 |
| App metadata installation/sync | 10, with migration prerequisites verified earlier |
| Runtime tests and verification | Every phase, 10 |
| Licensing and deployment | 11 |

For anything in this table that is already fixed, record the evidence and mark it closed rather than modifying the code again.

---

# 5. FINAL INSTRUCTIONS FOR GLM-5.3 FLASH

You must behave as a cautious implementation engineer.

Do not attempt to solve unrelated phases opportunistically.

Do not create hundreds of unrelated files.

Do not invent framework APIs.

Do not silently bypass failing tests.

Do not skip database verification.

Do not rewrite an entire module because one function is broken.

Do not modify the Chatwoot repository unless the active phase explicitly requires an approved change.

Do not start production services, connect real messaging accounts, or deploy without authorization.

Prefer understandable, conventional code.

If the investigation reveals that a reported issue is inaccurate, document the actual code and explain why no fix is necessary.

If a phase requires a major architecture change beyond its scope, stop and request a decision.

At the end of each phase, provide a clear PASS, PARTIAL, or BLOCKED report.

**Do not proceed to the next phase automatically.**

# START NOW

Execute **PHASE 0 ONLY**:

- Inspect repository state.
- Preserve existing work.
- Verify actual source and branch.
- Map the reported issues.
- Prepare the repair baseline.
- Produce the Phase 0 report.

Then STOP and wait for my next instruction.
