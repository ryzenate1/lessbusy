# LessBusy business metadata

Installs business objects into existing Twenty workspaces. Source definitions are not installed by editing this folder. Apply with the matching Twenty CLI when runtime work resumes. Do not use these financial or inventory objects without the LessBusy server domain module: it rejects generic mutations and supplies validated, transaction-safe actions. Installation and verification are deliberately deferred. No database or live workspace has been changed.

Quantities are whole base units; money is stored as minor-unit integer strings. Variants support arbitrary attribute JSON. Customer identity is verified by the server and captured in invoice snapshots. Roles are available for explicit assignment; installation never grants every user a business role.
