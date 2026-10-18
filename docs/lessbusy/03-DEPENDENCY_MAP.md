# Dependency map

- `createWorkspaceRouteObjects.tsx` → lazy record pages → object metadata → GraphQL core client → workspace query runner → workspace repositories → PostgreSQL.
- Navigation drawer → navigation-menu-item metadata, favorites and object permissions. Keep user-created/custom-object destinations.
- `PageHeader.tsx` → side panel hook → existing chat session/history; opening chat does not replace the main route.
- Overview → object metadata and `useObjectPermissions` → `useAggregateRecords` / `useFindManyRecords` → authenticated Apollo core client. Unknown/denied objects must not mount query components.
- AI UI → server chat/execution modules → tool registry → permission-aware repositories. Model output is untrusted input, not an access grant.
- Workers → message-queue → explicit workspace context; queue payloads are not trusted membership proof.
- Inventory, invoicing and integration objects → existing metadata and workspace migration engine. Register standard objects and permissions together; do not add an unrelated database.
- Shared package dist must be rebuilt after branch switches before interpreting frontend type errors (`AGENTS.md`).
- Runtime dependencies: PostgreSQL + Redis; storage must retain workspace permissions. Chatwoot and SaaS starter remain separate services with explicit adapters.

Source anchors: audit 01 records the concrete paths. Removal review must include object relations, workflows, views, roles, files, AI tools, external API contracts and migrations.
