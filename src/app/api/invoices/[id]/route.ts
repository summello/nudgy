import { getInvoiceDetail, markInvoicePaid, markInvoiceOverdue, deleteInvoice } from "@/actions/invoices";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getInvoiceDetail(id);
  return Response.json(result);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "mark_paid") {
    const result = await markInvoicePaid(id);
    return Response.json(result);
  }

  if (action === "mark_overdue") {
    const result = await markInvoiceOverdue(id);
    return Response.json(result);
  }

  return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteInvoice(id);
  return Response.json(result);
}