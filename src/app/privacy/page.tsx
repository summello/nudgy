import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Invoice Nudge",
  description: "How Invoice Nudge handles your invoice data, extracted information, and generated reminders.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-h3 text-ink font-semibold">Invoice Nudge</Link>
          <Link href="/" className="text-body-sm text-ink-muted hover:text-ink">← Back</Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-10">
          <header className="space-y-4">
            <h1 className="text-h1 text-ink">Privacy Policy</h1>
            <p className="text-body-lg text-ink-muted">Last updated: August 2026</p>
          </header>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">1. What we collect</h2>
            <ul className="space-y-3 text-body text-ink-muted list-disc list-inside">
              <li>Invoice files you upload (PDF, PNG, JPG) — processed to extract payment details</li>
              <li>Extracted invoice facts: client name, amount, currency, due date, invoice number</li>
              <li>Information you confirm or enter manually during review</li>
              <li>Optional context: contact name, relationship notes, prior reminder history</li>
              <li>Payment method you provide (UPI ID or HTTPS payment URL)</li>
              <li>Generated reminder drafts and your edits</li>
              <li>Export events (copy email, open WhatsApp) — not message content</li>
              <li>Technical metadata: file type, size, processing time, error categories</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">2. How we use your data</h2>
            <ul className="space-y-3 text-body text-ink-muted list-disc list-inside">
              <li>Extract invoice facts so you don't have to retype them</li>
              <li>Generate reminder drafts in your chosen tone and channel</li>
              <li>Let you copy email drafts or open pre-filled WhatsApp conversations</li>
              <li>Show your invoice dashboard with status and history</li>
              <li>Improve extraction accuracy (only with your explicit consent)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">3. What we do NOT do</h2>
            <ul className="space-y-3 text-body text-ink-muted list-disc list-inside">
              <li>Never send messages automatically — you copy or open WhatsApp yourself</li>
              <li>Never mark invoices as paid automatically — only you can do that</li>
              <li>Never share your invoice data with third parties for advertising</li>
              <li>Never use your invoice content to train AI models (unless you explicitly opt in)</li>
              <li>Never store your files longer than necessary</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">4. Data retention</h2>
            <ul className="space-y-3 text-body text-ink-muted list-disc list-inside">
              <li>Uploaded files: deleted after extraction completes (or on your request)</li>
              <li>Extracted text: retained only while you have the invoice saved</li>
              <li>Generated drafts: retained while the invoice exists</li>
              <li>Export events: retained for 90 days for your dashboard</li>
              <li>Account deletion: removes all associated data within 30 days</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">5. Your control</h2>
            <ul className="space-y-3 text-body text-ink-muted list-disc list-inside">
              <li>Delete any invoice and all its data at any time</li>
              <li>Review and correct every extracted fact before generation</li>
              <li>Edit or regenerate drafts as many times as you need</li>
              <li>Export (copy/open) creates no delivery claim — you decide when to send</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">6. Subprocessors</h2>
            <p className="text-body text-ink-muted">We use the following subprocessors to provide the service:</p>
            <ul className="space-y-2 text-body text-ink-muted list-disc list-inside">
              <li><strong>Supabase</strong> — Authentication, database, and private file storage (EU/US)</li>
              <li><strong>Vercel</strong> — Hosting and edge functions (Global)</li>
              <li><strong>LLM Provider</strong> — Structured reminder generation (varies by model)</li>
              <li><strong>OCR/Vision Provider</strong> — Image text extraction when needed (varies by provider)</li>
            </ul>
            <p className="text-body text-ink-muted">All subprocessors are bound by data processing agreements. No invoice content is sent to analytics or error tracking services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">7. Security</h2>
            <ul className="space-y-3 text-body text-ink-muted list-disc list-inside">
              <li>Files stored in private Supabase buckets with signed, short-lived URLs</li>
              <li>Row-level security enforces data isolation at the database level</li>
              <li>All API credentials kept server-side; never exposed to the browser</li>
              <li>HTTPS everywhere; Content Security Policy enforced</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">8. AI transparency</h2>
            <p className="text-body text-ink-muted">
              We use large language models to draft reminder text from the structured facts you confirm.
              The model never sees your raw invoice file — only the confirmed data fields.
              You review and approve every draft before exporting. Invoice Nudge never sends messages on your behalf.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-ink">9. Contact</h2>
            <p className="text-body text-ink-muted">Questions about this policy or your data? Email us at <a href="mailto:privacy@invoicenudge.app" className="underline hover:text-ink">privacy@invoicenudge.app</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-8">
        <div className="max-w-3xl mx-auto text-center text-body-sm text-ink-muted">
          <p>Invoice Nudge — Built for Indian freelancers.</p>
        </div>
      </footer>
    </div>
  );
}