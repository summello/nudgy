import { getInvoices, confirmInvoice } from "@/actions/invoices";
import { confirmedInvoiceSchema } from "@/lib/schemas";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = (searchParams.get("filter") as "overdue" | "paid" | "all") || "overdue";
  
  const result = await getInvoices(filter);
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = confirmedInvoiceSchema.safeParse(body);
  if (!validation.success) {
    return Response.json({ success: false, error: "Invalid invoice data", details: validation.error.flatten() }, { status: 400 });
  }
  const result = await confirmInvoice(validation.data);
  return Response.json(result);
}