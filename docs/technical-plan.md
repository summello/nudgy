# Technical plan

## 1. Architecture summary

Use a server-rendered Next.js application with a narrow backend-for-frontend layer. Supabase provides authentication, Postgres, and private object storage. Extraction and LLM calls run only on the server. The browser receives structured invoice fields and generated drafts, never provider credentials.

```text
Browser
  -> Next.js UI / server actions or route handlers
      -> Supabase Auth
      -> Postgres with row-level security
      -> Private Storage bucket
      -> PDF text parser or OCR adapter
      -> LLM adapter with structured output
      -> Analytics adapter (metadata only)
```

For a one-day build, prefer a single deployable Next.js app over queues and microservices. Keep providers behind small interfaces so OCR/LLM choices can change after real-document evaluation.

## 2. Proposed stack

- Next.js App Router, TypeScript, React Server Components where they simplify data loading.
- Tailwind CSS or CSS variables plus utility classes using the tokens in `design-system.md`.
- Supabase Auth, Postgres, and a private `invoice-files` storage bucket.
- Zod schemas shared between route boundaries and structured LLM output validation.
- A PDF text extractor for digitally generated PDFs and an OCR-capable vision path for image-only pages.
- One LLM provider behind a `ReminderGenerator` interface.
- A lightweight, privacy-aware analytics service; full document text must never be sent as event data.

Pin actual library and model versions at implementation time after checking their current documentation. Do not encode a model name in product requirements.

## 3. Route and screen map

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Value proposition and primary upload action | Public |
| `/new` | Upload, extraction review, context, and draft workspace | Guest/user |
| `/invoices` | Attention-focused dashboard | User, or local guest session if supported |
| `/invoices/[id]` | Invoice details, drafts, and status | Owner only |
| `/settings/payment` | Default UPI/payment URL | User |
| `/privacy` | Data handling and retention explanation | Public |

The `/new` route should be a single resumable workflow with four visible steps: Upload, Check details, Choose tone, Send yourself.

## 4. Data model

### `profiles`

- `id uuid primary key references auth.users`
- `display_name text`
- `business_name text null`
- `default_signoff text null`
- `locale text default 'en-IN'`
- `timezone text default 'Asia/Kolkata'`
- `created_at`, `updated_at`

### `invoices`

- `id uuid primary key`
- `owner_id uuid not null`
- `client_name text not null`
- `contact_name text null`
- `contact_phone_e164 text null`
- `invoice_number text null`
- `amount_minor bigint not null check (amount_minor > 0)`
- `currency char(3) not null default 'INR'`
- `issue_date date null`
- `due_date date not null`
- `status enum('processing','needs_review','overdue','paid')`
- `source_object_path text null`
- `source_sha256 text null`
- `extraction_method text null`
- `extraction_confidence jsonb null`
- `confirmed_at timestamptz null`
- `paid_at timestamptz null`
- `created_at`, `updated_at`

### `payment_methods`

- `id uuid primary key`
- `owner_id uuid not null`
- `kind enum('upi','payment_url')`
- `value_encrypted text not null` or a platform-appropriate protected value
- `label text null`
- `is_default boolean default false`
- `created_at`, `updated_at`

### `reminders`

- `id uuid primary key`
- `invoice_id uuid not null`
- `owner_id uuid not null` (denormalized for policy simplicity)
- `version integer not null`
- `tone enum('friendly','firm','final_notice')`
- `email_subject text not null`
- `email_body text not null`
- `whatsapp_body text not null`
- `context jsonb not null default '{}'`
- `generation_model text null`
- `prompt_version text not null`
- `validation_status text not null`
- `created_at`, `updated_at`

### `reminder_exports`

- `id uuid primary key`
- `reminder_id uuid not null`
- `owner_id uuid not null`
- `action enum('email_copied','whatsapp_copied','whatsapp_opened')`
- `created_at`

Apply owner-based row-level policies to every table and object-prefix policies to storage. Never trust an `owner_id` supplied by the browser; derive it from the authenticated session or server-owned guest session.

## 5. File and extraction pipeline

1. Browser performs early extension/size checks for fast feedback.
2. Server streams or receives the file, enforces maximum bytes, verifies file signature, and calculates SHA-256.
3. Create an idempotent processing record keyed by owner/session plus file hash.
4. Store in a private bucket only if source preview or retry requires retention; otherwise use ephemeral processing.
5. For PDF, try embedded-text extraction first. If text is absent or unusable, render only the necessary pages to images and use OCR/vision.
6. Normalize extraction into a strict schema; preserve raw candidates server-side only as required by the retention policy.
7. Return fields with coarse confidence (`high`, `review`, `missing`) and source snippets/bounding references when feasible.
8. User edits and confirms the normalized record.
9. Generation receives confirmed structured facts, never the raw invoice as an instruction-bearing prompt.

Set conservative launch limits, for example 10 MB and 5 pages, then adjust using observed failures and cost. Limits are configuration, not promises in UI copy until tested.

## 6. Structured extraction contract

```ts
type ExtractedInvoice = {
  clientName: Candidate<string>;
  invoiceNumber: Candidate<string | null>;
  amountDueMinor: Candidate<number>;
  currency: Candidate<string>;
  issueDate: Candidate<string | null>; // ISO date only
  dueDate: Candidate<string | null>;   // ISO date only
};

type Candidate<T> = {
  value: T;
  confidence: "high" | "review" | "missing";
  evidence?: string; // short source fragment, not sent to analytics
};
```

Treat confidence as a UX hint, not a calibrated probability unless it has been evaluated as such. Deterministic code must validate ISO dates, currency codes, positive integer minor units, and due-date calculations.

## 7. Reminder generation contract

### Server-owned inputs

- Confirmed invoice facts.
- User-selected tone.
- Sanitized optional relationship and prior-reminder context.
- User-confirmed payment method.
- Days-overdue value calculated in code.
- Prompt/policy version and desired locale.

### Structured output

```ts
type ReminderDraft = {
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
};
```

### Generation safeguards

1. Delimit invoice/context data and explicitly state that content inside it is untrusted.
2. Ask for schema-constrained output with length limits.
3. Insert critical payment values deterministically after generation where practical.
4. Normalize and check that the exact confirmed amount/date/invoice number are consistent.
5. Reject extra URLs, new monetary values, unsupported late fees, legal threats, or fabricated commitments.
6. Attempt one repair using validation errors without silently changing source facts.
7. If repair fails, show a retry state; do not surface a “best effort” unsafe draft.

Version prompts and retain enough metadata to reproduce quality regressions without retaining raw sensitive documents indefinitely.

## 8. WhatsApp integration

Use click-to-chat, not the WhatsApp Business sending API, for the MVP.

- Normalize a user-entered phone number to E.164 after explicit country selection/default confirmation.
- Build the link using the officially supported click-to-chat format at implementation time.
- Encode the final, visible WhatsApp text with standard URL encoding.
- Trigger navigation only from a user gesture.
- Keep Copy WhatsApp available even when phone validation or app opening fails.
- Record `whatsapp_opened`, never `sent` or `delivered`.

Long drafts may exceed practical URL/app limits; enforce a WhatsApp-specific character budget and test on iOS, Android, and desktop web.

## 9. State and idempotency

- Use a client-generated operation ID for upload and generation retries.
- Enforce a unique constraint for `(owner/session, operation_id, operation_type)` or equivalent.
- Save edits explicitly or with debounced version-aware updates; show saving state.
- Prevent late provider responses from overwriting a newer user edit or generation version.
- Optimistically mark Paid only if rollback is implemented; otherwise wait for the database response.

## 10. Security and privacy design

- Private storage and short-lived signed URLs.
- Row-level security tested with two distinct users and anonymous access.
- CSRF-safe mutations, secure cookies, origin checks where appropriate, and rate limits per session/user/IP.
- Content Security Policy and safe rendering; generated text must be rendered as text, not raw HTML.
- Strict URL parsing for payment links; permit `https` only in MVP.
- Invoice documents and extracted text excluded from application logs, traces, analytics, and support tools by default.
- Provider contracts/settings reviewed for training use and retention before real customer invoices are processed.
- Configurable retention job for abandoned uploads and deleted records.
- Clear user-facing disclosure of which subprocessors receive files or extracted text.

## 11. Error taxonomy

| Category | User message intent | Retry |
| --- | --- | --- |
| Invalid file | Explain supported formats/limit | Choose another |
| Protected/corrupt PDF | Ask for an unlocked/exported copy | Choose another |
| Unreadable content | Suggest clearer image or manual entry | Yes/manual |
| Extraction timeout | Preserve upload and retry processing | Yes |
| Missing required facts | Let user enter fields manually | Manual |
| Generation unavailable | Preserve confirmed data and retry later | Yes |
| Unsafe/invalid output | Say a safe draft could not be created | Yes |
| Clipboard/app failure | Keep selectable content and explain fallback | Manual |

## 12. Testing strategy

### Unit

- INR parsing/formatting and minor-unit conversion.
- Date normalization and days-overdue calculations across timezone boundaries.
- Tone recommendation rules.
- UPI, HTTPS URL, and E.164 validation.
- WhatsApp URL encoding.
- Fact-consistency and forbidden-content validators.

### Integration

- Storage ownership and signed URL expiry.
- Extraction adapters against a fixed, synthetic invoice corpus.
- LLM schema failures, repair, timeout, and rate-limit handling.
- Idempotent generation and usage metering.
- Deletion cascading across rows and objects.

### End-to-end

- Happy paths for a digital PDF and photographed JPEG.
- Correction before generation.
- All three tones and both export actions.
- Clipboard denial and WhatsApp fallback.
- Mark Paid, filter, reverse with confirmation, and delete.
- Cross-account authorization attempts.

Use synthetic invoices with fictional parties and payment details in source control. Real customer invoices must not become test fixtures.

## 13. Delivery sequence

1. Establish tokens, shell, upload screen, and synthetic fixtures.
2. Implement file validation and the extraction adapter contract.
3. Build editable confirmation and normalized persistence.
4. Implement deterministic message templates as a reliable fallback.
5. Add structured LLM generation and output validation.
6. Add email copy and WhatsApp click-to-chat.
7. Add dashboard/status/delete flows.
8. Add analytics metadata, rate limiting, security tests, and launch copy.

The deterministic templates are intentional: they keep the product usable during provider failure and provide a baseline against which AI copy quality can be measured.

## 14. Definition of done

- Type checking, linting, unit tests, integration tests, and critical end-to-end paths pass.
- Environment variables are documented with safe sample values and no secrets committed.
- Migrations and row-level policies are reviewed together.
- The synthetic extraction corpus meets the beta accuracy threshold.
- p50/p95 timings are measured in a production-like deployment.
- The privacy and retention behavior matches the UI disclosure.
- Support can identify an error by request ID without seeing invoice content.

