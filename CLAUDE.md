# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

No test suite is configured.

## Architecture

**TaraCSE** is a Next.js 16 full-stack web application for Filipino Civil Service Exam (CSE) preparation — gamified review with practice questions, mock exams, progress tracking, and AI explanations.

### App Router structure

```
app/
  (auth)/          # Login/register pages (shared layout)
  admin/           # Admin dashboard (questions, users, verifications)
  api/admin/       # API routes — currently only CSV question ingest
  dashboard/       # Authenticated user area
    analytics/     # Performance tracking
    practice/      # Untimed practice sessions
    mock/          # Timed mock exams
    exams/         # Exam management
    achievements/  # Badges
    leaderboard/   # Competitive rankings
    settings/      # User settings
```

### Key directories

- `lib/supabase/` — Three Supabase client variants: `client.ts` (browser), `server.ts` (server components/actions), `admin.ts` (service role, bypasses RLS — admin only)
- `lib/admin-auth.ts` — Admin status verification via cookies + DB lookup
- `components/ui/` — ShadCN/Radix UI primitives
- `services/ai/gemini.ts` — Google Gemini AI integration (explanations)
- `hooks/` — Custom React hooks

### Supabase pattern

Server components use `lib/supabase/server.ts`. Admin API routes use `lib/supabase/admin.ts` (service role key — never expose to client). Auth state is managed via Supabase cookies.

### Admin question ingest

`app/api/admin/ingest/route.ts` accepts tab-separated CSV uploads (5MB limit). Fields: `level` (Professional/Subprofessional), `category` (Verbal Ability, Numerical Ability, Analytical Ability, General Information, Clerical Operations), `difficulty`, `question`, options A–D, `correct_answer`, `explanation`. The route strips HTML tags for XSS protection and checks for duplicates before inserting.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Supabase anon key (client-safe)
SUPABASE_SERVICE_ROLE_KEY        # Service role key (server/admin only)
ADMIN_API_SECRET                 # Admin API authentication secret
```

### Tech stack

- **UI**: React 19, Tailwind CSS 4, ShadCN UI (radix-nova style), Framer Motion, Lucide icons
- **Math**: KaTeX / react-katex for rendered math in questions
- **Backend**: Supabase (auth, database, realtime)
- **Validation**: Zod
- **TypeScript**: Strict mode, path alias `@/*` maps to project root
