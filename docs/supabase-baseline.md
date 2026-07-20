# Supabase production baseline

## Purpose

PeaceWorks originally had incremental Supabase migrations that assumed several
foundational production tables already existed. Those files could not recreate
a clean database and were not an authoritative description of production.

The July 19, 2026 Phase 2A audit used read-only exports generated manually in
the production Supabase SQL Editor. The audit verified 25 public tables, 252
public columns, 33 check constraints, 43 foreign keys, indexes, RLS state,
public-table policies, grants, two functions, two triggers, and two private
Storage buckets. Follow-up aggregate checks found no identity, assessment, or
relationship-state anomalies. One historical self coach assignment is known.
New self assignments are prohibited, and the compatibility row remains
intentionally unmodified pending an approved data-retirement operation.

[`20260720000000_baseline_production_schema.sql`](../supabase/migrations/20260720000000_baseline_production_schema.sql)
is the repository-side representation of that verified schema. It contains no
production people, emails, notes, answers, assignments, secrets, or
environment-specific administrators.

## What the baseline represents

The baseline includes:

- All 25 verified public tables.
- Verified columns, defaults, nullability, primary and unique constraints.
- All 33 exported checks and 43 foreign keys with current deletion actions.
- Verified non-constraint indexes.
- `handle_new_user_profile()` and its `auth.users` insert trigger.
- `set_profile_updated_at()` and the profile update trigger.
- RLS enabled on every public table.
- Current profile, assessment, waitlist, and service-role policies.
- RLS-with-no-policy state on the six foundational relationship/role tables.
- Broad public-table grants as observed in production.
- Stable role definitions only.
- The private `peaceworks-resources` and `peaceworks-communications` buckets.

Production currently has no policies on `storage.objects`. The baseline
deliberately creates none. Storage remains private and server-mediated.

## Clean development databases

The active migration directory contains the baseline and will contain future
forward-only migrations. A new development or test database should apply the
active migrations in timestamp order.

The SQL has been statically reviewed, but Update 1 did not execute it against a
local database because the Supabase CLI and a local Supabase stack were not
available. A clone or local-stack rehearsal is required before treating clean
reconstruction as verified.

Never point local reset or push commands at production.

## Existing incremental migrations

The nine pre-baseline migrations are preserved under
`supabase/legacy-migrations/`. They document how features were added to the
existing production schema, but they are no longer active reconstruction
migrations.

They must not run after the baseline: they duplicate tables, columns, policies,
indexes, buckets, and role changes already represented by the baseline. Keeping
them outside `supabase/migrations/` prevents a clean database from applying the
baseline and then replaying those changes.

No production migration-history records were changed by this repository
reorganization.

## Production migration-history reconciliation

The baseline must not be executed against the existing production database.
Production already contains the represented objects.

Reconciliation requires a controlled process:

1. Restore or clone production into a disposable environment.
2. Compare the clone metadata with the baseline.
3. Rehearse clean reconstruction separately.
4. Verify that the baseline contains no unapproved difference.
5. Back up production migration-history metadata.
6. Record the baseline version as applied using the approved Supabase
   migration-history repair workflow.
7. Confirm that no baseline DDL executed against production.
8. Apply only later forward migrations through the normal reviewed process.

The exact repair command must be selected and reviewed against the Supabase CLI
version used for the rollout. It must not be improvised in production.

## Current architectural risks

- Auth-user deletion currently cascades to profiles and assessment results,
  while the approved normal removal model is deactivation or anonymization.
- The known historical self coach assignment remains in production and must not
  be altered without an approved repair plan.
- Production migration-history metadata still requires deliberate coordination
  with the repository baseline; application deployment does not perform it.
- Assessment scoring is client-generated and stored without a scoring version.
- `profile_notes.is_private` overlaps with `visibility`.
- Admin authorization is transitioning from an email allowlist to the database
  admin role.
- The public waitlist lacks the approved validation, duplicate prevention,
  rate limiting, and abuse protection.
- Broad table grants rely on RLS as the effective row boundary.
- Storage has no object policies and must remain server-mediated.

These are faithfully preserved in the baseline. They require separately
reviewed forward migrations and application updates.

## Forward migration status

The active migrations after the baseline now record:

1. Relationship integrity, canonical `circle_coaches`, and optional primary
   direct-coach support.
2. The `content_items` registry and canonical content-assignment cutover.
3. Monthly Question reflections and assignment-specific period metadata.
4. Member-visible notes.
5. Secure portal messaging and its production reconciliation.

Remaining architecture work requires separately reviewed updates, including
generated database types and drift checking, safe retirement of the historical
self assignment, server-side assessment scoring/versioning, database-role Admin
authority, profile-note visibility cleanup, waitlist protection, identity
erasure workflows, and grants/Storage-policy hardening.

## Database type generation

Exact Supabase-generated TypeScript types cannot be safely fabricated from the
metadata exports. The exports do not encode all information in the generator's
output format, and the baseline has not yet been executed against a clean local
database.

After the production project reference and CLI version are approved, generate
the authoritative file with:

```sh
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public > lib/database.types.ts
```

Alternatively, after a clean local reconstruction:

```sh
npx supabase gen types typescript --local --schema public > lib/database.types.ts
```

Review the generated diff and add a CI regeneration/drift check before
replacing application imports.

Current handwritten database row interfaces are concentrated in:

- `lib/admin/authorization.ts`
- `lib/admin/assessmentQueries.ts`
- `lib/admin/userManagement.ts`
- `lib/admin/memberProfile.ts`
- `lib/admin/contentStudio.ts`
- `lib/coach/dashboard.ts`
- `lib/coach/monthlyQuestions.ts`
- `lib/coach/resources.ts`
- `app/peace-assessment/page.tsx`
- `app/assessments/page.tsx`
- `components/dashboard/MyDashboard.tsx`

The baseline update intentionally did not replace those interfaces. Generated
database types remain required future work.

## Drift auditing

[`production_preflight.sql`](../supabase/audit/production_preflight.sql)
contains read-only aggregate and metadata checks. It exposes no private row
bodies. The known historical self-assignment is documented as an expected
compatibility exception pending an approved retirement plan.
