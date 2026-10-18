# Chatwoot integration (proposed)

Sibling source: `../chatwoot`, https://github.com/chatwoot/chatwoot. Local application runs on port 3003. It is separate from Twenty; no mapping is presumed.

Create tenant-owned encrypted connection settings, a unique account binding, allowed inbox IDs, contact identity references, conversation IDs, health and last-error fields. Map external account/inbox → authenticated workspace on ingress; never trust payload tenant IDs. Chatwoot remains the message source of truth; fetch authorized conversation content on demand.

Verify the supported signing mechanism against the exact installed Chatwoot version before exposing ingress. If signed delivery is unavailable, use an authenticated integration gateway with replay protection; do not claim signatures exist based on assumptions. Bound raw body size, reject invalid origin/auth, deduplicate by account/event/message ID, persist event receipt then enqueue processing with explicit workspace context. Redact credentials/message bodies in logs.

Classification stores intent, product interest, quantity, budget if stated, urgency, readiness, follow-up, recommended action and confidence. Deterministic rules first; bounded model escalation; uncertain/sensitive cases need human handling. Temperature, handling state and priority are independent.

Messages page must show a setup state until configured. No real Meta connections or outbound customer messages are authorized during local development. Adapter and webhook tests are pending; no integration implemented in M1.

## Expanded integration source — 18 October 2026

Workspace administrators with existing APPLICATIONS permission can save one account/inbox binding through `/integrations`. Credentials are version-encrypted in existing core key/value storage with workspace-bound authenticated encryption; read responses expose only credential-presence booleans. Server environment configuration overrides workspace settings, including a disabled binding. Global opaque-ID and account claims prevent conflicting workspace bindings. Outbound calls use the existing SSRF-safe HTTP client, bounded responses, no redirects and a 15-second timeout.

Provider-contact identity records support explicit reuse across future conversations. The user may atomically create a native customer from an unlinked conversation and optionally remember the provider contact; customer identity, reference version and contact mapping are checked in the same transaction. Existing conversation links are retained when a mapping changes.

Conversation references track actual latest-public-message time/ID, reply status and handling state separately. Classification uses monotonic incoming IDs, protects human lead qualification and records classification history. Deterministic rules include English and common Hindi/Hinglish buying phrases/negations; they are not general multilingual understanding. Sensitive/uncertain messages require a person. No autonomous reply or outbound composer is implemented.

An admin-only recent-attempt view now displays the last twenty sanitized success/failure outcomes plus last-success/last-failure times. Worker-only writes verify the installed application and connection binding; payloads, message text, secrets and raw provider errors are excluded. Fuller recovery UI and a configurable provider-assisted classification fallback remain open. Neither Meta accounts nor real messaging credentials were connected during this source-only pass.
