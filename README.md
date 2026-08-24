<p align="center">
  <h1 align="center">Invoice Nudge</h1>
  <p align="center">
    Turn an overdue invoice into a polished, payment-ready follow-up in under 10 seconds.
    <br />
    Built for Indian freelancers and small service agencies.
  </p>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-blue" />
</p>

> **Upload an unpaid invoice. Get the perfect follow-up in 10 seconds.**

Invoice Nudge owns one narrow workflow: chasing an unpaid invoice without damaging a client relationship. Upload a PDF or image, confirm the extracted facts, pick a tone, add your UPI ID or payment link, and export a ready-to-send email or WhatsApp draft. You stay in control — the app never sends anything for you.

---

## Why Invoice Nudge?

Late invoices cost freelancers both cash and emotional energy. Accounting tools are broader than this moment requires; generic AI writing tools lack invoice context, payment actions, and an escalation history.

Invoice Nudge localises the workflow for Indian service professionals:

- **INR** formatting using the Indian numbering system (`₹48,500`, `en-IN`)
- **UPI IDs** and **Razorpay/payment URLs** as first-class payment actions
- **WhatsApp click-to-chat** sharing without claiming automatic delivery
- **Concise, natural Indian-English** wording
- A culturally appropriate tone progression: **Friendly → Firm → Final Notice**

## Features

- **Upload & validate** — PDF, PNG, JPG with server-side file-signature verification, size limits, and SHA-256 deduplication.
- **Extract & review** — pulls client, amount, currency, invoice number, and dates; every field is editable with a confidence state before anything is used.
- **Three tones** — Friendly, Firm, and Final Notice, with a transparent recommendation based on days overdue and prior reminders.
- **Optional context** — contact name, relationship, prior reminder count, promised payment date, and a short custom note.
- **Payment actions** — insert a UPI ID or HTTPS payment link (validated, inserted deterministically — never rewritten by the model).
- **Email & WhatsApp export** — copy a complete email, or open WhatsApp click-to-chat with a safely encoded draft and a Copy fallback.
- **Invoice dashboard** — overdue-first list, Paid/Overdue/All filters, mark Paid, mark Overdue, and delete with confirmation.
- **Deterministic safeguards** — generated drafts are validated against confirmed facts; forbidden content (late fees, legal threats, invented deadlines) is rejected.

> **Important:** the current release uses *deterministic templates* for generation and treats OCR/LLM as adapters (see [Roadmap](#docs)). It never automatically sends messages, never marks an invoice paid, and never claims delivery.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Styling | [Tailwind CSS](https://tailwindcss.com) + CSS design tokens |
| Auth / DB / Storage | [Supabase](https://supabase.com) (Postgres + Row Level Security + private buckets) |
| Validation | [Zod](https://zod.dev) (shared across route boundaries) |
| Extraction | `pdf-parse` (embedded text) + `sharp` (image preprocessing); OCR via an adapter |
| Generation | Deterministic templates today; structured LLM output behind a `ReminderGenerator` interface |

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install

```bash
git clone https://github.com/summello/nudgy.git
cd nudgy
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials (see `.env.example`):

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-side only) |

### 3. Set up the database

Run the migration in `supabase/migrations/001_initial_schema.sql` via the Supabase SQL editor or CLI:

```bash
supabase db push
```

This creates the tables, indexes, row-level security policies, and storage policies. Create a **private** storage bucket named `invoice-files`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with `tsc --noEmit` |

## Project structure

```text
src/
├── actions/            # Server actions (upload, extract, generate, invoices)
├── app/
│   ├── api/            # Route handlers (upload, extract, generate, regenerate, export, invoices)
│   ├── new/            # Upload → review → tone → draft workflow
│   ├── invoices/       # Dashboard and lifecycle
│   ├── privacy/        # Privacy policy
│   ├── page.tsx        # Landing / upload
│   └── layout.tsx      # Root layout + metadata
├── components/ui/      # Design-system components (Button, DropZone, ToneCard, …)
├── lib/
│   ├── extraction/     # PDF/image extraction adapters
│   ├── supabase/       # Server-side Supabase client
│   ├── schemas.ts      # Zod schemas
│   ├── templates.ts    # Deterministic reminder templates + validation
│   └── utils.ts        # Formatting, validation, tone recommendation
└── types/              # Shared TypeScript types
supabase/migrations/    # Database schema + RLS policies
docs/                   # Product plan, requirements, technical plan, roadmap, design system
```

## Documentation

Product and technical decisions live in [`docs/`](docs/):

| Document | Purpose |
| --- | --- |
| [Product plan](docs/product-plan.md) | Strategy, audience, scope, user journey, success measures, GTM |
| [Requirements](docs/requirements.md) | Functional/non-functional requirements and user stories |
| [Technical plan](docs/technical-plan.md) | Architecture, data model, AI contract, security controls |
| [Roadmap](docs/roadmap.md) | MVP build plan, release gates, backlog |
| [Design system](docs/design-system.md) | Tokens, components, responsive behavior, accessibility |

## Roadmap

The current release is the one-day MVP (features A–F P0). See the [roadmap](docs/roadmap.md) for the full sequence. Notable upcoming work:

- Passwordless auth and guest→user conversion
- Saved default payment methods and usage metering
- Real OCR and structured LLM generation
- Search/sort, follow-up history, and a private beta

## Security

See [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities. Invoice documents are processed server-side, stored in private buckets, isolated by row-level security, and excluded from analytics and logs by design.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.