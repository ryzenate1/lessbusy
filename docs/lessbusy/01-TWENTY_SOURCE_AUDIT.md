# Twenty source audit

Audit date: 18 October 2026. Findings below are source inspection, not a passing security certification.

## Provenance and existing work
- Repository: `/Users/riyaz/lessbusy/business-automation/sources/twenty-crm`.
- Remote: https://github.com/twentyhq/twenty.git.
- Base commit: `289976eaeeb78fda1b85ff9f3c92fa6ab6f93eb6`.
- Original branch: `feature/lessbusy-rebrand`; transformation branch: `feature/lessbusy-transformation`.
- Working tree was already dirty: branding, icons, emails, legal-link helpers, titles, server configuration and related tests. All retained; no bulk replacement or reset.
- Port 3002 responds HTTP 200. Docker reports `twentycrm/twenty:v2.48.0` for server and worker. Local compose now declares a source build, but the running container has not been replaced. Source and running release must not be assumed equivalent.
- Host source dependencies were absent at audit start.

## Source map
All paths below are relative to this repository.

| Area | Verified implementation | Findings / limits |
|---|---|---|
| Frontend | `packages/twenty-front/package.json`, `src/modules/app/routing/utils/createWorkspaceRouteObjects.tsx` | React 19 (older overview docs say 18), Vite, Linaria, Lingui, Jotai, Apollo; lazy workspace routes shared with side panel |
| Record lists | `packages/twenty-front/src/pages/object-record/RecordIndexPage.tsx`, `src/modules/object-record/record-index/` | Metadata-driven views, sorting, filters and inline interaction; preserve generic engine |
| Record detail | `packages/twenty-front/src/pages/object-record/RecordShowPage.tsx`, `src/modules/page-layout/` | Relationship/detail widgets remain useful |
| Companies | `packages/twenty-server/src/modules/company/standard-objects/company.workspace-entity.ts` | Existing workspace entity, preserve associations; import/export lives in shared record features |
| People | `packages/twenty-server/src/modules/person/standard-objects/person.workspace-entity.ts` | Contacts remain person records; customer terminology must not rename tables |
| Opportunities | `packages/twenty-server/src/modules/opportunity/standard-objects/opportunity.workspace-entity.ts` | Existing deals and stages; do not infer lead temperature from stages |
| Tasks | `packages/twenty-server/src/modules/task/standard-objects/task.workspace-entity.ts` | Title, due date, status, associations; status options require metadata awareness |
| Notes | `packages/twenty-server/src/modules/note/standard-objects/note.workspace-entity.ts`, `note-target.workspace-entity.ts` | Preserve rich content and target relations |
| Dashboards | `packages/twenty-server/src/modules/dashboard/`, `packages/twenty-front/src/modules/page-layout/widgets/` | Existing dashboard lifecycle hooks and graph widgets; reports stay available |
| Workflows | `packages/twenty-server/src/modules/workflow/`, `packages/twenty-front/src/pages/object-core/WorkflowCoreShowPage.tsx` | Keep triggers, runs, actions and history; individual execution paths not exhaustively verified |
| Views | `packages/twenty-front/src/modules/views/`, `src/modules/object-record/record-table/`, `src/modules/object-record/record-board/` | Preserve table and board engines and saved views; calendar availability varies with metadata |
| Settings | `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`, `src/modules/settings/roles/` | Existing roles and settings; expose advanced tools progressively |
| Navigation | `packages/twenty-front/src/modules/navigation/components/`, `src/modules/navigation-menu-item/` | Existing workspace-configurable menus and favorites; do not replace stored menus |
| Authentication | `packages/twenty-server/src/engine/core-modules/auth/utils/build-workspace-auth-context-from-request.util.ts` | Auth context constructed from user membership, API key or application; unauthenticated requests throw |
| Tenancy / ORM | `packages/twenty-server/src/engine/twenty-orm/workspace-orm.manager.ts`, `repository/workspace-repository.ts` | Context carries workspace; permission-aware repository helper and workspace transactions already exist |
| Background work | `packages/twenty-server/src/engine/core-modules/message-queue/` | Existing queue infrastructure; extend instead of adding a service |
| AI providers | `packages/twenty-server/src/engine/metadata-modules/ai/ai-models/services/sdk-provider-factory.service.ts`, `provider-config.service.ts` | Multiple SDK adapters including OpenAI-compatible; custom provider catalog already exists |
| AI tools | `packages/twenty-server/src/engine/core-modules/tool-provider/services/tool-registry.service.ts` | Tool descriptors filtered by provider availability; execution and authorization need per-tool tests |
| AI UI | `packages/twenty-front/src/modules/side-panel/hooks/useOpenAskAiPageInSidePanel.ts`, `src/modules/ai/` | Persistent chat history, streaming machinery, missing-key banner already exist |
| AI usage | `packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/services/ai-chat-usage.service.ts` | Existing accounting foundation; OpenRouter cost reconciliation still to verify |
| Containers | `packages/twenty-docker/twenty/Dockerfile` | Multi-stage targets include frontend+server and all-in-one dev; select a target explicitly |
| SaaS shell | sibling `../nextjs-saas-starter` | Separate application; membership/subscription integration is not established by co-location |
| Chatwoot | sibling `../chatwoot` | Independent Rails/Vue application running on 3003; no verified tenant mapping into Twenty |

## Licensing boundary
`LICENSE` states AGPL with an application exception, separately MIT packages and Enterprise-marked commercial files. Preserve notices and source obligations. No enterprise code is added or copied in this milestone. Commercial distribution terms require separate review; this audit is not legal advice.

## Unverified areas
Full CRUD round trips, row/field permission intersections, tenant-isolation integration tests, background job scope, all workflow actions and release/source compatibility remain validation work. No new ERP schema has been installed. No production data has been modified.
