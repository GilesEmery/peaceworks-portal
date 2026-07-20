# Supabase repository policy

This directory contains schema history and read-only audit tooling. It contains
no production row exports.

## Directories

- `migrations/`: active reconstruction and forward-only migrations, applied in
  filename order to a clean development or test database.
- `legacy-migrations/`: pre-baseline history retained for reference. These files
  must not be replayed after the production baseline.
- `audit/`: read-only metadata and aggregate integrity checks.

Never rename, reorder, or delete an applied migration. Never point reset,
reconstruction, or experimental commands at production.

## Baseline

`20260720000000_baseline_production_schema.sql` describes the verified production
schema for clean reconstruction. It is not intended to run against the existing
production project. See [`docs/supabase-baseline.md`](../docs/supabase-baseline.md).

## Messaging migrations

`20260720000008_add_portal_messaging.sql` is the canonical fresh-database
definition for conversations, participants, messages, constraints, indexes, and
service-role-only policies.

`20260720000009_reconcile_portal_messaging.sql` records the safe forward
reconciliation from the earlier messaging shape to conversation-level Topics
and retry keys. It preserves data, does not recreate messaging tables, and is
safe when the final schema is already present.

The required production messaging reconciliation was applied manually and
verified on July 20, 2026. Do not rerun the original messaging `CREATE TABLE`
migration or the completed reconciliation SQL against production.

## Adding a schema change

1. Confirm current production and repository schema assumptions.
2. Add one timestamped, forward-only migration; do not rewrite applied history.
3. Preserve data and authorization behavior unless explicitly approved.
4. Add or update read-only preflight checks when risk warrants it.
5. Run lint, build, and `git diff --check`.
6. Rehearse against a disposable local Supabase stack or approved staging clone.
7. Provide manual SQL only when production action is genuinely required.

Application deployment and database deployment are separate. A Vercel Ready
status does not prove a migration was applied.
