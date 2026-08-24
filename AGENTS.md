# Project memory — nudgy (Invoice Nudge)

## Git workflow (IMPORTANT)

- **Never commit new work directly to `main`.**
- All fresh commits go on a dedicated branch (e.g. `fix/<topic>`, `feat/<topic>`) and are
  **pushed to origin** so the user can open PRs against remote `main`.
- Remote: `https://github.com/summello/nudgy.git` (`origin`).
- Branch naming: `fix/…` for bug fixes, `feat/…` for features, `docs/…`, `chore/…`.

## Verification before committing

Run all three; all must pass:

```bash
npm run typecheck
npm run lint
npm run build
```

## Project context

- Product docs live in `docs/` (product-plan, requirements, technical-plan, roadmap, design-system).
- Stack: Next.js 14 App Router + TypeScript, Supabase (Postgres/RLS/storage), Zod, Tailwind tokens in `src/app/globals.css`.
- Server logic lives in `src/actions/*` (server actions) exposed via `src/app/api/*` route handlers; API routes must always return JSON (wrap bodies in try/catch) — clients parse `.json()` and must never receive HTML/empty error pages.
- Money is stored as integer minor units; dates computed in `Asia/Kolkata`; status vocabulary: Processing / Needs review / Overdue / Paid; exports are Copy/Open events, never "sent".
