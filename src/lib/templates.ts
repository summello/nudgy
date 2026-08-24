import { ConfirmedInvoice, ReminderContext, PaymentMethod, ReminderDraft, Tone } from "@/types";
import { formatAmount, formatDateLong, getDaysOverdue } from "./utils";

function getSignoff(context?: ReminderContext): string {
  return context?.customNote || "Thanks,\n[Your Name]";
}

function getGreeting(clientName: string, contactName?: string): string {
  if (contactName) return `Hi ${contactName},`;
  return `Hi ${clientName},`;
}

function getPaymentLine(paymentMethod?: PaymentMethod): string {
  if (!paymentMethod) return "";
  if (paymentMethod.kind === "upi") {
    return `\nYou can pay via UPI: ${paymentMethod.value}`;
  }
  return `\nYou can pay here: ${paymentMethod.value}`;
}

function getInvoiceRef(invoice: ConfirmedInvoice): string {
  if (invoice.invoiceNumber) return `invoice #${invoice.invoiceNumber}`;
  return `the invoice dated ${formatDateLong(invoice.dueDate)}`;
}

function getAmountLine(invoice: ConfirmedInvoice): string {
  return `Amount: ${formatAmount(invoice.amountMinor, invoice.currency)}`;
}

function getDueLine(invoice: ConfirmedInvoice): string {
  return `Due date: ${formatDateLong(invoice.dueDate)}`;
}

export function generateFriendlyDraft(
  invoice: ConfirmedInvoice,
  context?: ReminderContext,
  paymentMethod?: PaymentMethod
): ReminderDraft {
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const paymentLine = getPaymentLine(paymentMethod);
  const signoff = getSignoff(context);
  const greeting = getGreeting(invoice.clientName, context?.contactName);

  const emailSubject = `Following up on ${getInvoiceRef(invoice)}`;
  const emailBody = `${greeting}

I hope you're doing well. I wanted to follow up on ${getInvoiceRef(invoice)} (${getAmountLine(invoice)}, ${getDueLine(invoice)}).${paymentLine}

Could you let me know when this might be processed? No rush — just checking in.

${signoff}`;

  const whatsappBody = `${greeting} Just following up on ${getInvoiceRef(invoice)} (${formatAmount(invoice.amountMinor, invoice.currency)}, due ${formatDateLong(invoice.dueDate)}).${paymentLine} Let me know when you can process this. Thanks!`;

  return { emailSubject, emailBody, whatsappBody };
}

export function generateFirmDraft(
  invoice: ConfirmedInvoice,
  context?: ReminderContext,
  paymentMethod?: PaymentMethod
): ReminderDraft {
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const paymentLine = getPaymentLine(paymentMethod);
  const signoff = getSignoff(context);
  const greeting = getGreeting(invoice.clientName, context?.contactName);

  const emailSubject = `Overdue: ${getInvoiceRef(invoice)} — ${formatAmount(invoice.amountMinor, invoice.currency)}`;
  const emailBody = `${greeting}

This is a reminder that ${getInvoiceRef(invoice)} for ${formatAmount(invoice.amountMinor, invoice.currency)} was due on ${formatDateLong(invoice.dueDate)} (${daysOverdue} days ago).${paymentLine}

Please confirm when payment will be made or let me know if there are any issues.

${signoff}`;

  const whatsappBody = `${greeting} Reminder: ${getInvoiceRef(invoice)} for ${formatAmount(invoice.amountMinor, invoice.currency)} is ${daysOverdue} days overdue (due ${formatDateLong(invoice.dueDate)}).${paymentLine} Please confirm when payment will be made.`;

  return { emailSubject, emailBody, whatsappBody };
}

export function generateFinalNoticeDraft(
  invoice: ConfirmedInvoice,
  context?: ReminderContext,
  paymentMethod?: PaymentMethod
): ReminderDraft {
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const paymentLine = getPaymentLine(paymentMethod);
  const signoff = getSignoff(context);
  const greeting = getGreeting(invoice.clientName, context?.contactName);

  const deadline = context?.promisedPaymentDate
    ? `the agreed date of ${formatDateLong(context.promisedPaymentDate)}`
    : "the next 7 days";

  const emailSubject = `Final reminder: ${getInvoiceRef(invoice)} — ${formatAmount(invoice.amountMinor, invoice.currency)}`;
  const emailBody = `${greeting}

This is a final reminder regarding ${getInvoiceRef(invoice)} for ${formatAmount(invoice.amountMinor, invoice.currency)}, which was due on ${formatDateLong(invoice.dueDate)} (${daysOverdue} days ago).${paymentLine}

We haven't received payment or a response to previous reminders. Please confirm payment or a concrete plan by ${deadline}. If there's a dispute or issue, please let me know so we can resolve it.

${signoff}`;

  const whatsappBody = `${greeting} Final reminder: ${getInvoiceRef(invoice)} for ${formatAmount(invoice.amountMinor, invoice.currency)} is ${daysOverdue} days overdue.${paymentLine} Please confirm payment or a plan by ${deadline}.`;

  return { emailSubject, emailBody, whatsappBody };
}

export function generateDraft(
  tone: Tone,
  invoice: ConfirmedInvoice,
  context?: ReminderContext,
  paymentMethod?: PaymentMethod
): ReminderDraft {
  switch (tone) {
    case "friendly":
      return generateFriendlyDraft(invoice, context, paymentMethod);
    case "firm":
      return generateFirmDraft(invoice, context, paymentMethod);
    case "final_notice":
      return generateFinalNoticeDraft(invoice, context, paymentMethod);
  }
}

export function validateDraft(draft: ReminderDraft, invoice: ConfirmedInvoice, paymentMethod?: PaymentMethod): string[] {
  const errors: string[] = [];

  const amountStr = formatAmount(invoice.amountMinor, invoice.currency);
  const dueStr = formatDateLong(invoice.dueDate);

  if (!draft.emailSubject.includes(invoice.clientName) && !draft.emailSubject.includes(invoice.invoiceNumber || "")) {
    errors.push("Email subject should reference the client or invoice number");
  }

  if (!draft.emailBody.includes(amountStr)) {
    errors.push("Email body must include the confirmed amount");
  }

  if (!draft.emailBody.includes(dueStr)) {
    errors.push("Email body must include the confirmed due date");
  }

  if (invoice.invoiceNumber && !draft.emailBody.includes(invoice.invoiceNumber)) {
    errors.push("Email body should include the invoice number");
  }

  if (paymentMethod) {
    const paymentRef = paymentMethod.kind === "upi" ? paymentMethod.value : paymentMethod.value;
    if (!draft.emailBody.includes(paymentRef) && !draft.whatsappBody.includes(paymentRef)) {
      errors.push("Draft must include the payment method when provided");
    }
  }

  const forbiddenPatterns = [
    /legal action/i,
    /court/i,
    /lawyer/i,
    /attorney/i,
    /collections/i,
    /late fee/i,
    /penalty/i,
    /interest/i,
    /suspend/i,
    /terminate/i,
  ];

  const allText = `${draft.emailSubject} ${draft.emailBody} ${draft.whatsappBody}`;
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(allText)) {
      errors.push(`Draft contains forbidden content: ${pattern.source}`);
    }
  }

  if (draft.whatsappBody.length > 1600) {
    errors.push("WhatsApp body exceeds 1600 character limit");
  }

  return errors;
}