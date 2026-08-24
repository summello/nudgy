# Invoice Nudge design system

## 1. Design direction

The interface should feel like a calm, capable studio assistant: financially trustworthy without looking like bank software, warm without becoming playful, and modern without decorative excess.

Use a light, paper-like canvas; deep ink text; a saturated indigo primary action; and a restrained marigold accent that nods to Indian warmth without becoming a flag-colored theme. Dense financial facts live in crisp cards, while the drafting workspace has generous breathing room.

### Experience attributes

- **Calm:** one primary action per view, low visual noise, no alarmist overdue treatment.
- **Precise:** tabular numerals, unambiguous dates, visible source facts, consistent statuses.
- **Human:** clear Indian-English microcopy and supportive, direct errors.
- **Fast:** progressive disclosure, sensible defaults, obvious keyboard and mobile actions.
- **Trustworthy:** explain AI, retain user control, and distinguish suggestions from facts.

## 2. Brand foundation

### Working name

**Invoice Nudge** is the product name. In compact navigation the wordmark may use **Nudge** if product context is already clear. Avoid abbreviating to “IN,” which collides with the country code and generic words.

### Voice

- Direct, calm, and constructive.
- Prefer “Check invoice details” to “AI extraction results.”
- Prefer “Open in WhatsApp” to “Send via WhatsApp.”
- Prefer “Marked paid by you” to “Payment successful” for manual status.
- Never shame the freelancer or their client.
- Avoid exclamation marks in financial-status and error messages.

### Sample product copy

- Upload helper: “PDF, PNG, or JPG. Your invoice stays private.”
- Processing: “Reading the invoice…” then “Checking payment details…”
- Review prompt: “Give these details a quick check. We’ll only use what you confirm.”
- Tone recommendation: “Firm is suggested: this invoice is 14 days overdue and has one previous reminder.”
- Success feedback: “Email copied. Review it once more in your email app before sending.”
- Empty dashboard: “No overdue invoices here. That’s a good list to keep empty.”

## 3. Color system

All foreground/background pairs must be verified for WCAG 2.2 AA in the actual component state.

| Token | Light value | Use |
| --- | --- | --- |
| `--canvas` | `#F7F7F2` | App background; warm paper tone |
| `--surface` | `#FFFFFF` | Cards, forms, elevated work areas |
| `--surface-subtle` | `#F0F1EC` | Secondary panels, table headers |
| `--ink` | `#17201E` | Primary text |
| `--ink-muted` | `#5D6763` | Supporting text |
| `--border` | `#DDE1DB` | Default dividers and inputs |
| `--border-strong` | `#AEB8B2` | Hover/strong separation |
| `--primary` | `#4F46E5` | Main actions, active focus-bearing UI |
| `--primary-hover` | `#4338CA` | Primary hover |
| `--primary-soft` | `#EEEDFF` | Selected cards and soft highlight |
| `--accent` | `#D97706` | Small highlights and recommended badge |
| `--accent-soft` | `#FFF4D8` | Recommendation surface |
| `--success` | `#147D64` | Paid/success foreground |
| `--success-soft` | `#E4F5EF` | Paid/success background |
| `--warning` | `#A85B00` | Needs review foreground |
| `--warning-soft` | `#FFF0D5` | Needs review background |
| `--danger` | `#B42318` | Destructive/error foreground |
| `--danger-soft` | `#FEECEB` | Destructive/error background |
| `--focus` | `#2563EB` | Keyboard focus ring |

### Dark mode

Dark mode is not required for the one-day MVP. When added, design semantic tokens rather than inverting colors. Invoice previews should remain paper-like unless a fully tested dark document surface exists.

### Status treatment

- Overdue: neutral ink plus a small warning dot/badge; avoid turning entire rows red.
- Needs review: warning icon, label, and soft amber surface.
- Paid: check icon, “Paid” text, and success color.
- Processing: spinner/progress shape plus text.
- Never rely on hue alone.

## 4. Typography

Use **Inter Variable** or a system sans fallback for UI. Use **Source Serif 4** sparingly for the landing-page promise or testimonial pull quotes; the product workflow remains sans-serif for speed and clarity. If external fonts harm performance or privacy, use the system stack.

```css
--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
--font-serif: "Source Serif 4", Georgia, serif;
--font-mono: "SFMono-Regular", Consolas, monospace;
```

| Style | Size / line-height | Weight | Use |
| --- | --- | --- | --- |
| Display | `48 / 52px` | 650 | Desktop landing promise only |
| H1 | `36 / 42px` | 650 | Page title |
| H2 | `28 / 34px` | 650 | Major section |
| H3 | `20 / 26px` | 600 | Card or panel title |
| Body large | `18 / 28px` | 400 | Introductory copy |
| Body | `16 / 24px` | 400 | Default text and inputs |
| Body small | `14 / 20px` | 400 | Supporting metadata |
| Label | `14 / 18px` | 600 | Field labels and compact controls |
| Caption | `12 / 16px` | 500 | Badges and terse metadata |

On small screens, Display becomes `36 / 40px` and H1 becomes `30 / 36px`. Use `font-variant-numeric: tabular-nums` for amounts, dates in tables, counts, and days overdue.

## 5. Layout, spacing, and shape

### Spacing scale

Use a 4px base:

| Token | Value |
| --- | --- |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

### Grid

- Maximum app width: `1200px`; reading/form column: `720px`.
- Desktop workspace: 12 columns, 24px gutters; source/review split approximately 5/7.
- Tablet: 8 columns, 20px gutters.
- Mobile: 4 columns, 16px outer padding; stack source preview above fields/draft.
- Keep the primary action within the form reading column, not detached at the far page edge.

### Radius and elevation

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `8px` | Badges, compact controls |
| `--radius-md` | `12px` | Inputs, buttons |
| `--radius-lg` | `18px` | Cards and drop zone |
| `--radius-xl` | `24px` | Hero/workspace container |
| `--shadow-1` | `0 1px 2px rgb(23 32 30 / 0.06)` | Inputs/cards |
| `--shadow-2` | `0 12px 32px rgb(23 32 30 / 0.10)` | Dialogs/floating panels |

Use borders more often than shadows. Avoid glassmorphism, heavy gradients, floating blobs, and excessive pill shapes; they reduce the sense of precision.

## 6. Core components

### Button

Variants:

- **Primary:** indigo fill, white text. One per task region.
- **Secondary:** white/surface fill, ink text, border.
- **Quiet:** transparent, muted text; for low-priority actions.
- **Danger:** danger foreground or fill only for confirmed destructive actions.

Sizes: 40px compact, 44px default, 48px prominent. All icons need text unless the meaning is universally understood and an accessible name is present. Loading retains width and replaces/augments the label with progress, never disables the whole page.

### Input

- Label above control, helper/error below.
- Default height 44px; multiline editor min-height 160px.
- Currency input visually separates `₹` from the editable number but exposes a coherent accessible name.
- Focus uses a 2px `--focus` ring with 2px offset.
- Error uses border, icon, and text; do not clear the user's value.

### Drop zone

- Dashed strong border on the subtle surface, upload icon, direct heading, type/size helper.
- Drag-over changes border and surface without causing layout shift.
- Provide a real file input/button; dragging is supplementary.
- Once selected, replace with a file card showing filename, size, Replace, and processing status.

### Step indicator

Four steps: Upload, Check details, Choose tone, Draft. Show text labels on desktop and current/total text on very narrow screens. Completed does not mean irreversible; users can return without losing work.

### Tone card

- Radio-card pattern with name, description, sample fragment, and optional Recommended badge.
- Selected state uses primary border, primary-soft background, and a checked radio.
- Final Notice uses normal surface treatment; do not make it visually red or punitive.

### Invoice fact row

Pairs a label/input with optional confidence state and source evidence link. Amount and due date receive highest prominence. Low confidence says “Please check” and identifies why if known.

### Reminder editor

- Channel tabs: Email and WhatsApp.
- Email shows subject input plus body editor; WhatsApp shows character-conscious body editor.
- A non-editable facts strip above the editor repeats client, amount, due date, and payment method.
- Actions remain near the editor: Regenerate (secondary), Copy/Open (primary).
- User edits display “Edited” and save state; regeneration protects unsaved/edited content.

### Invoice card/table row

Desktop columns: client/invoice, amount, due date, overdue age, last action, status, overflow actions. Mobile card: client/status header, large amount, due/overdue line, last action, full-width Continue button.

### Badge

Use small rounded rectangles, not fully pill-shaped capsules for every label. Pair semantic colors with text and, where useful, a 14–16px icon.

### Toast and inline notice

Toasts confirm transient actions such as copy. Errors that block progress stay inline near the failed region. Toasts last long enough to read, pause on hover/focus, and announce politely. Never use only a toast for destructive or financial-state changes.

### Dialog

Reserve for delete and reversing Paid to Overdue. Title names the action, body states consequences, safest action receives initial focus, and destructive confirmation uses an explicit label such as “Delete invoice.”

## 7. Product screen patterns

### Landing/upload

- Minimal top bar with wordmark, Privacy, and Sign in if enabled.
- Two-column desktop hero: promise and trust points on the left, upload card on the right.
- On mobile, promise, one-line explanation, upload, then trust points.
- Do not place pricing or a long feature grid before the upload action.

### Extraction review

- Desktop split: sticky document preview left, editable fact card right.
- Mobile: collapsible source preview followed by fields.
- Start with a concise alert if any field needs review.
- Footer action bar shows Back and “Confirm details.” It must not obscure fields when the keyboard is open.

### Tone and context

- Tone cards first, recommended explanation second, optional context collapsed under “Help me personalize it.”
- Payment action is a compact choice between UPI, Payment link, and None.
- Show a tiny, live sample only if it does not trigger a paid generation.

### Draft workspace

- Success headline: “Your follow-up is ready,” not a celebratory animation.
- Facts strip, channel tabs, editor, and primary export action in one visual surface.
- Place the AI disclaimer near Regenerate: “AI-written; review before sending.”
- Secondary next actions: save/return to invoices, mark Paid only from the invoice detail context.

### Dashboard

- Header includes “Invoices,” total overdue amount, and Upload invoice.
- Filter tabs: Overdue, Paid, All. The default Overdue count is visible.
- Avoid vanity charts in MVP; a clear action list is more useful.
- Use skeletons shaped like rows/cards during loading and a true empty state when complete.

## 8. Responsive behavior

- Breakpoints are content-driven; suggested starting points are 640px, 768px, and 1024px.
- Below 768px, collapse split panes, use a bottom-safe action region, and make primary actions full width where appropriate.
- Never hide amount, client, due date, or status to preserve a desktop table.
- Document preview may become a modal/full-screen sheet on mobile, with an obvious return action.
- Test at 320px width, 200% zoom, landscape mobile, and with the software keyboard open.

## 9. Interaction and motion

- Standard transitions: 120–180ms with ease-out for hover, selection, and disclosure.
- Step changes may use a 180ms fade/translate of no more than 8px.
- Processing uses a restrained progress indicator and rotating status text only when it reflects real stages.
- Respect `prefers-reduced-motion`; remove transforms and looping decoration.
- Do not use confetti for payment-related states. A check icon and calm confirmation are enough.

## 10. Iconography and imagery

- Use one consistent 1.75–2px stroke icon set.
- Prefer literal icons: upload, file, check, copy, external/open, message, mail, trash.
- Avoid money-bag, alarm-siren, angry-face, or debt-collector imagery.
- Marketing imagery, if introduced, should show an independent professional calmly closing work—not piles of bills or distressed clients.

## 11. Accessibility specifications

- Meet WCAG 2.2 AA for the complete P0 journey.
- Use native elements before ARIA: buttons, inputs, radios, progress, table semantics.
- Provide a skip link and clear landmark structure.
- Move focus to the step heading after explicit step navigation; on validation failure, focus the error summary or first invalid field.
- Announce upload/generation progress without flooding the live region.
- Ensure editor labels include the channel and field, such as “Email subject.”
- Do not trap focus outside a modal; restore it to the triggering control on close.
- Maintain 44×44px touch targets and visible focus in every theme/state.

## 12. Content patterns

### Dates and money

- Display: `₹48,500` and `24 Aug 2026`.
- In reminders, use `₹48,500` and “24 August 2026” when prose benefits from the full month.
- Never show more decimals than the invoice confirms.
- Pair relative time with an absolute due date: “14 days overdue · Due 10 Aug 2026.”

### Errors

Use: what happened, likely reason if known, and next action.

- Good: “We couldn’t read this PDF. It may be password-protected. Upload an unlocked copy or enter the details manually.”
- Avoid: “OCR_PROCESSING_ERROR_422.”
- Avoid: “Something went wrong” when a specific recovery is known.

### AI transparency

- Before generation: “We use AI to draft from the details you confirm.”
- At the editor: “Review before sending. Invoice Nudge never sends automatically.”
- When blocked by validation: “We couldn’t create a safe draft from these details. Your invoice is saved; try again.”

## 13. Token starter

```css
:root {
  --canvas: #f7f7f2;
  --surface: #ffffff;
  --surface-subtle: #f0f1ec;
  --ink: #17201e;
  --ink-muted: #5d6763;
  --border: #dde1db;
  --border-strong: #aeb8b2;
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-soft: #eeedff;
  --accent: #d97706;
  --accent-soft: #fff4d8;
  --success: #147d64;
  --success-soft: #e4f5ef;
  --warning: #a85b00;
  --warning-soft: #fff0d5;
  --danger: #b42318;
  --danger-soft: #feeceb;
  --focus: #2563eb;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --shadow-1: 0 1px 2px rgb(23 32 30 / 6%);
  --shadow-2: 0 12px 32px rgb(23 32 30 / 10%);
}
```

## 14. Design QA checklist

- The primary task is obvious within five seconds on each screen.
- Invoice facts remain visible when reviewing or exporting a draft.
- “Open,” “Copy,” “Exported,” and “Paid” are used accurately.
- Every screen has loading, empty, success, error, and small-screen states where applicable.
- Focus, hover, active, disabled, and error states are designed—not browser accidents.
- Amounts use tabular numerals and Indian grouping.
- Color and iconography never make Final Notice feel threatening.
- At 200% zoom and 320px width, no core action or fact is lost.
- Reduced-motion and screen-reader announcements are tested.
- No component exposes private invoice content in URLs, analytics labels, or error messages.

