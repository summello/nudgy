import { getInvoices, confirmInvoice } from "@/actions/invoices";
import { confirmedInvoiceSchema } from "@/lib/schemas";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = (searchParams.get("filter") as "overdue" | "paid" | "all") || "overdue";

    const result = await getInvoices(filter);
    return Response.json(result);
  } catch (error) {
    console.error("Invoices GET route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load invoices", invoices: [], code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = confirmedInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return Response.json(
        { success: false, error: "Invalid invoice data", details: validation.error.flatten(), code: "BAD_REQUEST" },
        { status: 400 }
      );
    }
    const result = await confirmInvoice(validation.data);
    return Response.json(result);
  } catch (error) {
    console.error("Invoices POST route error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save invoice", code: "ROUTE_ERROR" },
      { status: 500 }
    );
  }
}
