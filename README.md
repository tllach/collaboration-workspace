# Design Collaboration Workspace

A real-time design collaboration platform where brands submit creative briefs and designers execute them, with an AI assistant that adapts to each role.

## Live demo

**https://collaboration-workspace.vercel.app/**

> The live deployment is the recommended way to evaluate this project. All seeded accounts, Supabase, and the AI assistant work out of the box — no local setup required.


## Test accounts (seeded)

| Role     | Email                | Password    | Name           |
| -------- | -------------------- | ----------- | -------------- |
| Brand    | brand1@grayola.io    | grayola123  | Sofia Ramirez  |
| Brand    | brand2@grayola.io    | grayola123  | Carlos Mendez  |
| Designer | designer@grayola.io  | grayola123  | Alex Torres    |

**Active projects:** 
"Rebranding Cafe Nomada" — Sofia (brand) paired with Alex (designer), status `in_progress`
"App Launch Campaign — Flowr" — Carlos (brand) paired with Alex (designer), status `in_progress`
**Available project:** 
"Flyer to launch new product" - Carlos (brand), no designer assigment yet.

Use the **role switcher** in the top bar to instantly switch between accounts and see how the interface adapts.

## What's built

### Workspace structure

Route: `/workspace/[userId]/[requestId]`

The workspace is a 3-panel layout:

- **Left panel (280px):** Brief details — project title, status chip, deadline, full brief text, deliverable type, reference links, and role-specific context (brand sees their designer assignment or a "waiting for designer" card; designer sees assignment status and a "Mark as completed" action)
- **Center panel:** Real-time chat between Brand and Designer
- **Right panel (320px):** AI assistant with role-specific behavior

A collapsible sidebar on the left lists all projects for the signed-in user.

### Role switch and theming

The role switcher signs in as a different seeded account and swaps the entire UI instantly. Each role has a distinct visual identity applied via CSS custom properties on `<html data-role>`:

- **Brand:** Light mode, warm palette — white background (`#ffffff`), orange accent (`#ea580c`), cream surfaces (`#fff7ed`, `#ffedd5`), slate muted text (`#64748b`)
- **Designer:** Dark mode, cool palette — deep navy background (`#071a22`), cyan accent (`#06b6d4`), dark teal surfaces (`#0c2430`, `#0f2f3f`), soft cyan muted text (`#7eb8c4`)

Every component — status chips, scrollbars, borders, skeleton loaders, hover states — adapts to the active role's token set without any conditional className logic in components.

### Real-time chat

- Supabase Realtime with `postgres_changes` subscription filtered by `request_id`
- Messages persist in Postgres and appear instantly across tabs/sessions without refresh
- Optimistic updates: the message appears in the sender's UI immediately before the server confirms
- TanStack Query manages cache invalidation and background refetching

### AI features

All AI processing is server-side only. The `ANTHROPIC_API_KEY` is never exposed to the client (no `NEXT_PUBLIC_` prefix).

**Route:** `POST /api/ai/assist` — streaming via Vercel AI SDK v6

Every request:
1. Validates the Supabase session (`getUser()`)
2. Enforces a rate limit (50 messages/hour per user)
3. Fetches the user's profile and the design request via RLS-scoped queries
4. Builds a role-specific system prompt with full project context (title, brief, status, deadline, deliverable type)
5. Streams the response using `claude-sonnet-4-20250514`

**Brand assistant** ("Brief coach"):
- Quick actions: Improve brief, Draft feedback, Summarize
- Helps brands articulate clear feedback and improve their creative brief

**Designer assistant** ("Creative director"):
- Quick actions: Creative directions, Moodboard prompts, Draft update, Clarifying questions
- Moodboard prompts generate Midjourney/DALL-E-ready image prompts with a "Copy all prompts" button
- Helps designers break down briefs, explore creative directions, and draft client communications

### Data access (RLS)

Row-Level Security is enforced at the Postgres level:

- **Brands** can only see their own `design_requests` (where `brand_id = auth.uid()`)
- **Designers** can see requests assigned to them (`assigned_designer_id = auth.uid()`) plus unassigned requests (`assigned_designer_id IS NULL`)
- **Messages** are only accessible by the brand owner and the assigned designer of that request
- **Profiles** are readable by authenticated users (needed for displaying names in chat)

Bypassing the frontend does not bypass access — RLS policies run on every Supabase query, including those from server components and API routes.

### Loading states and polish

- Skeleton loaders match the real content structure in every panel (brief, chat, AI)
- The workspace skeleton renders a realistic 3-column preview while data loads
- Empty states are contextual: chat shows the counterparty's avatar and a prompt to start the conversation; brand panel shows a "waiting for designer" card with a copy-link CTA when no designer is assigned
- An error boundary wraps the workspace to catch React crashes gracefully

## Tech stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Framework      | Next.js 14 (App Router) + TypeScript        |
| Backend / DB   | Supabase (Auth, Postgres, Realtime, RLS)    |
| Server state   | TanStack Query v5 (caching, optimistic UI)  |
| AI             | Vercel AI SDK v6 + Claude claude-sonnet-4-20250514              |
| Styling        | Tailwind CSS + CSS custom properties        |
| Hosting        | Vercel                                      |

## Local setup

```bash
git clone <repo-url>
cd collaboration-workspace
cp .env.example .env.local
# Fill in the three env vars (see below)
npm install
npm run dev
# Open http://localhost:3000
```

If using a fresh Supabase project, run the seed SQL in the Supabase Dashboard SQL Editor:

```bash
# File: supabase/seed.sql
```

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
ANTHROPIC_API_KEY=               # Server-side only — no NEXT_PUBLIC_ prefix
```

The Anthropic key is only used in the `/api/ai/assist` route handler. It never reaches the client bundle.

## Design decisions

- **`key={requestId}` on ChatPanel and AIPanel:** When the user navigates between projects, React must fully unmount and remount these panels to reset their internal state (chat subscriptions, AI conversation history, scroll position). Without the key, stale state from the previous project would leak into the new one.

- **`assigned_designer_id` on `design_requests` for access control:** Instead of relying solely on a separate `designer_assignments` join table, the `assigned_designer_id` column lives directly on the request row. This makes RLS policies simple single-table checks (`WHERE assigned_designer_id = auth.uid()`), avoids an extra join on every query, and gives us a single source of truth for "who is working on this."

- **`.maybeSingle()` instead of `.single()` for workspace queries:** The workspace query fetches a design request that might not exist or might not be accessible to the current user (RLS could filter it out). `.single()` throws an error when zero rows are returned; `.maybeSingle()` returns `null` gracefully, letting the UI show a "no access" state instead of crashing.

- **CSS custom properties over Tailwind theme extension for role theming:** The brand and designer themes need to swap at runtime based on the signed-in user, not at build time. CSS variables on `:root[data-role]` let every component inherit the correct palette without conditional class logic, and the transition between roles is instant — a single `data-role` attribute change repaints the entire UI.

- **Rate limiting on AI route:** A simple 50-requests-per-hour guard prevents runaway API costs during evaluation. It queries the user's own message count via RLS, so it's tamper-resistant without needing a separate rate-limit store.

- **AI context derived from relational data:** Instead of storing AI context in a separate table or cache, the system prompt is built dynamically from `design_requests` and `profiles` on every request. This avoids data duplication and guarantees the AI always sees the latest project state.

## Assumptions

- A design request has at most one active designer at a time
- Designers can browse unassigned requests to pick up work
- All messages are scoped to a request — there is no global chat
- Every authenticated user has a corresponding profile row

## AI usage in development

I used AI tools (Cursor + Claude) to accelerate scaffolding and explore interaction patterns. Specifically:

- Generating initial layout structures for the 3-panel workspace
- Suggesting component breakdowns (`BriefPanel`, `ChatPanel`, `AIPanel`, etc.)
- Speeding up repetitive Tailwind UI implementation

I did not rely blindly on generated code. One concrete example: the initial AI suggestion duplicated UI logic into separate Brand and Designer components. I refactored this into a single shared component with role-based conditional rendering, which better aligns with the requirement of a unified workspace.

I also manually adjusted AI-generated output to ensure meaningful behavioral differences between roles (not just visual), correct integration with Supabase RLS constraints, and proper separation between server and client logic for AI requests.

All final architecture, implementation decisions, and trade-offs were reviewed and adjusted by hand.