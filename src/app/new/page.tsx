"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StepIndicator } from "@/components/ui";
import { DropZone } from "@/components/ui";
import { FactRow } from "@/components/ui";
import { ToneCard } from "@/components/ui";
import { ReminderEditor } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Toast, ToastContainer } from "@/components/ui";
import { Dialog, AlertDialog } from "@/components/ui";
import { formatAmount, formatDate, parseAmount, validateUPI, validatePaymentUrl, validateE164Phone, getDaysOverdue, getToneRecommendation, getToneRecommendationReason, generateOperationId } from "@/lib/utils";
import { generateDraft, validateDraft } from "@/lib/templates";
import { ConfirmedInvoice, ReminderContext, PaymentMethod, ReminderDraft, Tone, ExtractedInvoice } from "@/types";
import { confirmedInvoiceSchema, reminderContextSchema, paymentMethodSchema } from "@/lib/schemas";

const STEPS = [
  { label: "Upload" },
  { label: "Check details" },
  { label: "Choose tone" },
  { label: "Draft" },
];

const initialExtracted: ExtractedInvoice = {
  clientName: { value: "", confidence: "missing" },
  contactName: { value: null, confidence: "missing" },
  contactPhoneE164: { value: null, confidence: "missing" },
  invoiceNumber: { value: null, confidence: "missing" },
  amountDueMinor: { value: 0, confidence: "missing" },
  currency: { value: "INR", confidence: "high" },
  issueDate: { value: null, confidence: "missing" },
  dueDate: { value: null, confidence: "missing" },
};

const initialContext: ReminderContext = {};

function NewInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedInvoice>(initialExtracted);
  const [confirmed, setConfirmed] = useState<ConfirmedInvoice | null>(null);
  const [tone, setTone] = useState<Tone>("friendly");
  const [context, setContext] = useState<ReminderContext>(initialContext);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [draft, setDraft] = useState<ReminderDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copying, setCopying] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [emailEdited, setEmailEdited] = useState(false);
  const [whatsappEdited, setWhatsAppEdited] = useState(false);
  const [upiError, setUpiError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [paymentKind, setPaymentKind] = useState<"upi" | "payment_url" | "none">("none");
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = generateOperationId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setExtracted(initialExtracted);
    setConfirmed(null);
    setDraft(null);
    setFileId(null);
    setInvoiceId(null);
    setReminderId(null);
    setStep(1);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setFileId(null);
    setExtracted(initialExtracted);
    setConfirmed(null);
    setDraft(null);
    setInvoiceId(null);
    setReminderId(null);
    setStep(1);
  }, []);

  const uploadFile = useCallback(async (f: File) => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("sessionId", "guest");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setFileId(result.fileId);
      return result.fileId;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      addToast(message, "error");
      return null;
    } finally {
      setProcessing(false);
    }
  }, [addToast]);

  const extractInvoice = useCallback(async (fId: string) => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: fId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Extraction failed");
      }

      // Convert extracted data to ExtractedInvoice format
      const extractedData = result.extracted;
      setExtracted(extractedData);
      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      setError(message);
      addToast(message, "error");
    } finally {
      setProcessing(false);
    }
  }, [addToast]);

  const handleFileSelectWithUpload = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setExtracted(initialExtracted);
    setConfirmed(null);
    setDraft(null);
    setFileId(null);
    setInvoiceId(null);
    setReminderId(null);
    setStep(1);

    const uploadedFileId = await uploadFile(f);
    if (uploadedFileId) {
      await extractInvoice(uploadedFileId);
    }
  }, [uploadFile, extractInvoice]);

  const updateConfirmed = useCallback((field: keyof ConfirmedInvoice, value: string | number) => {
    if (!confirmed) return;
    const updated = { ...confirmed, [field]: value };
    setConfirmed(updated);
    if (step === 4 && draft) {
      const newDraft = generateDraft(tone, updated, context, paymentMethod || undefined);
      const errors = validateDraft(newDraft, updated, paymentMethod || undefined);
      if (errors.length === 0) {
        setDraft(newDraft);
      }
    }
  }, [confirmed, step, draft, tone, context, paymentMethod]);

  const handleConfirmDetails = useCallback(() => {
    if (!confirmed) return;

    const validation = confirmedInvoiceSchema.safeParse(confirmed);
    if (!validation.success) {
      addToast("Please fix the highlighted fields", "error");
      return;
    }

    const daysOverdue = getDaysOverdue(confirmed.dueDate);
    if (daysOverdue < 0) {
      addToast("This invoice is not overdue yet. Invoice Nudge is for overdue invoices.", "error");
      return;
    }

    const priorCount = context.priorReminderCount || 0;
    const recommended = getToneRecommendation(daysOverdue, priorCount);
    setTone(recommended);
    setStep(3);
  }, [confirmed, context, addToast]);

  const handleToneSelect = useCallback((t: Tone) => {
    setTone(t);
  }, []);

  const handleContextChange = useCallback((field: keyof ReminderContext, value: string | number) => {
    setContext((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePaymentKindChange = useCallback((kind: "upi" | "payment_url" | "none") => {
    setPaymentKind(kind);
    setPaymentMethod(null);
    setUpiError("");
    setUrlError("");
  }, []);

  const handlePaymentMethodSubmit = useCallback(() => {
    if (paymentKind === "upi") {
      const validation = validateUPI(context.customNote || "");
      setUpiError(validation.error || "");
      if (validation.valid) {
        const upiValue = context.customNote || "";
        setPaymentMethod({ id: generateOperationId(), kind: "upi", value: upiValue, label: "UPI", isDefault: false });
        setPaymentKind("none");
        setContext((prev) => ({ ...prev, customNote: "" }));
      }
    } else if (paymentKind === "payment_url") {
      const validation = validatePaymentUrl(context.customNote || "");
      setUrlError(validation.error || "");
      if (validation.valid) {
        const urlValue = context.customNote || "";
        setPaymentMethod({ id: generateOperationId(), kind: "payment_url", value: urlValue, label: "Payment link", isDefault: false });
        setPaymentKind("none");
        setContext((prev) => ({ ...prev, customNote: "" }));
      }
    }
  }, [paymentKind, context]);

  const handleGenerate = useCallback(async () => {
    if (!confirmed || !invoiceId) return;
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          invoice: confirmed,
          tone,
          context,
          paymentMethod,
          daysOverdue: getDaysOverdue(confirmed.dueDate),
          promptVersion: "v1",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Generation failed");
      }

      setDraft(result.draft);
      setReminderId(result.reminderId);
      setStep(4);
      setEmailEdited(false);
      setWhatsAppEdited(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate draft. Please try again.";
      setError(message);
      addToast(message, "error");
    } finally {
      setGenerating(false);
    }
  }, [confirmed, invoiceId, tone, context, paymentMethod, addToast]);

  const handleRegenerate = useCallback(async () => {
    if (!reminderId) return handleGenerate();
    
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderId,
          tone,
          context,
          paymentMethod,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Regeneration failed");
      }

      setDraft(result.draft);
      setReminderId(result.reminderId);
      setEmailEdited(false);
      setWhatsAppEdited(false);
      addToast("Draft regenerated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to regenerate draft";
      setError(message);
      addToast(message, "error");
    } finally {
      setGenerating(false);
    }
  }, [reminderId, tone, context, paymentMethod, handleGenerate, addToast]);

  const handleCopyEmail = useCallback(async () => {
    if (!draft) return;
    setCopying(true);
    try {
      const text = `Subject: ${draft.emailSubject}\n\n${draft.emailBody}`;
      await navigator.clipboard.writeText(text);
      
      // Record export event
      if (reminderId) {
        await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reminderId, action: "email_copied" }),
        });
      }
      
      addToast("Email copied to clipboard");
    } catch {
      addToast("Failed to copy. Please select and copy manually.", "error");
    } finally {
      setCopying(false);
    }
  }, [draft, reminderId, addToast]);

  const handleOpenWhatsApp = useCallback(() => {
    if (!draft || !context.contactPhoneE164) return;
    const phoneValidation = validateE164Phone(context.contactPhoneE164);
    if (!phoneValidation.valid || !phoneValidation.formatted) {
      setPhoneError(phoneValidation.error || "Invalid phone number");
      addToast("Please enter a valid phone number with country code", "error");
      return;
    }
    const url = `https://wa.me/${phoneValidation.formatted.replace("+", "")}?text=${encodeURIComponent(draft.whatsappBody)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    
    // Record export event
    if (reminderId) {
      fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId, action: "whatsapp_opened" }),
      });
    }
    
    addToast("Opened WhatsApp");
  }, [draft, context, reminderId, addToast]);

  const handleCopyWhatsApp = useCallback(async () => {
    if (!draft) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(draft.whatsappBody);
      
      // Record export event
      if (reminderId) {
        await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reminderId, action: "whatsapp_copied" }),
        });
      }
      
      addToast("WhatsApp message copied");
    } catch {
      addToast("Failed to copy. Please select and copy manually.", "error");
    } finally {
      setCopying(false);
    }
  }, [draft, reminderId, addToast]);

  const handleSaveDraft = useCallback(() => {
    addToast("Draft saved. Redirecting to dashboard...");
    setTimeout(() => router.push("/invoices"), 1000);
  }, [addToast, router]);

  const handleMarkPaid = useCallback(() => {
    setShowPaidDialog(true);
  }, []);

  const confirmMarkPaid = useCallback(() => {
    addToast("Invoice marked as paid");
    setShowPaidDialog(false);
    router.push("/invoices");
  }, [addToast, router]);

  const confirmDelete = useCallback(() => {
    addToast("Invoice deleted");
    setShowDeleteDialog(false);
    router.push("/invoices");
  }, [addToast, router]);

  const daysOverdue = confirmed ? getDaysOverdue(confirmed.dueDate) : 0;
  const recommendedTone = confirmed ? getToneRecommendation(daysOverdue, context.priorReminderCount || 0) : "friendly";
  const recommendationReason = confirmed ? getToneRecommendationReason(daysOverdue, context.priorReminderCount || 0) : "";

  const canConfirmDetails = confirmed &&
    confirmed.clientName &&
    confirmed.amountMinor > 0 &&
    confirmed.currency &&
    confirmed.dueDate;

  const canGenerate = confirmed && step === 3;

  // Auto-extract when file is uploaded
  useEffect(() => {
    if (file && !fileId && step === 1 && !processing) {
      handleFileSelectWithUpload(file);
    }
  }, [file, fileId, step, processing, handleFileSelectWithUpload]);

  // When extraction completes, initialize confirmed with extracted values
  useEffect(() => {
    if (step === 2 && extracted.clientName.value) {
      const initialConfirmed: ConfirmedInvoice = {
        clientName: extracted.clientName.value,
        contactName: extracted.contactName?.value || undefined,
        contactPhoneE164: extracted.contactPhoneE164?.value || undefined,
        invoiceNumber: extracted.invoiceNumber?.value || undefined,
        amountMinor: extracted.amountDueMinor.value,
        currency: extracted.currency.value,
        issueDate: extracted.issueDate?.value || undefined,
        dueDate: extracted.dueDate.value || "",
      };
      setConfirmed(initialConfirmed);
    }
  }, [extracted, step]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-h3 text-ink font-semibold">Invoice Nudge</Link>
          <span className="text-body-sm text-ink-muted">Step {step} of 4</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <StepIndicator currentStep={step} totalSteps={4} steps={STEPS} className="mb-8" />

          {error && (
            <div className="mb-6 p-4 bg-danger-soft border border-danger text-danger rounded-lg text-body-sm" role="alert">
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <Card className="max-w-xl mx-auto">
              <div className="p-6 space-y-4">
                <h2 className="text-h2 text-ink">Upload invoice</h2>
                <p className="text-body text-ink-muted">PDF, PNG, or JPG · Up to 10MB · Your invoice stays private</p>
                <DropZone
                  onFileSelect={handleFileSelectWithUpload}
                  selectedFile={file}
                  onRemove={handleRemoveFile}
                  processing={processing}
                  maxSizeMB={10}
                />
                {processing && (
                  <div className="text-center text-body text-ink-muted">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                        <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30" strokeDashoffset="10" strokeLinecap="round" />
                      </svg>
                      <span>Uploading and extracting…</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 2: Check details */}
          {step === 2 && (
            <div className="grid lg:grid-cols-[1fr_380px] gap-6">
              <div className="card p-6 space-y-4 min-h-[500px]">
                <h3 className="text-h3 text-ink">Invoice preview</h3>
                <div className="bg-surface-subtle border border-border rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                  {file ? (
                    <div className="text-center space-y-2">
                      <svg className="mx-auto h-12 w-12 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        {file.type === "application/pdf" ? (
                          <>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </>
                        ) : (
                          <>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </>
                        )}
                      </svg>
                      <p className="text-body text-ink">{file.name}</p>
                      <p className="text-body-sm text-ink-muted">Source preview — extracted text shown on the right</p>
                    </div>
                  ) : (
                    <p className="text-ink-muted">No file selected</p>
                  )}
                </div>
              </div>

              <div className="card p-6 space-y-6 sticky top-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-h3 text-ink">Check details</h3>
                  {confirmed && (
                    <Badge variant={daysOverdue > 0 ? "overdue" : daysOverdue === 0 ? "overdue" : "paid"}>
                      {daysOverdue > 0 ? `${daysOverdue} days overdue` : daysOverdue === 0 ? "Due today" : "Future date"}
                    </Badge>
                  )}
                </div>

                {extracted.clientName.confidence === "missing" && (
                  <div className="p-3 bg-warning-soft border border-warning rounded-lg text-body-sm text-warning">
                    <strong>Action needed:</strong> Some fields couldn't be extracted. Please fill them in below.
                  </div>
                )}

                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <FactRow
                    label="Client name"
                    value={confirmed?.clientName || extracted.clientName.value}
                    type="text"
                    confidence={confirmed ? "high" : extracted.clientName.confidence}
                    evidence={extracted.clientName.evidence}
                    required
                    onChange={(v) => updateConfirmed("clientName", v)}
                  />
                  <FactRow
                    label="Invoice number"
                    value={confirmed?.invoiceNumber || extracted.invoiceNumber.value || ""}
                    type="text"
                    confidence={confirmed ? "high" : extracted.invoiceNumber.confidence}
                    evidence={extracted.invoiceNumber.evidence}
                    onChange={(v) => updateConfirmed("invoiceNumber", v)}
                  />
                  <FactRow
                    label="Amount"
                    value={confirmed ? formatAmount(confirmed.amountMinor) : formatAmount(extracted.amountDueMinor.value)}
                    type="currency"
                    confidence={confirmed ? "high" : extracted.amountDueMinor.confidence}
                    evidence={extracted.amountDueMinor.evidence}
                    required
                    onChange={(v) => updateConfirmed("amountMinor", parseAmount(v))}
                  />
                  <FactRow
                    label="Currency"
                    value={confirmed?.currency || extracted.currency.value}
                    type="text"
                    confidence={confirmed ? "high" : extracted.currency.confidence}
                    evidence={extracted.currency.evidence}
                    required
                    onChange={(v) => updateConfirmed("currency", v.toUpperCase())}
                  />
                  <FactRow
                    label="Issue date"
                    value={confirmed?.issueDate || extracted.issueDate.value || ""}
                    type="date"
                    confidence={confirmed ? "high" : extracted.issueDate.confidence}
                    evidence={extracted.issueDate.evidence}
                    onChange={(v) => updateConfirmed("issueDate", v)}
                  />
                  <FactRow
                    label="Due date"
                    value={confirmed?.dueDate || extracted.dueDate.value || ""}
                    type="date"
                    confidence={confirmed ? "high" : extracted.dueDate.confidence}
                    evidence={extracted.dueDate.evidence}
                    required
                    onChange={(v) => updateConfirmed("dueDate", v)}
                  />

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button onClick={handleConfirmDetails} disabled={!canConfirmDetails}>
                      Confirm details
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Step 3: Choose tone */}
          {step === 3 && confirmed && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-h2 text-ink">Choose tone</h2>
                <p className="text-body text-ink-muted mt-1">How firm should the reminder be?</p>
              </div>

              {recommendationReason && (
                <div className="p-4 bg-accent-soft border border-accent rounded-lg">
                  <p className="text-body-sm text-ink"><strong>Recommendation:</strong> {recommendationReason}</p>
                </div>
              )}

              <div className="grid gap-3" role="radiogroup" aria-label="Select tone">
                {toneOptions.map((t) => (
                  <ToneCard
                    key={t}
                    tone={t}
                    selected={tone === t}
                    recommended={t === recommendedTone}
                    onSelect={handleToneSelect}
                  />
                ))}
              </div>

              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-label text-ink font-medium p-3 bg-surface-subtle rounded-lg list-none">
                  <svg className="h-5 w-5 text-ink-muted transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                  </svg>
                  Help me personalize it
                </summary>
                <div className="mt-4 space-y-4 p-3 bg-surface-subtle rounded-lg animate-slide-down">
                  <FactRow
                    label="Contact name"
                    value={context.contactName || ""}
                    type="text"
                    confidence="high"
                    onChange={(v) => handleContextChange("contactName", v)}
                  />
                  <FactRow
                    label="Relationship"
                    value={context.relationship || ""}
                    type="text"
                    confidence="high"
                    onChange={(v) => handleContextChange("relationship", v)}
                    helperText="e.g., Long-term client, new project, referred by X"
                  />
                  <FactRow
                    label="Prior reminders"
                    value={String(context.priorReminderCount || 0)}
                    type="number"
                    confidence="high"
                    onChange={(v) => handleContextChange("priorReminderCount", parseInt(v) || 0)}
                    helperText="How many times have you already followed up?"
                  />
                  <FactRow
                    label="Promised payment date"
                    value={context.promisedPaymentDate || ""}
                    type="date"
                    confidence="high"
                    onChange={(v) => handleContextChange("promisedPaymentDate", v)}
                    helperText="If the client promised a specific date"
                  />
                  <FactRow
                    label="Client phone (E.164)"
                    value={context.contactPhoneE164 || ""}
                    type="text"
                    confidence="high"
                    error={phoneError}
                    onChange={(v) => {
                      handleContextChange("contactPhoneE164", v);
                      setPhoneError("");
                    }}
                    helperText="For WhatsApp click-to-chat. Format: +919876543210"
                  />

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-label text-ink mb-3">Payment method</h4>
                    <div className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={paymentKind === "upi" ? "primary" : "secondary"}
                          onClick={() => handlePaymentKindChange("upi")}
                        >
                          Add UPI ID
                        </Button>
                        <Button
                          variant={paymentKind === "payment_url" ? "primary" : "secondary"}
                          onClick={() => handlePaymentKindChange("payment_url")}
                        >
                          Add payment link
                        </Button>
                        <Button
                          variant={paymentKind === "none" && !paymentMethod ? "primary" : "secondary"}
                          onClick={() => handlePaymentKindChange("none")}
                        >
                          None
                        </Button>
                      </div>

                      {paymentKind === "upi" && (
                        <FactRow
                          label="UPI ID"
                          value={context.customNote || ""}
                          type="text"
                          confidence="high"
                          error={upiError}
                          onChange={(v) => {
                            setContext((prev) => ({ ...prev, customNote: v }));
                            setUpiError("");
                          }}
                          helperText="Format: name@bank (e.g., yourname@okicici)"
                        />
                      )}

                      {paymentKind === "payment_url" && (
                        <FactRow
                          label="Payment URL"
                          value={context.customNote || ""}
                          type="text"
                          confidence="high"
                          error={urlError}
                          onChange={(v) => {
                            setContext((prev) => ({ ...prev, customNote: v }));
                            setUrlError("");
                          }}
                          helperText="HTTPS URL only (e.g., Razorpay payment link)"
                        />
                      )}

                      {paymentMethod && (
                        <div className="p-3 bg-primary-soft border border-primary rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-label text-primary font-medium">
                              {paymentMethod.kind === "upi" ? "UPI ID" : "Payment link"} added
                            </p>
                            <p className="text-body-sm text-ink-muted font-mono truncate max-w-xs">{paymentMethod.value}</p>
                          </div>
                          <Button variant="quiet" size="sm" onClick={() => setPaymentMethod(null)}>
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <FactRow
                    label="Custom note"
                    value={context.customNote || ""}
                    type="text"
                    confidence="high"
                    onChange={(v) => handleContextChange("customNote", v)}
                    helperText="Anything else the client should know? (max 500 chars)"
                  />
                </div>
              </details>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleGenerate} disabled={generating} loading={generating}>
                  Generate draft
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Draft workspace */}
          {step === 4 && draft && confirmed && (
            <div className="space-y-6">
              <ReminderEditor
                emailSubject={draft.emailSubject}
                emailBody={draft.emailBody}
                whatsappBody={draft.whatsappBody}
                onEmailSubjectChange={(v) => setDraft((d) => d ? { ...d, emailSubject: v } : null)}
                onEmailBodyChange={(v) => setDraft((d) => d ? { ...d, emailBody: v } : null)}
                onWhatsAppBodyChange={(v) => setDraft((d) => d ? { ...d, whatsappBody: v } : null)}
                onRegenerate={handleRegenerate}
                onCopyEmail={handleCopyEmail}
                onOpenWhatsApp={handleOpenWhatsApp}
                onCopyWhatsApp={handleCopyWhatsApp}
                regenerating={generating}
                copying={copying}
                whatsappNumber={context.contactPhoneE164}
                facts={{
                  clientName: confirmed.clientName,
                  amount: String(confirmed.amountMinor),
                  dueDate: formatDate(confirmed.dueDate),
                  paymentMethod: paymentMethod?.value,
                }}
              />

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button onClick={handleSaveDraft}>
                  Save & go to dashboard
                </Button>
              </div>
            </div>
          )}

          {!confirmed && step > 1 && (
            <div className="text-center py-12">
              <p className="text-ink-muted">Something went wrong. Please start over.</p>
              <Button variant="secondary" onClick={() => setStep(1)} className="mt-4">
                Start over
              </Button>
            </div>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <AlertDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete invoice?"
        message="This will remove the invoice, extracted data, and all drafts. This cannot be undone."
        confirmLabel="Delete invoice"
        onConfirm={confirmDelete}
        destructive
      />

      <AlertDialog
        open={showPaidDialog}
        onClose={() => setShowPaidDialog(false)}
        title="Mark as paid?"
        message="This will move the invoice to your Paid list. You can reverse this later if needed."
        confirmLabel="Mark paid"
        onConfirm={confirmMarkPaid}
      />
    </div>
  );
}

const toneOptions: Tone[] = ["friendly", "firm", "final_notice"];

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <NewInvoicePageContent />
    </Suspense>
  );
}