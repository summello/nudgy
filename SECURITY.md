# Security Policy

## Reporting a vulnerability

We take the security of invoice data seriously. Please **do not** open a public issue for a security concern.

Report vulnerabilities privately to <ssmathuria89@gmail.com>. Include:

- A clear description of the issue
- Steps to reproduce (a minimal example helps)
- Affected versions, if known
- Any suggested remediation

We aim to acknowledge reports within 48 hours and triage within 5 business days. We will coordinate a fix and a disclosure timeline with you.

**Scope**

In-scope examples:

- Authentication or authorization bypass (including row-level security gaps)
- Exposure of another user's invoice files, extracted text, or drafts
- Prompt injection leading to fabricated facts in generated reminders
- Unsafe payment-link or WhatsApp URL handling (`javascript:`, `data:`, open redirect, etc.)
- Secret/credential leakage

Out-of-scope for the current MVP:

- Missing TLS on a non-production deployment
- Theoretical issues that require physical access or an already-compromised account
- `README` / documentation-only concerns

---

## Security model

Invoice Nudge is a drafting and tracking assistant, **not** an automated collections agent. Key boundaries:

- The app **never** sends email or WhatsApp messages automatically — exports are copy or click-to-chat only.
- The app **never** auto-marks an invoice Paid and never claims payment was verified.
- Generated copy must never invent late fees, deadlines, legal consequences, or payment details.

### Data handling

- Invoice files are stored in a **private** Supabase bucket; access is via short-lived signed URLs only.
- Every table and storage object is protected by owner-based Row-Level Security (RLS). `owner_id` is derived from the authenticated session, never from the browser.
- Invoice documents and extracted text are excluded from application logs, traces, analytics, and error tracking by default.
- Payment URLs are restricted to `https:` only.
- Generated text is rendered as text, never as raw HTML.

### Secrets

- LLM, OCR, and service-role credentials remain server-side only.
- `.env` files are git-ignored (only `.env.example` is committed). See [.gitignore](.gitignore).
- Do not commit real keys; use the placeholders in `.env.example`.

---

## Supported versions

This project is pre-1.0 (MVP). We support the current `main` branch only.

| Version | Supported |
| --- | --- |
| `main` (latest) | ✅ |

## Dependency policy

Dependencies are pinned in `package-lock.json`. We review upstream advisories (`npm audit`) and provider data-retention contracts before processing real customer invoices.

> **Note:** `next` is pinned to the latest 14.x patch (`14.2.35`). Remaining `npm audit` findings relate to `next`-internal (nested `postcss`) and legacy tooling (`eslint-config-next` → `glob`) plus `sharp@0.33`; resolving them requires a major upgrade (`next` 15/16, `sharp` 0.35). Plan that upgrade before production exposure.