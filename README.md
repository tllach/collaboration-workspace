## AI Security

- The Anthropic API key is server-side only via `ANTHROPIC_API_KEY` (no `NEXT_PUBLIC_` prefix).
- Every AI request to `app/api/ai/assist/route.ts` validates the active Supabase user session with `supabase.auth.getUser()` before calling Anthropic.
- The design brief is fetched server-side with Supabase queries and protected by RLS, so users can only access AI assistance for requests they are authorized to view.
- Basic abuse protection is enabled: the AI route checks each user's message volume over the last hour and returns HTTP 429 when the threshold is exceeded.
