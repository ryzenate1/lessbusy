# Transformation architecture

## Decisions
1. Extend Twenty in place. One workspace is one LessBusy business tenant; use existing authenticated membership and repositories.
2. Add read-only overview and workflow navigation first; preserve stored navigation, generic CRUD, custom fields, saved views, workflows and admin tools.
3. Introduce no schema migrations during design foundation. All later standard-object changes use the current-version migration pipeline, with up/down and backfill review.
4. Retain React, NestJS, PostgreSQL, Redis, Linaria and Lingui. No additional framework or microservice is needed.
5. Reuse existing AI side panel, SDK factory and tool registry; establish narrower business tools and confirmation flow before financial writes.
6. Separate business invoices from platform subscription entitlements. Do not merge identity models from the sibling SaaS application without an explicit membership contract.
7. Chatwoot owns conversation content; LessBusy owns CRM/business records and stores external references.

## Reversible rollout
Use `feature/lessbusy-transformation`, retaining pre-existing dirty branding work. First verify the source frontend against matching source services on isolated ports and a disposable database. Do not run a newer server against existing data until migration compatibility and backups are verified. The currently running image is not the checkout: replacing it can trigger migrations.

Source feature rollback: remove overview route, shortcuts and assistant entry; no business data rollback is required for M1. Later migration rollback must be reviewed separately.

## Risks and gates
- Release/source skew: v2.48.0 container versus checkout. A successful HTTP request is not proof of compatibility.
- AGPL / commercial source: preserve notices and exclude Enterprise-only features absent rights.
- Unknown permissions: new shortcuts fail closed until explicit read permission is available; server remains authoritative.
- Currency/tax and stock operations: need transactional tests before exposing writes.
- Provider credentials, Chatwoot ingress and tenant caches: need isolation tests before activation.
- No production deployment is authorized. No destructive reset is part of this plan.
