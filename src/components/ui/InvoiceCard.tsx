"use client";

import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { formatAmount, formatDate, getDaysOverdue } from "@/lib/utils";

type InvoiceStatus = "processing" | "needs_review" | "overdue" | "paid";

export interface InvoiceCardProps {
  invoice: {
    id: string;
    clientName: string;
    invoiceNumber?: string | null;
    amountMinor: number;
    currency: string;
    dueDate: string;
    status: InvoiceStatus;
    lastExportedTone?: string | null;
    lastExportedAt?: string | null;
    paidAt?: string | null;
  };
  onContinue?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  onMarkOverdue?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function renderStatusBadge(status: InvoiceStatus, daysOverdue: number) {
  switch (status) {
    case "paid":
      return <Badge variant="paid">Paid</Badge>;
    case "processing":
      return <Badge variant="processing">Processing</Badge>;
    case "needs_review":
      return <Badge variant="needs-review">Needs review</Badge>;
    case "overdue":
      return <Badge variant="overdue">{daysOverdue > 0 ? `${daysOverdue} days overdue` : "Due today"}</Badge>;
    default:
      return null;
  }
}

export function InvoiceCard({ invoice, onContinue, onMarkPaid, onMarkOverdue, onDelete }: InvoiceCardProps) {
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const isOverdue = invoice.status === "overdue";
  const isPaid = invoice.status === "paid";

  const lastAction = invoice.lastExportedTone && invoice.lastExportedAt ? (
    <span className="text-body-sm text-ink-muted">
      Last: <span className="capitalize text-ink">{invoice.lastExportedTone.replace("_", " ")}</span>{" "}
      {new Date(invoice.lastExportedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
    </span>
  ) : null;

  return (
    <article className={cn("card p-4 space-y-4", isPaid && "opacity-60")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-h3 text-ink truncate">{invoice.clientName}</h3>
            {invoice.invoiceNumber && (
              <span className="text-body-sm text-ink-muted font-mono bg-surface-subtle px-2 py-0.5 rounded">
                {invoice.invoiceNumber}
              </span>
            )}
            {renderStatusBadge(invoice.status, daysOverdue)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-body-sm text-ink-muted">
            <span className="font-medium text-ink tabular-nums">{formatAmount(invoice.amountMinor, invoice.currency)}</span>
            <span>Due {formatDate(invoice.dueDate)}</span>
            {lastAction}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
        {invoice.status === "overdue" && onContinue && (
          <Button size="sm" onClick={() => onContinue(invoice.id)} className="flex-1 sm:flex-initial">
            Continue
          </Button>
        )}
        {invoice.status === "overdue" && onMarkPaid && (
          <Button variant="secondary" size="sm" onClick={() => onMarkPaid(invoice.id)} className="flex-1 sm:flex-initial">
            Mark Paid
          </Button>
        )}
        {invoice.status === "paid" && onMarkOverdue && (
          <Button variant="secondary" size="sm" onClick={() => onMarkOverdue(invoice.id)} className="flex-1 sm:flex-initial">
            Mark Overdue
          </Button>
        )}
        {onDelete && (
          <Button variant="quiet" size="sm" onClick={() => onDelete(invoice.id)} className="ml-auto flex-1 sm:flex-initial text-danger hover:text-danger">
            <svg className="h-4 w-4 mx-auto sm:mx-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span className="hidden sm:inline">Delete</span>
          </Button>
        )}
      </div>
    </article>
  );
}

export interface InvoiceTableRowProps {
  invoice: InvoiceCardProps["invoice"];
  onContinue?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  onMarkOverdue?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function InvoiceTableRow({ invoice, onContinue, onMarkPaid, onMarkOverdue, onDelete }: InvoiceTableRowProps) {
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const isOverdue = invoice.status === "overdue";
  const isPaid = invoice.status === "paid";

  return (
    <tr className={cn("border-t border-border", isPaid && "opacity-60")}>
      <td className="px-4 py-3">
        <div>
          <p className="text-body font-medium text-ink">{invoice.clientName}</p>
          {invoice.invoiceNumber && (
            <p className="text-body-sm text-ink-muted font-mono">{invoice.invoiceNumber}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-body tabular-nums font-medium text-ink whitespace-nowrap">
        {formatAmount(invoice.amountMinor, invoice.currency)}
      </td>
      <td className="px-4 py-3 text-body text-ink-muted whitespace-nowrap">
        {formatDate(invoice.dueDate)}
      </td>
      <td className="px-4 py-3 text-body-sm whitespace-nowrap">
        {renderStatusBadge(invoice.status, daysOverdue)}
      </td>
      <td className="px-4 py-3 text-body-sm text-ink-muted whitespace-nowrap">
        {invoice.lastExportedTone && invoice.lastExportedAt ? (
          <>
            <span className="capitalize">{invoice.lastExportedTone.replace("_", " ")}</span>{" "}
            {new Date(invoice.lastExportedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </>
        ) : (
          <span className="text-ink-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isOverdue && onContinue && (
            <Button size="sm" onClick={() => onContinue(invoice.id)}>
              Continue
            </Button>
          )}
          {isOverdue && onMarkPaid && (
            <Button variant="secondary" size="sm" onClick={() => onMarkPaid(invoice.id)}>
              Mark Paid
            </Button>
          )}
          {isPaid && onMarkOverdue && (
            <Button variant="secondary" size="sm" onClick={() => onMarkOverdue(invoice.id)}>
              Mark Overdue
            </Button>
          )}
          {onDelete && (
            <Button variant="quiet" size="sm" onClick={() => onDelete(invoice.id)} className="text-danger hover:text-danger" aria-label="Delete invoice">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}