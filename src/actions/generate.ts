"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateOperationId } from "@/lib/utils";
import { generateDraft, validateDraft } from "@/lib/templates";
import { GenerationInput } from "@/lib/schemas";
import { ConfirmedInvoice, ReminderContext, PaymentMethod, Tone, ReminderDraft } from "@/types";

export async function generateReminder(input: GenerationInput) {
  const operationId = generateOperationId();
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  // Verify invoice ownership
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", input.invoiceId)
    .eq("owner_id", user.id)
    .single();

  if (invoiceError || !invoice) {
    return { success: false, error: "Invoice not found", code: "NOT_FOUND" };
  }

  try {
    // Generate draft using deterministic templates (reliable fallback)
    const draft = generateDraft(input.tone, input.invoice, input.context, input.paymentMethod);
    
    // Validate the draft
    const errors = validateDraft(draft, input.invoice, input.paymentMethod);
    
    if (errors.length > 0) {
      // Attempt one repair by regenerating
      const retryDraft = generateDraft(input.tone, input.invoice, input.context, input.paymentMethod);
      const retryErrors = validateDraft(retryDraft, input.invoice, input.paymentMethod);
      
      if (retryErrors.length > 0) {
        return { 
          success: false, 
          error: "Could not generate a safe draft. Please check your inputs.", 
          code: "VALIDATION_FAILED",
          details: retryErrors 
        };
      }
      
      return { success: true, draft: retryDraft, operationId, model: "template-fallback" };
    }

    // Save reminder to database
    const { data: reminder, error: reminderError } = await supabase
      .from("reminders")
      .insert({
        invoice_id: input.invoiceId,
        owner_id: user.id,
        version: 1,
        tone: input.tone,
        email_subject: draft.emailSubject,
        email_body: draft.emailBody,
        whatsapp_body: draft.whatsappBody,
        context: input.context || {},
        generation_model: "template-v1",
        prompt_version: input.promptVersion,
        validation_status: "valid",
      })
      .select()
      .single();

    if (reminderError) {
      console.error("Reminder save error:", reminderError);
      // Continue anyway - draft is valid
    }

    return { 
      success: true, 
      draft, 
      reminderId: reminder?.id,
      operationId,
      model: "template-v1"
    };
  } catch (error) {
    console.error("Generation error:", error);
    return { success: false, error: "Failed to generate reminder", code: "GENERATION_FAILED" };
  }
}

export async function regenerateReminder(
  reminderId: string,
  tone: Tone,
  context?: ReminderContext,
  paymentMethod?: PaymentMethod
) {
  const operationId = generateOperationId();
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  // Get existing reminder and invoice
  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("*, invoices(*)")
    .eq("id", reminderId)
    .eq("owner_id", user.id)
    .single();

  if (reminderError || !reminder) {
    return { success: false, error: "Reminder not found", code: "NOT_FOUND" };
  }

  // Get latest version number
  const { data: versions } = await supabase
    .from("reminders")
    .select("version")
    .eq("invoice_id", reminder.invoice_id)
    .eq("owner_id", user.id)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version || 0) + 1;

  // Build invoice object from stored data
  const invoice: ConfirmedInvoice = {
    clientName: reminder.invoices.client_name,
    contactName: reminder.invoices.contact_name,
    contactPhoneE164: reminder.invoices.contact_phone_e164,
    invoiceNumber: reminder.invoices.invoice_number,
    amountMinor: reminder.invoices.amount_minor,
    currency: reminder.invoices.currency,
    issueDate: reminder.invoices.issue_date,
    dueDate: reminder.invoices.due_date,
  };

  try {
    const draft = generateDraft(tone, invoice, context, paymentMethod);
    const errors = validateDraft(draft, invoice, paymentMethod);

    if (errors.length > 0) {
      const retryDraft = generateDraft(tone, invoice, context, paymentMethod);
      const retryErrors = validateDraft(retryDraft, invoice, paymentMethod);
      
      if (retryErrors.length > 0) {
        return { 
          success: false, 
          error: "Could not generate a safe draft", 
          code: "VALIDATION_FAILED",
          details: retryErrors 
        };
      }
      
      return { success: true, draft: retryDraft, operationId, model: "template-fallback" };
    }

    // Save new version
    const { data: newReminder, error: saveError } = await supabase
      .from("reminders")
      .insert({
        invoice_id: reminder.invoice_id,
        owner_id: user.id,
        version: nextVersion,
        tone,
        email_subject: draft.emailSubject,
        email_body: draft.emailBody,
        whatsapp_body: draft.whatsappBody,
        context: context || {},
        generation_model: "template-v1",
        prompt_version: "v1",
        validation_status: "valid",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Reminder save error:", saveError);
    }

    return { 
      success: true, 
      draft, 
      reminderId: newReminder?.id,
      version: nextVersion,
      operationId,
      model: "template-v1"
    };
  } catch (error) {
    console.error("Regeneration error:", error);
    return { success: false, error: "Failed to regenerate reminder", code: "GENERATION_FAILED" };
  }
}