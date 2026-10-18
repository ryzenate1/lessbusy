# CRM data model

Preserve `person`, `company`, `opportunity`, `task`, `note`, task/note target relationships and workspace members. See `packages/twenty-server/src/modules/*/standard-objects/` for current entities.

Display customer terminology in LessBusy shortcuts without changing person table/API identifiers. Relationships, soft deletion and import/export continue through metadata-driven record APIs. Existing custom labels and views must remain usable.

Lead qualification requires a separately designed entity or explicit opportunity/contact fields. Keep temperature (cold/warm/hot), priority (low/normal/high/critical), conversation handling and sales stage independent. Record source, classifier version, confidence, override actor and timestamp. Never infer that an opportunity marked open is hot.

Before M2 migration: define person↔lead↔opportunity cardinality and conversion history; verify task status values against workspace metadata. Add two-workspace CRUD/relationship tests and field-permission coverage before declaring CRM transformation complete.

Migrations created in M1: none. No existing CRM records modified by implementation.

## Native customer/task extensions and operational ledgers

Native Person now has optional LessBusy source, tags, billing name/address/tax identifiers, Instagram/WhatsApp identity, assigned workspace member, archived timestamp and import-operation hash. Archiving is a reversible directory state; it does not delete the Person or disconnect sales/history. CSV imports use the requested operation UUID as the Person ID and store a normalized request hash. Duplicate warnings inspect readable email/social identities and do not promise global uniqueness. Bulk operations compare native updatedAt before transactional updates.

Native Task retains its assignee, body, status, due date, targets and activity. Added LessBusy fields provide priority, proposal operation hash, reminder timestamp and acknowledgement timestamp. Reminder queries require the current workspace member as assignee; acknowledge/snooze rechecks ownership and updatedAt on the server. Completion/reopening retains native activity rather than creating a second task store.

Native Opportunity remains the deal source. Lead conversion stores a separate convertedOpportunityId on the lead; pipeline updates compare native updatedAt. Customer/deal links on sales documents and follow-up targets remain explicit.

The provider-contact identity object maps a verified connection/contact pair to an existing native Person. Conversation creation/linking uses one transaction and protects contact/reference versions. Sanitized integration-attempt history lives in workspace-scoped existing core key/value storage and contains event digests, statuses and timestamps only.

These are additive source definitions, not applied schema changes.
