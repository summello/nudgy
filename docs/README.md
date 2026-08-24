# Invoice Nudge documentation

Invoice Nudge helps an Indian freelancer turn an overdue invoice into a polished, payment-ready follow-up in under 10 seconds.

> Upload an unpaid invoice. Get the perfect follow-up in 10 seconds.

## Documents

| Document | Purpose |
| --- | --- |
| [Product plan](./product-plan.md) | Product strategy, audience, scope, user journey, success measures, and go-to-market assumptions |
| [Requirements and stories](./requirements.md) | Functional and non-functional requirements, detailed user stories, acceptance criteria, and edge cases |
| [Technical plan](./technical-plan.md) | Proposed architecture, data model, AI contract, security controls, and implementation sequence |
| [Roadmap](./roadmap.md) | One-day MVP plan, release gates, follow-on phases, and prioritized backlog |
| [Design system](./design-system.md) | Visual direction, tokens, components, responsive behavior, accessibility, and product-specific UI patterns |

## Product boundaries

The first release is a drafting and tracking assistant, not an accounting product or an automated collections agent. It:

- accepts PDF and image invoices;
- extracts the client, amount, invoice number, and due date for user confirmation;
- creates Indian-English email and WhatsApp drafts in Friendly, Firm, or Final Notice tones;
- includes a user-supplied UPI ID or payment URL;
- opens WhatsApp click-to-chat or copies an email draft;
- lets the user mark an invoice Paid or Overdue.

It does **not** automatically send messages, verify payments, sync accounting systems, generate invoices, calculate tax, or provide legal advice in version one.

## Product decisions at a glance

- **Primary user:** India-based freelancer, consultant, designer, or owner of a small service agency.
- **Primary job:** write an appropriately firm payment reminder without damaging a client relationship.
- **Core activation event:** user generates their first usable reminder.
- **North-star candidate:** reminders exported per weekly active user.
- **MVP stack:** Next.js, TypeScript, Supabase, an LLM with structured output, server-side PDF/image extraction, and WhatsApp click-to-chat.
- **Commercial hypotheses:** ₹299/month or ₹99 for a pack of ten reminders; validate willingness to pay before building billing.

## Status vocabulary

Use these terms consistently across product, code, analytics, and support:

- **Processing:** the invoice file is being parsed.
- **Needs review:** extraction completed but one or more fields need confirmation.
- **Overdue:** the invoice is unpaid and its due date is before today.
- **Paid:** the user has manually confirmed payment.
- **Draft:** a generated reminder that has not been exported.
- **Exported:** a reminder copied or opened in WhatsApp. This does not prove it was sent.

## Source notes

The market premise and the “85%” late-payment figure were supplied with the brief. The statistic should not be used in public marketing until its original survey, sample, geography, and publication date are verified. [Duepy](https://www.duepy.com/) and [NowPaid](https://www.nowpaid.io/) are directional validation that invoice tracking, staged reminders, tone selection, WhatsApp/email workflows, and payment actions exist as a paid product category; they are not evidence of Invoice Nudge product-market fit.

