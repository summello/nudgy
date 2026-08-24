import { z } from "zod";

export const extractedInvoiceSchema = z.object({
  clientName: z.object({
    value: z.string(),
    confidence: z.enum(["high", "review", "missing"]),
    evidence: z.string().optional(),
  }),
  invoiceNumber: z.object({
    value: z.string().nullable(),
    confidence: z.enum(["high", "review", "missing"]),
    evidence: z.string().optional(),
  }),
  amountDueMinor: z.object({
    value: z.number(),
    confidence: z.enum(["high", "review", "missing"]),
    evidence: z.string().optional(),
  }),
  currency: z.object({
    value: z.string().length(3),
    confidence: z.enum(["high", "review", "missing"]),
    evidence: z.string().optional(),
  }),
  issueDate: z.object({
    value: z.string().nullable(),
    confidence: z.enum(["high", "review", "missing"]),
    evidence: z.string().optional(),
  }),
  dueDate: z.object({
    value: z.string().nullable(),
    confidence: z.enum(["high", "review", "missing"]),
    evidence: z.string().optional(),
  }),
});

export type ExtractedInvoice = z.infer<typeof extractedInvoiceSchema>;

export const confirmedInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  contactName: z.string().optional(),
  contactPhoneE164: z.string().optional(),
  invoiceNumber: z.string().optional(),
  amountMinor: z.number().int().positive("Amount must be positive"),
  currency: z.string().length(3),
  issueDate: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

export type ConfirmedInvoice = z.infer<typeof confirmedInvoiceSchema>;

export const reminderContextSchema = z.object({
  contactName: z.string().max(100).optional(),
  relationship: z.string().max(200).optional(),
  priorReminderCount: z.number().int().min(0).max(10).optional(),
  priorReminderDate: z.string().optional(),
  promisedPaymentDate: z.string().optional(),
  customNote: z.string().max(500).optional(),
});

export type ReminderContext = z.infer<typeof reminderContextSchema>;

export const paymentMethodSchema = z.object({
  kind: z.enum(["upi", "payment_url"]),
  value: z.string(),
  label: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const reminderDraftSchema = z.object({
  emailSubject: z.string().min(1).max(200),
  emailBody: z.string().min(1).max(5000),
  whatsappBody: z.string().min(1).max(1600),
});

export type ReminderDraft = z.infer<typeof reminderDraftSchema>;

export const generationInputSchema = z.object({
  invoiceId: z.string().uuid(),
  invoice: confirmedInvoiceSchema,
  tone: z.enum(["friendly", "firm", "final_notice"]),
  context: reminderContextSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  daysOverdue: z.number().int(),
  promptVersion: z.string(),
  locale: z.string().default("en-IN"),
});

export type GenerationInput = z.infer<typeof generationInputSchema>;

export const uploadValidationSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
  mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
});

export type UploadValidation = z.infer<typeof uploadValidationSchema>;

export const upiSchema = z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/, "Enter a valid UPI ID (e.g., name@bank)");

export const paymentUrlSchema = z.string().url().refine((url) => url.startsWith("https://"), "Only HTTPS URLs are allowed");

export const e164PhoneSchema = z.string().regex(/^\+[1-9]\d{9,14}$/, "Enter a valid phone number with country code");