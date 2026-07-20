# PeaceWorks Portal

PeaceWorks is a Next.js App Router application containing the public website and
the authenticated member, Circle, Coach, Admin, assessment, content, and secure
messaging experiences.

## Local development

Copy `.env.example` to `.env.local` and provide the documented local values.
Never commit `.env.local` or service-role credentials.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

Run these checks before committing:

```bash
npm run lint
npm run build
git diff --check
```

There is currently no configured automated test command. Database behavior
should be rehearsed against a disposable local Supabase project or approved
staging clone, never production member data.

## Repository guidance

- [`docs/repository-map.md`](docs/repository-map.md) explains feature ownership,
  route organization, server/client boundaries, and where new code belongs.
- [`supabase/README.md`](supabase/README.md) explains active migrations, legacy
  migrations, audits, and production safety rules.
- [`docs/supabase-baseline.md`](docs/supabase-baseline.md) documents the verified
  production baseline and its special handling requirements.

Production deploys are triggered from `main` through Vercel. Schema changes are
reviewed and applied separately; deploying application code must not be assumed
to apply Supabase migrations automatically.
