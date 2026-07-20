# PeaceWorks repository map

## Application structure

| Location | Ownership |
|---|---|
| `app/` | Next.js App Router pages, route-level states, and API handlers |
| `components/layout/` | Shared header, footer, navigation, and Messages control |
| `components/ui/` | Reusable product-wide interface primitives |
| `components/admin/` | Admin dashboard and member-management interfaces |
| `components/coach/` | Coach dashboard interfaces |
| `components/dashboard/` | Member dashboard and member content details |
| `components/messages/` | Secure inbox, conversations, and composer |
| `components/assessment/` | Assessment results and reports |
| `components/public/` | Public marketing, join, and ROI interfaces |
| `lib/<feature>/` | Server services, authorization, validation, and feature types |
| `hooks/` | Reusable browser hooks |
| `data/` | Static assessment and report content |
| `public/` | Version-controlled static assets and service worker |
| `supabase/` | Migrations, historical migrations, audits, and database guidance |
| `docs/` | Architecture, operations, verification, and planned work |

The existing feature-oriented `components/` and `lib/` directories are the
preferred organization. Avoid broad moves that obscure Git history without
improving ownership.

## Routes and APIs

Public pages include Home, About, Join, ROI Calculator, and authentication.
Authenticated destinations include Account, Settings, My Dashboard, Circle,
Coach, Admin, Assessments, Project, and Messages. Route paths are public
contracts and should not change during internal organization work.

API handlers are grouped by audience or feature under `app/api/`:

- `admin/`: Admin analytics, people, Circles, users, and content operations.
- `coach/`: relationship-scoped Coach operations.
- `member/` and `dashboard/`: member content and reflections.
- `messages/`: conversations, participants, replies, and unread state.
- `circle/` and `project/`: feature-specific authenticated payloads.
- `health/`: non-sensitive application health checks.

## Server and client boundaries

Client components declare `"use client"` and may use the publishable Supabase
client from `lib/supabase.ts`. They must never access
`SUPABASE_SERVICE_ROLE_KEY` or import a server service as a runtime dependency.

Server modules live primarily under `lib/admin/`, `lib/coach/`, `lib/circle/`,
`lib/member/`, `lib/messaging/`, `lib/content/`, and `lib/project/`. API routes
authenticate the request and call these services. The service-role client is
created only on the server through the Admin authorization module.

Client components may use `import type` from a feature service because those
imports are erased from the browser bundle. If a shared type creates an unclear
boundary, move the type—not the server implementation—to a focused feature type
module.

## Authentication and authorization

- Browser sessions provide bearer tokens to protected APIs.
- APIs resolve the authenticated user and profile server-side.
- Admin access uses database profile state plus the transitional email allowlist.
- Coach, Circle, member, assignment, note, and messaging access is checked from
  active relationships on the server.
- Browser-supplied sender identity, roles, or unrestricted recipient lists are
  never authoritative.

Authorization helpers should remain feature-focused: similar function shapes do
not mean Admin, Coach, Circle, and member relationship rules are interchangeable.

## Where should this code go?

- Route or endpoint: `app/<route>/` or `app/api/<audience>/<feature>/`.
- Interactive feature UI: `components/<feature>/PascalCase.tsx`.
- Reusable visual primitive: `components/ui/`.
- Navigation or page chrome: `components/layout/`.
- Server authorization or data access: `lib/<feature>/`.
- Browser-only reusable behavior: `hooks/` or a clearly named client utility.
- Static editorial data: `data/`.
- Database change: reviewed forward migration in `supabase/migrations/`.
- Production metadata check: `supabase/audit/`.
- Architecture or operational guidance: `docs/`.

Keep feature-specific types near their service or component. Create a shared
type module only when independent features genuinely own the same contract.

## Styling

Application styling is in `app/globals.css`; public ROI styles use a colocated
CSS module. Reuse existing product classes before introducing a new one. Remove
selectors together with their final consumer and preserve responsive and
reduced-motion behavior.

## Deployment and validation

```bash
npm run lint
npm run build
git diff --check
```

There is no configured automated test script. Pushes to `main` trigger Vercel.
Supabase migrations are reviewed separately and are never assumed to run as
part of a Vercel deployment.

## Known cleanup candidates

`peaceworks-admin-files.zip` and `peaceworks-backend-files.zip` are tracked July
13, 2026 source snapshots that duplicate files now held in Git. They should be
removed only with explicit approval because they may have external archival
value.
