# Circle and coaching relationship verification

Phase 2B Update 2 has no automated test runner in the repository. Use this
matrix against a disposable local Supabase stack or approved staging clone
after applying the baseline and relationship-integrity migration.

Do not perform these checks against production member accounts.

## Prerequisites

- Create synthetic active profiles with member, `circle_member`, coach and
  admin roles.
- Create at least two active Circles.
- Keep Circle memberships, Circle coaches and direct coach assignments as
  separate fixtures.
- Run `supabase/audit/production_preflight.sql` before and after the matrix.

## Authorization matrix

| Case | Fixture | Expected result |
|---|---|---|
| Active Circle coach | Coach has an active `circle_coaches` row; member has an active membership in that Circle | Coach can see the Circle, member, assessment, coach-visible notes, resources and Monthly Question tools |
| Unrelated coach | Coach has no direct assignment and coaches no Circle containing the member | Member detail and assessment routes return not found; unrelated Circle tools are unavailable |
| Direct coach | Active direct assignment exists without a shared Circle | Coach can open member detail, assessment and assigned-coach notes; no unrelated Circle tools are granted |
| Ended Circle coach | `circle_coaches.status = completed` with `ended_at` set | Circle and its members are not authorized through that row |
| Ended direct assignment | `coach_assignments.status = completed` with `ended_at` set | Member is not authorized through that row |
| Member-only relationship | Coach-role profile has only `circle_memberships` | Profile is a Circle participant, not a Circle coach |
| Circle coach without membership | Coach has `circle_coaches` but no membership in the Circle | Coach access works and the coach is not added to the member roster |
| Admin override | Authorized admin has no coaching relationships | Admin can use protected coach tools as before |
| Multiple Circle coaches | Two active `circle_coaches` rows exist for one Circle | Both coaches are shown and independently authorized |
| Multiple direct coaches | Two active direct assignments exist for one member | Both coaches are shown and independently authorized |

## Mutation matrix

| Case | Action | Expected result |
|---|---|---|
| Add Circle coach | Select an active coach in Admin Circle Management | New active `circle_coaches` row; no membership or self-assignment created |
| End Circle coach | Deselect a current Circle coach | Existing row becomes `completed` with `ended_at`; history remains |
| Add direct coach | Assign a coach in Admin user management | New active `coach_assignments` row with `is_primary = false` unless explicitly selected |
| Set first primary | Choose one active assigned coach as primary | That assignment becomes primary |
| Clear primary | Select “No primary coach” | Existing assignment remains active and becomes non-primary |
| Replace primary directly | Choose a different primary without first clearing | Request is rejected with a clear conflict |
| Multiple primary race | Attempt concurrent primary writes for one member | Partial unique index permits only one active primary |
| New self-assignment | Attempt to assign a profile as its own direct coach | Application rejects it; database constraint also rejects it |
| Known compatibility row | Save unrelated data for the profile holding the known self-assignment | Row remains hidden from direct-coach behavior and untouched; attempts to submit a new self-assignment are rejected |
| Deactivate coach | Deactivate a coach with active Circle and non-self direct relationships | Managed relationships become inactive with `ended_at`; historical rows remain and the compatibility self-assignment stays untouched |

## Regression checks

- Admin Circle counts and coach names come from `circle_coaches`.
- Circle member counts come only from `circle_memberships`.
- Direct member coach counts come only from `coach_assignments`.
- No application search result contains the former Circle-coach inference
  helper or self-assignment diagnostic.
- Member Circle access still requires an active membership with no end time.
- Lint, production build and `git diff --check` pass.
