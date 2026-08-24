import { getInvoiceDetail, markInvoicePaid, markInvoiceOverdue, deleteInvoice } from "@/actions/invoices";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await getInvoiceDetail(id);
    return Response.json(result);
  } catch (error) {
    console.error("Invoice GET route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load invoice", invoice: null, code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
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

    return Response.json({ success: false, error: "Invalid action", code: "BAD_REQUEST" }, { status: 400 });
  } catch (error) {
    console.error("Invoice PATCH route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update invoice", code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await deleteInvoice(id);
    return Response.json(result);
  } catch (error) {
    console.error("Invoice DELETE route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete invoice", code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}
