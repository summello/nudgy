"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Textarea } from "./Input";
import { Badge } from "./Badge";

export interface ReminderEditorProps {
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
  onWhatsAppBodyChange: (value: string) => void;
  onRegenerate: () => void;
  onCopyEmail: () => void;
  onOpenWhatsApp: () => void;
  onCopyWhatsApp: () => void;
  onWhatsAppNumberChange?: (value: string) => void;
  regenerating?: boolean;
  copying?: boolean;
  whatsappNumber?: string;
  facts: {
    clientName: string;
    amount: string;
    dueDate: string;
    paymentMethod?: string;
  };
}

export function ReminderEditor({
  emailSubject,
  emailBody,
  whatsappBody,
  onEmailSubjectChange,
  onEmailBodyChange,
  onWhatsAppBodyChange,
  onRegenerate,
  onCopyEmail,
  onOpenWhatsApp,
  onCopyWhatsApp,
  onWhatsAppNumberChange,
  regenerating,
  copying,
  whatsappNumber,
  facts,
}: ReminderEditorProps) {
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  const [emailEdited, setEmailEdited] = useState(false);
  const [whatsappEdited, setWhatsAppEdited] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneHint, setPhoneHint] = useState(false);
  const [subjectCopied, setSubjectCopied] = useState(false);

  const handleEmailSubjectChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onEmailSubjectChange(e.target.value);
    setEmailEdited(true);
  };

  const handleEmailBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onEmailBodyChange(e.target.value);
    setEmailEdited(true);
  };

  const handleWhatsAppBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onWhatsAppBodyChange(e.target.value);
    setWhatsAppEdited(true);
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(num / 100);
  };

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-h3 text-ink">Your follow-up is ready</h3>
        <span className="text-body-sm text-ink-muted">AI-written — review before sending</span>
      </div>

      <div className="p-4 bg-surface-subtle rounded-lg border border-border space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-body-sm">
          <span className="font-medium text-ink">Client:</span>
          <span className="text-ink-muted">{facts.clientName}</span>
          <span className="font-medium text-ink">Amount:</span>
          <span className="text-ink tabular-nums">{formatAmount(facts.amount)}</span>
          <span className="font-medium text-ink">Due:</span>
          <span className="text-ink-muted">{facts.dueDate}</span>
          {facts.paymentMethod && (
            <>
              <span className="font-medium text-ink">Payment:</span>
              <span className="text-ink-muted">{facts.paymentMethod}</span>
            </>
          )}
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-1 p-1" role="tablist" aria-label="Channel">
          <button
            role="tab"
            aria-selected={activeTab === "email"}
            aria-controls="email-panel"
            id="email-tab"
            onClick={() => setActiveTab("email")}
            className={cn(
              "px-4 py-2 rounded-md text-label font-medium transition-colors",
              activeTab === "email" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
            )}
          >
            Email
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "whatsapp"}
            aria-controls="whatsapp-panel"
            id="whatsapp-tab"
            onClick={() => setActiveTab("whatsapp")}
            className={cn(
              "px-4 py-2 rounded-md text-label font-medium transition-colors",
              activeTab === "whatsapp" ? "bg-primary text-white" : "text-ink-muted hover:text-ink"
            )}
          >
            WhatsApp
          </button>
        </nav>
      </div>

      <div role="tabpanel" id="email-panel" aria-labelledby="email-tab" hidden={activeTab !== "email"}>
        <div className="space-y-4">
          <div>
            <div className="flex items-end justify-between gap-2">
              <label htmlFor="email-subject" className="label">Subject</label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(emailSubject);
                    setSubjectCopied(true);
                    setTimeout(() => setSubjectCopied(false), 2000);
                  } catch { /* clipboard unavailable — field is selectable */ }
                }}
                className="btn btn-quiet btn-sm !min-h-0 py-1"
                aria-label="Copy subject only"
              >
                {subjectCopied ? "Copied" : "Copy subject"}
              </button>
            </div>
            <textarea
              id="email-subject"
              value={emailSubject}
              onChange={handleEmailSubjectChange}
              placeholder="Subject line"
              rows={1}
              className="input"
            />
          </div>
          <Textarea
            label="Body"
            value={emailBody}
            onChange={handleEmailBodyChange}
            placeholder="Email body…"
            rows={12}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" onClick={onCopyEmail} loading={copying} className="flex-1">
              Copy Email
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (emailEdited && !confirm("Regenerate will overwrite your edits. Continue?")) return;
                onRegenerate();
              }}
              loading={regenerating}
            >
              Regenerate
            </Button>
          </div>
          {emailEdited && (
            <p className="text-body-sm text-accent flex items-center gap-1">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Edited — changes will be used when you copy
            </p>
          )}
        </div>
      </div>

      <div role="tabpanel" id="whatsapp-panel" aria-labelledby="whatsapp-tab" hidden={activeTab !== "whatsapp"}>
        <div className="space-y-4">
          <Textarea
            label="Message"
            value={whatsappBody}
            onChange={handleWhatsAppBodyChange}
            placeholder="WhatsApp message…"
            rows={8}
            helperText={`Character count: ${whatsappBody.length} / 1600`}
          />
          <div className="flex items-center gap-3 pt-2">
            {whatsappNumber ? (
              <Button variant="primary" onClick={onOpenWhatsApp} loading={copying} className="flex-1">
                Open in WhatsApp
              </Button>
            ) : (
              <Button variant="primary" onClick={onCopyWhatsApp} loading={copying} className="flex-1" disabled>
                Open in WhatsApp (add phone number)
              </Button>
            )}
            <Button variant="secondary" onClick={onCopyWhatsApp} loading={copying}>
              Copy WhatsApp
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (whatsappEdited && !confirm("Regenerate will overwrite your edits. Continue?")) return;
                onRegenerate();
              }}
              loading={regenerating}
            >
              Regenerate
            </Button>
          </div>
          {!whatsappNumber && onWhatsAppNumberChange && (
            <div className="p-3 bg-surface-subtle rounded-lg border border-border space-y-2">
              <p className="text-body-sm text-ink-muted">
                Add the client's WhatsApp number to open this draft pre-filled:
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => { setPhoneDraft(e.target.value); setPhoneHint(false); }}
                  placeholder="+91 98765 43210"
                  aria-label="Client WhatsApp number"
                  className="input flex-1"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const digits = phoneDraft.replace(/[^\d]/g, "");
                    if (digits.length < 10) { setPhoneHint(true); return; }
                    onWhatsAppNumberChange(`+${digits}`);
                  }}
                >
                  Use number
                </Button>
              </div>
              {phoneHint && (
                <p className="error-text" role="alert">Enter a valid number with country code, e.g. +91 98765 43210.</p>
              )}
            </div>
          )}
          {whatsappEdited && (
            <p className="text-body-sm text-accent flex items-center gap-1">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Edited — changes will be used when you copy or open
            </p>
          )}
        </div>
      </div>
    </div>
  );
}