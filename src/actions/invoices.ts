"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateOperationId, getDaysOverdue } from "@/lib/utils";
import { ConfirmedInvoice } from "@/types";

export async function getInvoices(filter: "overdue" | "paid" | "all" = "overdue") {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized", invoices: [] };
  }

  let query = supabase
    .from("invoices")
    .select("*")
    .eq("owner_id", user.id)
    .order("due_date", { ascending: true });

  if (filter === "overdue") {
    query = query.eq("status", "overdue");
  } else if (filter === "paid") {
    query = query.eq("status", "paid");
  }

  const { data: invoices, error } = await query;

  if (error) {
    return { success: false, error: error.message, invoices: [] };
  }

  // Get latest exports for each invoice
  const invoiceIds = invoices?.map(i => i.id) || [];
  interface ExportRecord {
    reminder_id: string;
    created_at: string;
    // PostgREST returns a many-to-one embed as an object, not an array.
    reminders: { tone: string } | null;
  }
  let exportsMap: Record<string, ExportRecord> = {};
  
  if (invoiceIds.length > 0) {
    const { data: reminderData } = await supabase
      .from("reminders")
      .select("id, invoice_id")
      .in("invoice_id", invoiceIds);
    
    const reminderIds = reminderData?.map(r => r.id) || [];
    const reminderInvoiceMap: Record<string, string> = {};
    reminderData?.forEach(r => { reminderInvoiceMap[r.id] = r.invoice_id; });

    if (reminderIds.length > 0) {
      const { data: exports } = await supabase
        .from("reminder_exports")
        .select("*, reminders!inner(tone)")
        .in("reminder_id", reminderIds)
        .order("created_at", { ascending: false });
      
      if (exports) {
        (exports as unknown as ExportRecord[]).forEach(exp => {
          const invId = reminderInvoiceMap[exp.reminder_id];
          if (invId && !exportsMap[invId]) {
            exportsMap[invId] = exp;
          }
        });
      }
    }
  }

  // Map DB snake_case rows to the camelCase shape the UI components expect.
  const enrichedInvoices = invoices?.map(inv => ({
    id: inv.id,
    ownerId: inv.owner_id,
    clientName: inv.client_name,
    contactName: inv.contact_name ?? undefined,
    contactPhoneE164: inv.contact_phone_e164 ?? undefined,
    invoiceNumber: inv.invoice_number ?? undefined,
    amountMinor: inv.amount_minor,
    currency: inv.currency,
    issueDate: inv.issue_date ?? undefined,
    dueDate: inv.due_date,
    status: inv.status,
    confirmedAt: inv.confirmed_at ?? undefined,
    paidAt: inv.paid_at ?? undefined,
    createdAt: inv.created_at,
    updatedAt: inv.updated_at,
    lastExportedTone: exportsMap[inv.id]?.reminders?.tone ?? null,
    lastExportedAt: exportsMap[inv.id]?.created_at ?? null,
  })) || [];

  return { success: true, invoices: enrichedInvoices };
}

export async function markInvoicePaid(invoiceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("invoices")
    .update({ 
      status: "paid", 
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", invoiceId)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markInvoiceOverdue(invoiceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("invoices")
    .update({ 
      status: "overdue", 
      paid_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", invoiceId)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteInvoice(invoiceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get invoice to find associated file
  const { data: invoice } = await supabase
    .from("invoices")
    .select("source_object_path")
    .eq("id", invoiceId)
    .eq("owner_id", user.id)
    .single();

  // Delete from invoices (cascades to reminders, exports)
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Delete associated file if exists
  if (invoice?.source_object_path) {
    await supabase.storage.from("invoice-files").remove([invoice.source_object_path]);
    await supabase.from("invoice_files").delete().eq("object_path", invoice.source_object_path);
  }

  return { success: true };
}

export async function getInvoiceDetail(invoiceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Unauthorized", invoice: null };
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("owner_id", user.id)
    .single();

  if (error || !invoice) {
    return { success: false, error: "Invoice not found", invoice: null };
  }

  // Get reminders
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("invoice_id", invoiceId)
    .eq("owner_id", user.id)
    .order("version", { ascending: false });

  // Get exports
  const reminderIds = reminders?.map(r => r.id) || [];
  let exports: any[] = [];
  
  if (reminderIds.length > 0) {
    const { data: exportsData } = await supabase
      .from("reminder_exports")
      .select("*")
      .in("reminder_id", reminderIds)
      .order("created_at", { ascending: false });
    exports = exportsData || [];
  }

  // Get payment method
  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("owner_id", user.id)
    .eq("is_default", true)
    .single();

  return { 
    success: true, 
    invoice: {
      ...invoice,
      reminders: reminders || [],
      exports,
      paymentMethod,
    }
  };
}

export async function confirmInvoice(input: ConfirmedInvoice & { sourceObjectPath?: string; sourceSha256?: string; extractionMethod?: string }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  const daysOverdue = input.dueDate ? getDaysOverdue(input.dueDate) : 0;
  const status = daysOverdue <= 0 ? "needs_review" : "overdue";

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      owner_id: user.id,
      client_name: input.clientName,
      contact_name: input.contactName || null,
      contact_phone_e164: input.contactPhoneE164 || null,
      invoice_number: input.invoiceNumber || null,
      amount_minor: input.amountMinor,
      currency: input.currency,
      issue_date: input.issueDate || null,
      due_date: input.dueDate,
      status,
      source_object_path: input.sourceObjectPath || null,
      source_sha256: input.sourceSha256 || null,
      extraction_method: input.extractionMethod || null,
      confirmed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !invoice) {
    console.error("Confirm invoice error:", error);
    return { success: false, error: "Failed to save invoice", code: "DB_ERROR" };
  }

  return { success: true, invoiceId: invoice.id };
}