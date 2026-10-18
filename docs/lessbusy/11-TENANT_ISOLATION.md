# Tenant isolation

Existing boundary: workspace auth context from authenticated user membership/API/application; workspace ORM loads metadata/permissions. `getRepositoryWithContextPermissions` resolves role intersection and rejects missing permission configuration. Workspace transactions use the same context. Source anchors are in audit 01.

New frontend workflow shortcuts require explicit read permission and active metadata before rendering/querying. This is presentation, not backend authorization. Existing routes retain backend enforcement. No browser-supplied workspace selector may grant access.

Every new domain service, AI tool and job must derive workspace and actor from authenticated context, use permission-aware repositories, and scope external bindings/cache keys/uploads accordingly. Do not use raw unrestricted repositories merely because a UI control was hidden.

Required tests before M6 acceptance: independent workspace A/B fixtures; read/write denial using A credentials and B IDs; relation connect denial; unauthorized workspace selection; AI tools and job context; upload/download; cache invalidation; invoice/stock transactions and external event deduplication. Existing tests in `packages/twenty-server/src/engine/twenty-orm/__tests__/` are a starting point, not proof that all new features are isolated.

Isolation integration suite has not yet been run for this transformation. No claim of completed production hardening.

## Additional source boundaries — 18 October 2026

- Every LessBusy mutation request includes `x-lessbusy-workspace-id`; the workspace guard compares it with authenticated workspace context. PDF GET navigation may omit the header. The header cannot choose a workspace.
- Frontend requests are bound to both workspace ID and native session generation. Stale import loops cannot start subsequent requests after an identity/workspace switch, and stale responses cannot drive business navigation.
- Customer bulk edits are transactional with per-record modification checks. Customer imports are per-row idempotent, scoped to native Person repositories and duplicate checks within permitted records only.
- Stock transfers verify both readable balances refer to the same product option, different active locations, unreserved units and matching versions, and commit both movements/receipt together.
- Task reminders only return the authenticated assignee's records; acknowledge/snooze rechecks ownership on the server.
- Chatwoot workers require the exact installed LessBusy application universal identifier. Connection/identity/account bindings are revalidated; encrypted credentials are never returned to the browser.
- AI search/product/stock tools use native effective select permissions, bounded retrieval and authenticated workspace matching. No tool performs financial or stock mutation.

These are implementation boundaries awaiting the deferred multi-tenant and concurrency verification pass, not assertions of passing tests.
