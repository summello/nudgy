# Product plan

## 1. Product thesis

Late invoices create two problems for freelancers: delayed cash and the emotional cost of chasing a client. Existing accounting tools are broader than this moment requires, while generic AI writing tools lack invoice context, payment actions, and an escalation history.

Invoice Nudge should own one narrow workflow: turn an overdue invoice into a professional follow-up that is ready to send on the channel the client already uses.

The initial wedge is localization for Indian service professionals:

- INR formatting using the Indian numbering system;
- UPI IDs and Razorpay/payment URLs;
- WhatsApp-first sharing without claiming automatic delivery;
- concise, natural Indian-English wording;
- a culturally appropriate progression from courteous to unambiguous.

## 2. Target audience

### Primary persona: independent service professional

- Freelancer, consultant, designer, developer, marketer, or creator in India.
- Sends roughly 2–20 invoices per month.
- Tracks work in PDFs, email, WhatsApp, spreadsheets, or memory.
- Has recurring client relationships and worries that a firm reminder could harm them.
- Wants help now, not a new finance system to configure.

### Secondary persona: small agency operator

- Owner or operations lead at a 2–15 person services agency.
- Manages several open invoices and wants consistent follow-up language.
- Needs a lightweight view of what is overdue and what has already been chased.

### Not an initial target

- Accounts-receivable teams needing approvals, roles, audit exports, or ERP integration.
- High-volume collections businesses.
- Consumers collecting personal debts.
- Businesses needing invoice creation, GST filing, bookkeeping, or payment reconciliation.

## 3. Jobs to be done

### Primary job

When a client has not paid an invoice, help me send an appropriate reminder quickly so I can protect cash flow without sounding awkward, apologetic, or aggressive.

### Supporting jobs

- Pull the payment facts from the invoice so I do not retype them.
- Match the message to how late the payment is and how many times I have followed up.
- Make it easy for the client to act by including a payment method.
- Let me use email or WhatsApp without learning a new sending system.
- Show which invoices still need attention.

## 4. Value proposition and differentiation

### Promise

“Upload an unpaid invoice. Get the perfect follow-up in 10 seconds.”

### Reasons to choose Invoice Nudge

1. **Faster than prompting a general chatbot:** invoice facts, tone, payment details, and channel formatting are handled in one flow.
2. **Safer than blind automation:** the user reviews every extracted field and controls every send.
3. **More relevant than a generic template:** the message accounts for days overdue, relationship context, previous reminders, and desired firmness.
4. **Localized from the start:** INR, UPI, WhatsApp, and Indian-English language are first-class.
5. **Smaller than accounting software:** no ledgers, tax workflows, or setup project.

## 5. Product principles

- **User stays in control.** Never send a message or change an invoice to Paid without an explicit action.
- **Facts before fluency.** A polished reminder with a wrong amount is a failed reminder. Make extracted values visible and editable.
- **Firm, never threatening.** Generated copy can state consequences only when the user provides them; it must not invent legal action, late fees, or service suspension.
- **One clear next action.** Every reminder should make the amount, invoice, and payment route easy to find.
- **Honest status.** “Opened in WhatsApp” and “Copied” are export events, not delivery or read receipts.
- **Privacy by default.** Minimize file retention, keep secrets server-side, and make deletion easy.
- **Useful in one session.** A first-time user should receive value before completing optional setup.

## 6. MVP scope

### Must ship

1. PDF/JPG/PNG upload with type and size validation.
2. Text/OCR extraction of client name, invoice number, amount, currency, issue date, and due date.
3. A review step where every extracted field can be corrected.
4. Friendly, Firm, and Final Notice reminder generation.
5. Optional context: client contact name, relationship, previous reminder count, and a short custom note.
6. UPI ID or HTTPS payment link insertion.
7. Email subject/body with a one-click Copy Email action.
8. WhatsApp-ready short copy with click-to-chat when a phone number is available, plus Copy as fallback.
9. A compact invoice dashboard with Overdue and Paid states.
10. Regenerate, edit, and preserve the latest draft.
11. Clear error, retry, deletion, privacy, and AI-disclosure states.

### Should ship if time remains

- Guest-first local session with optional account creation to save data.
- Previous-reminder date and a suggested next tone.
- Mobile file capture using the device camera/file picker.
- Basic analytics events and an in-product feedback control.

### Explicitly deferred

- Automatic email or WhatsApp sending.
- Scheduling, sequences, or background jobs.
- Razorpay account connection and webhook-based reconciliation.
- Accounting, GST, bank, or CRM integrations.
- Invoice generation or editing the source PDF.
- Multi-user workspaces and approval flows.
- Recurring invoices, partial payments, or multi-currency beyond display.
- Legal demand letters or collections advice.

## 7. End-to-end journey

1. The user lands on a focused upload screen with the promise and privacy note.
2. They upload or photograph an overdue invoice.
3. The app parses the file and shows an editable review card.
4. The user corrects facts, chooses a tone, adds relationship/reminder context, and selects a payment method.
5. The app generates channel-specific drafts.
6. The user edits if needed, then copies the email or opens the WhatsApp draft.
7. The invoice appears on the dashboard as Overdue, with the last exported tone and date.
8. When money arrives, the user marks it Paid. The item leaves the default attention queue but remains in the Paid filter.

## 8. Message escalation model

The user always chooses the final tone. The app may recommend one using transparent rules:

| Stage | Default signal | Message intent | Avoid |
| --- | --- | --- | --- |
| Friendly | 1–7 days late; no previous reminder | Assume oversight, preserve warmth, request an update | Guilt, urgency inflation |
| Firm | 8–21 days late or one prior reminder | State that payment is overdue, ask for a specific payment date | Apologizing for following up |
| Final Notice | 22+ days late or two+ reminders | Set a clear response deadline and ask the client to resolve or confirm a plan | Invented penalties, legal threats |

These thresholds are recommendations, not automatic enforcement. User-provided relationship context can justify a different choice.

## 9. Success measures

### Activation

- At least 60% of users who start an upload reach a generated reminder.
- Median time from upload start to first draft under 10 seconds for digitally generated PDFs and under 20 seconds for images.
- At least 70% of generated reminders result in an export action in the same session.

### Quality

- At least 90% of completed extractions require no correction to amount, currency, and due date in the beta sample.
- Fewer than 2% of drafts contain a payment fact not present in confirmed inputs.
- At least 70% of post-export ratings are “Useful as-is” or “Useful with small edits.”

### Retention and commercial validation

- At least 25% of activated beta users return within 30 days.
- At least 15% of users who consume three reminders indicate willingness to pay at the proposed price.
- Track, but do not treat as causal proof, user-reported payment received after a reminder.

### Guardrail metrics

- Extraction failure rate by file type and size.
- Generation latency and provider error rate.
- Percentage of users deleting uploaded data.
- Copy edits/regenerations per exported reminder.
- Complaints about tone, hallucinated facts, or privacy.

## 10. Analytics event plan

Do not store full invoice text or generated message content in analytics properties.

| Event | Important properties |
| --- | --- |
| `upload_started` | source, mime type bucket, size bucket |
| `upload_completed` | processing time, extraction method |
| `extraction_failed` | error category, retryable |
| `fields_confirmed` | corrected field names, days overdue bucket |
| `reminder_generated` | tone, channel availability, latency bucket |
| `reminder_regenerated` | previous tone, next tone, reason if supplied |
| `email_copied` | tone, payment method present |
| `whatsapp_opened` | tone, phone present, payment method present |
| `invoice_marked_paid` | days overdue bucket, exported previously |
| `draft_rated` | rating, tone |

## 11. Go-to-market plan

### Beta offer

- Recruit 15–25 freelancers across design, development, consulting, and small agencies.
- Offer a limited free beta in exchange for a 15-minute interview after two real invoice follow-ups.
- Manually review extraction failures and message ratings without accessing invoice contents unless the user explicitly opts in.

### Acquisition experiments

- Before/after reminder rewrites on LinkedIn, with all details fictionalized.
- Short demos in freelancer WhatsApp groups where promotion is permitted.
- Helpful late-payment playbooks in relevant Reddit communities; disclose affiliation and avoid spam.
- Referral partnerships with small accounting firms and independent bookkeepers.

### Pricing experiments

Test the value metric before implementing billing:

- ₹99 for ten generated reminders, expiring only if clearly disclosed; versus
- ₹299/month with a reasonable usage allowance.

Ask users which model feels fair at the paywall, record attempted upgrades, and use a manual payment/waitlist workflow during beta. Do not imply that either price is validated yet.

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Wrong extraction | User sends incorrect financial facts | Mandatory review, field-level confidence, source preview, no generation until required fields are confirmed |
| Overly aggressive AI copy | Relationship or reputational harm | Bounded tone definitions, forbidden-content rules, editable preview, user-controlled export |
| Sensitive invoice exposure | Trust and compliance harm | Private storage, signed URLs, short retention, server-side processing, deletion controls, vendor data-retention review |
| WhatsApp URL limitations | Draft may not open as expected | E.164 validation, platform-safe encoding, desktop/mobile testing, Copy fallback |
| “10 seconds” promise missed | Loss of trust | Instrument p50/p95 latency, show stage progress, qualify by file type if evidence requires it |
| Product expands into accounting | Slow delivery and unclear positioning | Apply a strict “does it improve the follow-up?” scope test |
| Competitors add localization | Reduced differentiation | Win on simplicity, trust, copy quality, and learning from Indian freelancer workflows |

## 13. Open questions to validate

1. Will users upload invoices containing sensitive tax and bank details to an AI-assisted service?
2. Do users prefer an account before upload, after first value, or not at all for a credit pack?
3. Is WhatsApp click-to-chat materially more valuable than copy-to-clipboard?
4. Which context fields improve message quality enough to justify extra form friction?
5. Does “Final Notice” feel appropriately professional in India, or should it be labelled “Escalated”?
6. Should source files be deleted immediately after extraction or retained briefly for user review?
7. Is per-reminder pricing easier to trust than a subscription for sporadic users?

