import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatAmount(amountMinor: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function parseAmount(input: string): number {
  const cleaned = input.replace(/[₹,\s]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getToneRecommendation(daysOverdue: number, priorReminders: number): "friendly" | "firm" | "final_notice" {
  if (daysOverdue >= 22 || priorReminders >= 2) return "final_notice";
  if (daysOverdue >= 8 || priorReminders >= 1) return "firm";
  return "friendly";
}

export function getToneRecommendationReason(daysOverdue: number, priorReminders: number): string {
  if (daysOverdue >= 22 || priorReminders >= 2) {
    return `Final Notice is suggested: this invoice is ${daysOverdue} days overdue${priorReminders > 0 ? ` and has ${priorReminders} previous reminder${priorReminders > 1 ? "s" : ""}` : ""}.`;
  }
  if (daysOverdue >= 8 || priorReminders >= 1) {
    return `Firm is suggested: this invoice is ${daysOverdue} days overdue${priorReminders > 0 ? ` and has ${priorReminders} previous reminder${priorReminders > 1 ? "s" : ""}` : ""}.`;
  }
  return `Friendly is suggested: this invoice is ${daysOverdue} days overdue with no previous reminders.`;
}

export function validateUPI(upi: string): { valid: boolean; error?: string } {
  const cleaned = upi.trim();
  if (!cleaned) return { valid: true };
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;
  if (!upiRegex.test(cleaned)) {
    return { valid: false, error: "Enter a valid UPI ID (e.g., name@bank)" };
  }
  return { valid: true };
}

export function validatePaymentUrl(url: string): { valid: boolean; error?: string } {
  const cleaned = url.trim();
  if (!cleaned) return { valid: true };
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs are allowed" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Enter a valid HTTPS URL" };
  }
}

export function validateE164Phone(phone: string): { valid: boolean; formatted?: string; error?: string } {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return { valid: true };
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { valid: false, error: "Enter a valid phone number with country code" };
  }
  const formatted = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
  return { valid: true, formatted };
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

export function generateOperationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString + "T00:00:00");
  return !isNaN(date.getTime());
}

export function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}