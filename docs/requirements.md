# Requirements and detailed user stories

## 1. Release definition

This document defines the usable MVP. Requirements marked **P0** block launch. **P1** items may follow immediately after launch. **P2** items are later opportunities.

### Roles

- **Guest:** can process an invoice during the current session; persistence depends on the chosen guest implementation.
- **User:** owns saved invoices, drafts, and payment preferences.
- **Operator:** can inspect aggregate service health and error metadata, but cannot browse invoice content by default.

### Required entities

- **User profile:** display name, business name, locale, timezone, optional default sign-off.
- **Invoice:** owner, source-file reference, client/contact details, invoice number, amount in minor units, currency, dates, status, extraction metadata, timestamps.
- **Payment method:** UPI ID or payment URL, display label, default flag.
- **Reminder:** invoice, tone, channel, subject where relevant, editable body, generation context, status, timestamps.
- **Export event:** reminder, channel/action, timestamp. It does not assert delivery.

### Global business rules

- Store money as integer minor units; render INR using `en-IN` conventions.
- Interpret invoice dates from the document, then display them in an unambiguous format such as `24 Aug 2026`.
- Calculate days overdue using the user's local date in `Asia/Kolkata` by default, not server UTC.
- Require confirmed client name, amount, currency, and due date before generation.
- Never invent invoice facts, late fees, deadlines, legal consequences, or payment details.
- Never automatically send a message or automatically mark an invoice Paid in the MVP.
- A payment method is optional. The message must not claim a link is included when it is absent.
- Preserve user edits until the user explicitly regenerates or leaves after a clear warning.

## 2. Feature A — Upload and validation

### Functional requirements

- **FR-A1 (P0):** accept a single PDF, PNG, JPG, or JPEG through drag-and-drop or file picker.
- **FR-A2 (P0):** support mobile camera/gallery selection where the browser permits it.
- **FR-A3 (P0):** reject unsupported, password-protected, empty, or oversized files with an actionable message.
- **FR-A4 (P0):** validate type using file signature server-side, not extension alone.
- **FR-A5 (P0):** show upload and processing states without implying success early.
- **FR-A6 (P0):** prevent a file belonging to one user/session from being accessible to another.
- **FR-A7 (P1):** let the user cancel an in-progress upload.

### Story A1 — Upload a digital PDF

**As a freelancer, I want to upload an invoice PDF so that I do not have to copy its details manually.**

Acceptance criteria:

1. Given a valid PDF within the configured limit, when the user selects it, then the UI shows its filename, size, and processing progress.
2. The server verifies the file signature and stores it in a private location or processes it ephemerally.
3. Successful upload proceeds automatically to extraction.
4. Double-clicking or retrying does not create duplicate visible invoices.
5. Keyboard-only users can select and replace the file.

### Story A2 — Upload an invoice image

**As a mobile user, I want to choose or capture an invoice image so that I can create a reminder away from my desk.**

Acceptance criteria:

1. PNG and JPEG images in the supported size and dimension range are accepted.
2. Image orientation metadata is respected before OCR.
3. A low-resolution or unreadable image produces guidance to retake it in good light and include all corners.
4. The original image is never exposed through a public bucket URL.

### Story A3 — Recover from an invalid upload

**As a user, I want a clear explanation when my file cannot be processed so that I know how to fix it.**

Acceptance criteria:

1. Unsupported type, oversize, password protection, network failure, and parse failure have distinct messages.
2. Every retryable error includes a Retry or Choose another file action.
3. A failed attempt does not count against a paid reminder allowance.
4. Technical internals and provider errors are not exposed to the user.

Edge cases: multi-page PDFs, rotated scans, duplicate uploads, misleading extensions, zero-byte files, corrupted PDFs, handwritten fields, and invoices mixing image and embedded text.

## 3. Feature B — Extraction and confirmation

### Functional requirements

- **FR-B1 (P0):** extract client/company name, amount due, currency, due date, invoice number, and issue date when available.
- **FR-B2 (P0):** distinguish amount due from subtotal, tax, paid amount, and total where possible.
- **FR-B3 (P0):** show all extracted values in editable controls before generation.
- **FR-B4 (P0):** identify low-confidence or missing values without pretending confidence is exact.
- **FR-B5 (P0):** allow the user to view the source beside or near the extracted fields.
- **FR-B6 (P0):** validate amount and date formats and require core fields.
- **FR-B7 (P1):** remember user corrections as evaluation data only with explicit, privacy-preserving policy.

### Story B1 — Review extracted invoice facts

**As a user, I want to confirm extracted facts before they reach the reminder so that I never send an incorrect request.**

Acceptance criteria:

1. Client name, amount, currency, due date, and invoice number are visible immediately after extraction.
2. Required missing fields are empty and labelled “Not found”; they are never guessed in the UI.
3. Fields that need attention are visually marked with an explanation, not color alone.
4. Continue remains disabled until client name, positive amount, currency, and valid due date are confirmed.
5. The confirmed values, rather than the raw model output, are the sole factual source for reminder generation.

### Story B2 — Correct a mistaken value

**As a user, I want to fix an extracted amount or date so that the generated reminder uses the invoice’s real terms.**

Acceptance criteria:

1. All extracted fields are editable with appropriate input types.
2. INR accepts normal and Indian-grouped input and is normalized to minor units.
3. Ambiguous dates prompt the user instead of silently choosing day-first or month-first.
4. A correction is saved when the user continues and reflected in every subsequent draft.
5. Returning to the review step does not discard corrections.

### Story B3 — Handle an invoice that is not overdue

**As a user, I want to know when the confirmed due date is today or in the future so that I do not accidentally send an overdue notice.**

Acceptance criteria:

1. The app calculates and displays whether the invoice is due today, upcoming, or overdue.
2. For a future due date, the app explains that Invoice Nudge is designed for overdue invoices and offers a neutral pre-due draft only if that feature is enabled; otherwise generation is blocked.
3. For today, Final Notice is not recommended by default.
4. The user can return and correct the date.

Edge cases: credit notes, multiple currencies, partial-payment language, “due on receipt,” missing due date, multiple totals, dates such as `03/04/26`, negative totals, and invoices addressed to multiple entities.

## 4. Feature C — Reminder context, tone, and generation

### Functional requirements

- **FR-C1 (P0):** offer Friendly, Firm, and Final Notice with plain-language descriptions.
- **FR-C2 (P0):** collect optional context: contact name, relationship, prior reminder count/date, promised payment date, and a short instruction.
- **FR-C3 (P0):** recommend a tone based on days overdue and previous reminders, while preserving user choice.
- **FR-C4 (P0):** generate separate email and WhatsApp variants from the same confirmed facts.
- **FR-C5 (P0):** show generation progress, timeout, safe retry, and provider-unavailable states.
- **FR-C6 (P0):** let the user edit and regenerate drafts.
- **FR-C7 (P0):** ensure the output contains no unsupported claims or invented details.
- **FR-C8 (P1):** explain briefly why a tone was recommended.
- **FR-C9 (P2):** learn a saved brand voice from user-approved examples.

### Tone contract

- **Friendly:** warm and concise; assumes oversight; asks for an update; no apology for following up.
- **Firm:** direct and professional; clearly states overdue status; requests payment or a specific date.
- **Final Notice:** calm and unambiguous; names a user-confirmed response deadline if supplied; does not threaten legal action or invent consequences.

Every draft should:

- identify the invoice by number when present;
- include the confirmed amount and original due date;
- mention days overdue only when the calculation is reliable and useful;
- include exactly the selected payment action when present;
- request either payment or a concrete update;
- use a neutral greeting if the contact name is missing;
- avoid shame, sarcasm, emojis by default, and fabricated familiarity.

### Story C1 — Choose a tone with guidance

**As a freelancer, I want to understand how each tone will sound so that I can protect the client relationship while being appropriately direct.**

Acceptance criteria:

1. Each tone control includes a one-sentence description and a short sample fragment.
2. One tone may be marked Recommended based on transparent rules.
3. Recommendation does not prevent selecting another tone.
4. Final Notice displays a note that the output is not legal advice.
5. Tone selection is accessible as a single-choice group and works by keyboard.

### Story C2 — Add relationship and reminder context

**As a user with history with the client, I want to add that context so that the reminder does not sound generic or ignore a prior promise.**

Acceptance criteria:

1. Context fields are optional and clearly separated from invoice facts.
2. The user can record zero, one, two, or three-plus prior reminders.
3. If the user supplies a promised payment date, the draft can reference it accurately.
4. Free-text context has a short character limit and is treated as untrusted input.
5. The app never follows free-text instructions that contradict factual or safety rules.

### Story C3 — Generate channel-specific reminders

**As a user, I want an email and WhatsApp version at once so that I can choose the best channel without rewriting the message.**

Acceptance criteria:

1. The response includes an email subject, email body, and shorter WhatsApp body.
2. Both versions use the same confirmed amount, date, invoice number, tone, and payment method.
3. The email has a greeting, readable paragraphs, action request, and sign-off.
4. The WhatsApp version is scannable on mobile and avoids email-specific phrasing such as “attached herein.”
5. Generation succeeds only if the response matches the structured schema and passes deterministic fact checks.
6. A failed validation triggers one bounded repair attempt, then a safe error state.

### Story C4 — Edit or regenerate a draft

**As a user, I want to adjust the wording or regenerate it so that the final message still sounds like me.**

Acceptance criteria:

1. Email subject, email body, and WhatsApp body are editable before export.
2. User edits persist when switching channel tabs.
3. Regenerate warns before overwriting edited content or creates a new version.
4. Regeneration can keep the tone or deliberately change it.
5. Export always uses the visible edited version, not a stale generated version.

Edge cases: hostile user instructions, prompt injection in invoice text, a client contact and company with different names, missing invoice number, due date today, a supplied deadline in the past, or payment details containing unsafe URL schemes.

## 5. Feature D — Payment actions

### Functional requirements

- **FR-D1 (P0):** accept an Indian UPI ID or HTTPS payment link.
- **FR-D2 (P0):** validate syntax and show the exact value that will appear in drafts.
- **FR-D3 (P0):** support generating a draft without payment details.
- **FR-D4 (P1):** let signed-in users save one default payment method.
- **FR-D5 (P2):** connect Razorpay and reflect verified payment state.

### Story D1 — Add a UPI ID

**As an Indian freelancer, I want my UPI ID in the reminder so that the client can pay without asking for details.**

Acceptance criteria:

1. Leading/trailing whitespace is removed and invalid formats receive a clear inline error.
2. The value is shown for confirmation and inserted as plain text in both channel variants.
3. The app never rewrites the UPI ID through the LLM.
4. Changing the UPI ID invalidates or updates older visible drafts before export.
5. The UI cautions the user to verify the UPI ID because the app does not confirm account ownership in the MVP.

### Story D2 — Add a payment URL

**As a freelancer using Razorpay or another provider, I want to include a payment URL so that the client has a direct path to payment.**

Acceptance criteria:

1. Only valid HTTPS URLs are accepted in the MVP.
2. Script, data, file, and lookalike malformed schemes are rejected.
3. The exact confirmed URL is inserted deterministically after generation.
4. The app labels it “Payment link” without claiming that Invoice Nudge verified or hosts it.

## 6. Feature E — Email and WhatsApp export

### Functional requirements

- **FR-E1 (P0):** copy email subject and body in a clearly documented format.
- **FR-E2 (P0):** construct a WhatsApp click-to-chat URL using an optional recipient number and encoded visible draft.
- **FR-E3 (P0):** provide Copy WhatsApp as a fallback.
- **FR-E4 (P0):** record export events accurately without claiming delivery.
- **FR-E5 (P1):** offer separate copy controls for subject and body.

### Story E1 — Copy an email reminder

**As a user, I want to copy a complete email draft so that I can paste it into my email client.**

Acceptance criteria:

1. Copy Email copies the visible subject and body in a documented, paste-friendly format.
2. On success, the control announces “Email copied” visually and to assistive technology.
3. If clipboard permission fails, the draft remains selectable and the UI explains how to copy manually.
4. Copying creates an `email_copied` event but never a “sent” event.
5. No hidden tracking text is added to the copied message.

### Story E2 — Open a WhatsApp draft

**As a user, I want the app to open a prefilled WhatsApp conversation so that sending takes only a final review and tap.**

Acceptance criteria:

1. When a valid country-code phone number exists, the app creates the documented click-to-chat URL with the edited message safely encoded.
2. The user sees the recipient number and draft before opening WhatsApp.
3. The action opens WhatsApp/Web in a user-initiated navigation and does not claim the message was sent.
4. Without a number, Open in WhatsApp is unavailable and Copy WhatsApp remains available.
5. Invalid numbers preserve the draft and show an actionable correction.

Edge cases: clipboard permission denied, pop-up blocked, extremely long WhatsApp text, missing country code, desktop without WhatsApp, non-Indian client number, special characters, ampersands, and line breaks.

## 7. Feature F — Invoice dashboard and status

### Functional requirements

- **FR-F1 (P0):** show saved invoices in an attention-focused list or table.
- **FR-F2 (P0):** show client, invoice number, amount, due date, status, days overdue, last tone, and last export date where available.
- **FR-F3 (P0):** allow manual transition between Overdue and Paid with confirmation for risky reversals.
- **FR-F4 (P0):** default to invoices needing attention and provide All/Paid filters.
- **FR-F5 (P0):** allow deletion of an invoice and associated draft/file data.
- **FR-F6 (P1):** search by client or invoice number and sort by urgency/amount/due date.
- **FR-F7 (P2):** support partial payments and archived states.

### Story F1 — See overdue work at a glance

**As a freelancer with several clients, I want a compact list of overdue invoices so that I know who needs a follow-up today.**

Acceptance criteria:

1. Default ordering places the most overdue unpaid invoices first.
2. Every row/card shows client, amount, due date, and status without opening details.
3. Last exported tone/date is shown only when an export occurred.
4. Empty state directs the user to upload an overdue invoice.
5. Mobile uses cards or a reduced column set without horizontal scrolling for core data.

### Story F2 — Reopen an invoice and continue

**As a returning user, I want to reopen an overdue invoice so that I can send a firmer follow-up using its existing facts.**

Acceptance criteria:

1. Opening an invoice restores confirmed facts, payment method reference, context, and latest drafts.
2. The app recalculates days overdue at view time.
3. It suggests the next tone based on current lateness and previous exports, without auto-generating or sending.
4. Previous drafts remain distinguishable from the new draft.

### Story F3 — Mark an invoice Paid

**As a user who has received payment, I want to mark an invoice Paid so that it leaves my attention queue.**

Acceptance criteria:

1. Mark Paid requires an explicit click/tap and immediately updates the visible status on success.
2. Paid invoices disappear from the default Overdue filter and remain available under Paid or All.
3. A paid invoice cannot create a new reminder unless the user first marks it Overdue again and confirms the reversal.
4. The MVP labels the state as “Marked paid by you,” not “Payment verified.”

### Story F4 — Delete an invoice

**As a privacy-conscious user, I want to delete an invoice so that its source file and generated content no longer remain in my account.**

Acceptance criteria:

1. The confirmation names the invoice/client and describes what will be removed.
2. Deletion removes or schedules deletion of the source file, extracted text, drafts, and payment association while preserving only legally necessary aggregate billing/audit records.
3. The UI confirms completion and the item no longer appears.
4. A failure leaves the item visible and offers retry; it does not falsely report deletion.

## 8. Feature G — Accounts, usage, and monetization

### Functional requirements

- **FR-G1 (P1):** allow passwordless sign-in through a trusted email flow.
- **FR-G2 (P1):** keep each user's records isolated with database and storage policies.
- **FR-G3 (P1):** meter successful reminder generations, not upload or provider failures.
- **FR-G4 (P1):** present entitlement and remaining usage clearly.
- **FR-G5 (P2):** support ₹299/month and/or ₹99 ten-reminder packs only after pricing validation.

### Story G1 — Save work after first value

**As a first-time user, I want to try the core workflow before creating an account so that I can judge whether it is useful.**

Acceptance criteria:

1. If guest mode is enabled, the product states whether data is temporary and when it expires.
2. The user can create an account after generation without losing the current invoice or draft.
3. Account creation does not trigger automatic messaging or marketing consent.

### Story G2 — Understand usage

**As a paying or trial user, I want to know what consumes a reminder so that billing feels predictable.**

Acceptance criteria:

1. The UI defines a billable reminder before purchase.
2. Extraction and failed generations consume no credit.
3. Regeneration rules are explicit; the recommended rule is that versions for the same invoice within a short session consume one credit.
4. Remaining credits or plan usage are visible near generation and account settings.

## 9. Non-functional requirements

### Performance and reliability

- **NFR-1:** p50 upload-to-draft under 10 seconds for a clean one-page digital PDF under normal provider conditions.
- **NFR-2:** p95 generation request under 20 seconds, with a visible timeout/retry state.
- **NFR-3:** dashboard interactions should feel immediate; target sub-2.5-second largest contentful paint on a typical mid-range mobile connection.
- **NFR-4:** operations that can be retried use idempotency keys to avoid duplicate invoices, reminders, or credits.

### Security and privacy

- **NFR-5:** private object storage with short-lived signed access; no public invoice URLs.
- **NFR-6:** authorization enforced server-side and through row-level security; client-side hiding is insufficient.
- **NFR-7:** LLM and OCR credentials remain server-side; redact secrets from logs.
- **NFR-8:** treat invoice text and user context as untrusted data, not model instructions.
- **NFR-9:** define and disclose source-file, extracted-text, draft, log, and backup retention separately.
- **NFR-10:** provide deletion and an accessible privacy notice before upload.
- **NFR-11:** malware scanning and content-type verification are required before increasing file limits or sharing files with downstream services.

### Accessibility and usability

- **NFR-12:** target WCAG 2.2 AA for core flows.
- **NFR-13:** all functionality works with keyboard and screen reader; focus order follows the visual task flow.
- **NFR-14:** normal text contrast is at least 4.5:1 and status is never communicated by color alone.
- **NFR-15:** touch targets are at least 44×44 CSS pixels.
- **NFR-16:** errors are associated with fields and summarized at submission when helpful.

### Compatibility and localization

- **NFR-17:** support current major Chrome, Safari, Firefox, and Edge releases, including iOS Safari and Android Chrome.
- **NFR-18:** render INR with Indian digit grouping and never infer currency solely from the `₹` glyph when the document is ambiguous.
- **NFR-19:** outward copy defaults to plain Indian English without slang, honorific assumptions, or culture-specific familiarity.

## 10. Release acceptance checklist

- P0 stories pass on desktop and one representative iOS and Android viewport.
- A seeded test set covers digital PDFs, photographed invoices, rotated images, ambiguous dates, multiple totals, and extraction failure.
- Every generated factual token can be traced to confirmed structured input.
- Cross-user access tests fail safely for database rows and storage objects.
- File deletion and account/session cleanup have been verified end to end.
- WhatsApp links are tested with spaces, line breaks, `&`, `?`, Unicode, and Indian/non-Indian E.164 numbers.
- No screen says “sent,” “delivered,” or “paid automatically” for manual/export-only events.
- Privacy notice, AI disclosure, terms, and support route are reachable before launch.

