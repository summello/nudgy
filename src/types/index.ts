export type InvoiceStatus = "processing" | "needs_review" | "overdue" | "paid";

export type Tone = "friendly" | "firm" | "final_notice";

export type PaymentMethodKind = "upi" | "payment_url";

export interface ExtractedInvoice {
  clientName: Candidate<string>;
  invoiceNumber: Candidate<string | null>;
  amountDueMinor: Candidate<number>;
  currency: Candidate<string>;
  issueDate: Candidate<string | null>;
  dueDate: Candidate<string | null>;
}

export interface Candidate<T> {
  value: T;
  confidence: "high" | "review" | "missing";
  evidence?: string;
}

export interface ConfirmedInvoice {
  clientName: string;
  contactName?: string;
  contactPhoneE164?: string;
  invoiceNumber?: string;
  amountMinor: number;
  currency: string;
  issueDate?: string;
  dueDate: string;
}

export interface ReminderContext {
  contactName?: string;
  contactPhoneE164?: string;
  relationship?: string;
  priorReminderCount?: number;
  priorReminderDate?: string;
  promisedPaymentDate?: string;
  customNote?: string;
}

export interface PaymentMethod {
  id?: string;
  kind: PaymentMethodKind;
  value: string;
  label?: string;
  isDefault: boolean;
}

export interface ReminderDraft {
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
}

export interface Invoice {
  id: string;
  ownerId: string;
  clientName: string;
  contactName?: string;
  contactPhoneE164?: string;
  invoiceNumber?: string;
  amountMinor: number;
  currency: string;
  issueDate?: string;
  dueDate: string;
  status: InvoiceStatus;
  sourceObjectPath?: string;
  sourceSha256?: string;
  extractionMethod?: string;
  extractionConfidence?: Record<string, unknown>;
  confirmedAt?: string;
  paidAt?: string;
  lastExportedTone?: string;
  lastExportedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  invoiceId: string;
  ownerId: string;
  version: number;
  tone: Tone;
  emailSubject: string;
  emailBody: string;
  whatsappBody: string;
  context: ReminderContext;
  generationModel?: string;
  promptVersion: string;
  validationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderExport {
  id: string;
  reminderId: string;
  ownerId: string;
  action: "email_copied" | "whatsapp_copied" | "whatsapp_opened";
  createdAt: string;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  businessName?: string;
  defaultSignoff?: string;
  locale: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadState {
  file?: File;
  processing: boolean;
  error?: string;
}

export interface ExtractionState {
  extracted?: ExtractedInvoice;
  confirmed?: ConfirmedInvoice;
  loading: boolean;
  error?: string;
}

export interface GenerationState {
  draft?: ReminderDraft;
  tone: Tone;
  context: ReminderContext;
  paymentMethod?: PaymentMethod;
  loading: boolean;
  error?: string;
  emailEdited: boolean;
  whatsappEdited: boolean;
}

export interface DashboardState {
  invoices: Invoice[];
  loading: boolean;
  error?: string;
  filter: "overdue" | "paid" | "all";
}

export interface AppError {
  code: string;
  message: string;
  retryable: boolean;
}

export const TONE_OPTIONS: Array<{ value: Tone; label: string; description: string; sample: string }> = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and concise; assumes oversight; asks for an update.",
    sample: "Just checking in on invoice #INV-001 — hope all's well!",
  },
  {
    value: "firm",
    label: "Firm",
    description: "Direct and professional; clearly states overdue status; requests payment or a specific date.",
    sample: "Invoice #INV-001 is 14 days overdue. Please confirm when payment will be made.",
  },
  {
    value: "final_notice",
    label: "Final Notice",
    description: "Calm and unambiguous; names a response deadline; does not threaten legal action.",
    sample: "This is a final reminder for invoice #INV-001. We need a response by 30 Aug.",
  },
];