import { getInvoices } from "@/actions/invoices";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = (searchParams.get("filter") as "overdue" | "paid" | "all") || "overdue";
  
  const result = await getInvoices(filter);
  return Response.json(result);
}