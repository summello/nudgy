# Roadmap

## 1. Roadmap principles

- Prove that users trust the upload and export a generated reminder before investing in sending automation.
- Improve factual accuracy and user control before adding more channels.
- Add only workflows that shorten the path from overdue invoice to payment follow-up.
- Use observed user behavior and interviews to unlock each phase; dates alone do not justify scope.

## 2. Release map

| Release | Outcome | Included epics | Exit signal |
| --- | --- | --- | --- |
| Prototype | Validate the interaction and copy | Upload mock, editable facts, three tones, deterministic drafts | 5 target users can complete the flow without coaching |
| One-day MVP | Deliver a real, manually controlled nudge | A–F P0 stories | Safe production-like flow passes release checklist |
| Private beta | Validate trust, quality, and repeat use | P1 accounts, saved defaults, analytics, feedback | 15–25 users process real invoices; quality thresholds are credible |
| Paid beta | Validate willingness to pay | Usage meter and chosen billing model | Users complete real purchases with low support burden |
| V1 | Make repeated follow-up effortless | History, better recommendations, lightweight sequence planning | Retention and repeat-export behavior justify investment |
| Later | Close the payment loop selectively | Razorpay verification, optional sending/integrations | Explicit demand plus compliance/reliability readiness |

## 3. One-day MVP build plan

This is an aggressive vertical-slice plan for an experienced builder with accounts and keys ready. If the app will handle real invoices, security and privacy gates cannot be skipped merely to keep the one-day label.

### Hour 0–1 — Foundation

- Create the Next.js app shell and apply core design tokens.
- Add synthetic PDF/image fixtures.
- Define Zod schemas for invoice facts and reminder output.
- Configure Supabase project, private storage, initial tables, and ownership policies.
- Establish error tracking that excludes document content.

**Stories touched:** A1, A2, B1.  
**Checkpoint:** a user can select a fixture and see an honest processing state.

### Hour 1–3 — Upload and extraction

- Implement file limits, server-side signature verification, hashing, and private storage/ephemeral processing.
- Extract embedded PDF text; route image-only input through the OCR adapter.
- Normalize provider output and expose editable values with attention states.
- Add manual entry fallback and invalid-file recovery.

**Stories completed:** A1–A3, B1–B3.  
**Checkpoint:** supported fixtures produce editable facts; failures never dead-end.

### Hour 3–5 — Context and generation

- Build tone cards, recommendation rules, optional context, and payment method inputs.
- Implement deterministic baseline templates.
- Add structured LLM generation, validation, one repair attempt, and retry.
- Build editable email/WhatsApp previews.

**Stories completed:** C1–C4, D1–D2.  
**Checkpoint:** every visible financial fact matches confirmed input across all tones.

### Hour 5–6 — Export actions

- Implement email copy with accessible feedback and manual fallback.
- Normalize recipient phone number and build a safely encoded WhatsApp click-to-chat action.
- Record export events without using delivery language.

**Stories completed:** E1–E2.  
**Checkpoint:** copy and WhatsApp actions work on desktop and mobile test devices.

### Hour 6–7 — Dashboard and lifecycle

- Build Overdue-first list/card view.
- Add invoice detail restore, status changes, filters, and deletion.
- Handle loading, empty, error, and small-screen states.

**Stories completed:** F1–F4.  
**Checkpoint:** a user can return, follow up more firmly, mark Paid, and delete data.

### Hour 7–8 — Hardening and launch gate

- Run the critical end-to-end matrix and cross-user authorization tests.
- Verify rate limits, idempotency, clipboard fallback, URL encoding, and deletion.
- Measure latency and extraction accuracy against fixtures.
- Add privacy/AI disclosures, retention copy, feedback, and support route.
- Fix P0 failures; defer polish that does not affect safety or the core job.

**Checkpoint:** every item in the release acceptance checklist is either passing or explicitly blocks launch.

## 4. Prototype backlog

### Goal

Learn whether the workflow and generated copy solve an emotionally real problem before committing to a full backend.

- Clickable upload-to-draft flow using synthetic invoices.
- Manual extracted-field editing.
- Three tone examples for the same invoice.
- Email and WhatsApp previews.
- Five usability tests focused on trust, wording, and expected next action.

### Questions answered

- Do users understand that they—not the app—send the message?
- Which extracted facts need the most visible confirmation?
- Are three tones sufficient and appropriately named?
- Does the 10-second promise matter more than saved history?

## 5. Private beta backlog

### P1 features

1. Passwordless account and conversion from guest session (G1).
2. Saved default UPI/payment URL (D4).
3. Search and sort dashboard (F6).
4. Tone recommendation explanation (C8).
5. Separate email subject/body copy (E5).
6. In-product “useful as-is / edited / not useful” feedback.
7. Operator health dashboard containing only aggregate/error metadata.
8. Retention scheduler and self-serve data deletion verification.

### Beta experiments

- Compare account-before-upload with account-after-first-draft.
- Compare explicit context form with a single optional “What should the client know?” field.
- Compare recommended tone based on days late alone versus days late plus prior reminders.
- Ask users to rate template baseline and AI version blind to measure incremental AI value.

### Exit criteria

- 15–25 target users have used real invoices with informed consent.
- Median clean-PDF time to draft supports the marketing claim or the claim is revised.
- Extraction and generation guardrail metrics meet the targets in the product plan.
- At least five users return for a second invoice or later follow-up.
- No unresolved critical privacy or cross-user access issue.

## 6. Paid beta backlog

### Decisions before implementation

- Choose subscription, credit pack, or both from observed preference and usage frequency.
- Define one billable unit and regeneration behavior.
- Decide expiry, refunds, failed generation treatment, taxes, invoices/receipts, and support policy.
- Review payment provider support for Indian businesses and current regulatory requirements.

### Candidate stories

- Purchase a ten-reminder pack for ₹99.
- Subscribe for ₹299/month and see renewal/cancellation terms.
- See remaining credits before generating.
- Recover cleanly from payment success, failure, cancellation, and delayed webhook events.
- Download a receipt and manage billing details.

### Exit criteria

- At least ten target users attempt to purchase and at least five complete payment; treat these as learning thresholds, not proof of scale.
- Billing states are idempotent and reconcile with provider records.
- Users understand what consumes usage without support intervention.

## 7. V1 backlog

Prioritize using beta evidence:

- Follow-up history and a clear escalation timeline.
- Suggested next reminder and user-controlled calendar reminder.
- Reusable client profiles and relationship notes.
- More robust multi-page and multilingual invoice extraction.
- Message variants that stay within a saved professional voice.
- PDF attachment reminder in export guidance, without uploading it to WhatsApp/email automatically.
- Team workspace for small agencies only if multiple users are observed sharing one account.
- CSV export of invoice/reminder history.

### V1 non-goals unless evidence changes

- Full invoice creation.
- Double-entry bookkeeping or GST filing.
- Broad CRM/contact management.
- Automatic collections sequences.

## 8. Later opportunities

These require stronger trust, operational maturity, and explicit demand:

- Razorpay connection and webhook-verified payment status.
- Public, secure payment page.
- Scheduled email delivery with approval, audit history, pause, and unsubscribe/compliance behavior.
- WhatsApp Business API sending through approved templates and proper consent.
- Accounting imports from selected tools.
- Agency roles, approvals, and branded message policies.
- Partial-payment plans and promise-to-pay tracking.

Every automatic-send proposal needs a separate safety and compliance review. It is not a simple extension of click-to-chat.

## 9. Prioritization scorecard

Score candidates from 1–5, then prefer high user value/confidence and low complexity/risk.

| Criterion | Question |
| --- | --- |
| Core-job impact | Does it make a correct, appropriate follow-up faster? |
| Frequency | How often does the target user encounter this need? |
| Differentiation | Does it strengthen localization, trust, or message quality? |
| Evidence | Is demand observed in behavior, not only stated? |
| Complexity | Can it be shipped and supported without broad platform work? |
| Risk | Does it add financial, privacy, channel, or relationship harm? |

Suggested decision rule: do not prioritize an integration scoring below 4 on core-job impact and evidence, or above 3 on risk without a specific mitigation plan.

## 10. Dependency and decision log

| Decision | Needed by | Owner | Status |
| --- | --- | --- | --- |
| Guest-first versus sign-in-first | Prototype | Product | Open; test both |
| OCR/vision provider | MVP build | Engineering | Evaluate on synthetic corpus |
| LLM and structured-output mode | MVP build | Engineering | Evaluate accuracy, latency, retention, cost |
| Source-file retention | Before real beta | Product/security | Open; prefer shortest useful period |
| “Final Notice” label | Private beta | Product/design | Validate with users |
| Subscription versus credit pack | Paid beta | Product | Evidence required |
| Exact public performance claim | Launch | Product | Instrument before publishing |

