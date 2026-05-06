# Briefed — Real-time Design Collaboration Platform

A full-stack collaboration workspace where Brands and Designers work
together on design projects. Built as a portfolio project to demonstrate
production-quality Next.js + Supabase + AI integration.

## Live demo

https://collaboration-workspace.vercel.app/

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Brand (Sofia) | sofia@briefed.app | demo1234 |
| Brand (Carlos) | carlos@briefed.app | demo1234 |
| Designer (Alex) | alex@briefed.app | demo1234 |

## Features

- Role-based workspace: Brand and Designer see genuinely different interfaces
- Real-time chat: Supabase Realtime with postgres_changes, no polling
- AI assistant: server-side Claude integration (Anthropic API), role-specific prompts
- Row Level Security: data isolation enforced at the database level
- Optimistic updates: messages appear instantly, synced via Realtime
- Role switcher: instant context switch between Brand and Designer perspectives

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres, Auth, Realtime, RLS)
- TanStack Query v5
- Vercel AI SDK + Anthropic Claude
- Tailwind CSS

## Architecture highlights

- Uses `key={requestId}` on project-scoped panels so chat subscriptions, AI state, and scroll position are fully reset when switching between design requests.
- Uses `.maybeSingle()` for workspace reads because RLS can legitimately return zero rows; inaccessible or missing requests become a graceful empty state instead of a thrown query error.
- Keeps AI execution server-side and verifies access twice: first with the authenticated Supabase user, then with RLS-scoped reads for the profile and design request before building the Claude prompt.
- Uses Supabase's dual foreign-key join pattern (`profiles!brand_id` and `profiles!assigned_designer_id`) to fetch both Brand and Designer profile data from the same `profiles` table without ambiguous relationship errors.

## Local setup

1. Clone the repo
2. Create a Supabase project and copy credentials to `.env.local`
3. Run `supabase/seed.sql` in the Supabase SQL Editor
4. Create the 3 demo users in Supabase Dashboard -> Authentication -> Users
5. Run `npm install && npm run dev`

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```