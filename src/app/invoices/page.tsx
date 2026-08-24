"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { InvoiceCard, InvoiceTableRow } from "@/components/ui";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { DropZone } from "@/components/ui";
import { Toast, ToastContainer } from "@/components/ui";
import { Dialog, AlertDialog } from "@/components/ui";
import { formatAmount, formatDate, getDaysOverdue, generateOperationId } from "@/lib/utils";
import { Invoice, InvoiceStatus } from "@/types";

const mockInvoices: Invoice[] = [
  {
    id: "1",
    ownerId: "user1",
    clientName: "Acme Design Studio",
    contactName: "Priya Sharma",
    contactPhoneE164: "+919876543210",
    invoiceNumber: "INV-2024-001",
    amountMinor: 4850000,
    currency: "INR",
    issueDate: "2024-07-15",
    dueDate: "2024-08-10",
    status: "overdue",
    lastExportedTone: "firm",
    lastExportedAt: "2024-08-20T10:30:00Z",
    createdAt: "2024-08-15T10:00:00Z",
    updatedAt: "2024-08-20T10:30:00Z",
  },
  {
    id: "2",
    ownerId: "user1",
    clientName: "TechStart Labs",
    contactName: "Rahul Patel",
    contactPhoneE164: "+919876543211",
    invoiceNumber: "INV-2024-002",
    amountMinor: 7500000,
    currency: "INR",
    issueDate: "2024-07-20",
    dueDate: "2024-08-05",
    status: "overdue",
    lastExportedTone: "friendly",
    lastExportedAt: "2024-08-12T14:00:00Z",
    createdAt: "2024-08-10T09:00:00Z",
    updatedAt: "2024-08-12T14:00:00Z",
  },
  {
    id: "3",
    ownerId: "user1",
    clientName: "Creative Agency Co",
    contactName: "Anjali Mehta",
    contactPhoneE164: "+919876543212",
    invoiceNumber: "INV-2024-003",
    amountMinor: 12000000,
    currency: "INR",
    issueDate: "2024-06-15",
    dueDate: "2024-07-15",
    status: "paid",
    paidAt: "2024-07-20T11:00:00Z",
    lastExportedTone: "final_notice",
    lastExportedAt: "2024-07-18T16:00:00Z",
    createdAt: "2024-07-10T10:00:00Z",
    updatedAt: "2024-07-20T11:00:00Z",
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"overdue" | "paid" | "all">("overdue");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showPaidDialog, setShowPaidDialog] = useState<string | null>(null);
  const [showOverdueDialog, setShowOverdueDialog] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProcessing, setUploadProcessing] = useState(false);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = generateOperationId();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === "overdue") return inv.status === "overdue";
    if (filter === "paid") return inv.status === "paid";
    return true;
  }).sort((a, b) => {
    if (a.status === "overdue" && b.status === "paid") return -1;
    if (a.status === "paid" && b.status === "overdue") return 1;
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + inv.amountMinor, 0);

  const handleContinue = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      // In real app, navigate to /new with invoice data pre-filled
      addToast(`Continuing ${inv.clientName}...`);
    }
  };

  const handleMarkPaid = (id: string) => {
    setShowPaidDialog(id);
  };

  const confirmMarkPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "paid" as InvoiceStatus, paidAt: new Date().toISOString() } : inv
      )
    );
    addToast("Invoice marked as paid");
    setShowPaidDialog(null);
  };

  const handleMarkOverdue = (id: string) => {
    setShowOverdueDialog(id);
  };

  const confirmMarkOverdue = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "overdue" as InvoiceStatus, paidAt: undefined } : inv
      )
    );
    addToast("Invoice marked as overdue");
    setShowOverdueDialog(null);
  };

  const handleDelete = (id: string) => {
    setShowDeleteDialog(id);
  };

  const confirmDelete = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    addToast("Invoice deleted");
    setShowDeleteDialog(null);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // In real app, this would start the upload flow
    addToast(`Selected ${file.name}. Starting extraction...`);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-h3 text-ink font-semibold">Invoice Nudge</Link>
          <div className="flex items-center gap-4">
            <span className="text-body-sm text-ink-muted">Signed in as freelancer</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-h1 text-ink">Invoices</h1>
              <p className="text-body text-ink-muted">
                {overdueInvoices.length} overdue · ₹{formatAmount(overdueTotal)} total
              </p>
            </div>
            <DropZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onRemove={handleRemoveFile}
              processing={uploadProcessing}
              maxSizeMB={10}
            />
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter invoices">
            {(["overdue", "paid", "all"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-label font-medium transition-colors ${
                  filter === f ? "bg-primary text-white" : "bg-surface border border-border text-ink-muted hover:text-ink"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "overdue" && overdueInvoices.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-soft text-primary text-caption rounded-full">
                    {overdueInvoices.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "cards" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("cards")}
                aria-label="Card view"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </Button>
              <Button
                variant={viewMode === "table" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="3" y1="3" x2="21" y2="3" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="3" y1="21" x2="21" y2="21" />
                  <line x1="3" y1="3" x2="3" y2="21" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
              </Button>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <Card className="py-12 px-6 text-center">
              {filter === "overdue" ? (
                <>
                  <svg className="mx-auto h-16 w-16 text-ink-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <h2 className="text-h2 text-ink mb-2">No overdue invoices here</h2>
                  <p className="text-body text-ink-muted mb-6">That's a good list to keep empty.</p>
                  <DropZone
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onRemove={handleRemoveFile}
                    processing={uploadProcessing}
                  />
                </>
              ) : filter === "paid" ? (
                <>
                  <svg className="mx-auto h-16 w-16 text-ink-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h2 className="text-h2 text-ink mb-2">No paid invoices yet</h2>
                  <p className="text-body text-ink-muted">Mark an invoice as paid to see it here.</p>
                </>
              ) : (
                <>
                  <svg className="mx-auto h-16 w-16 text-ink-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <h2 className="text-h2 text-ink mb-2">No invoices yet</h2>
                  <p className="text-body text-ink-muted mb-6">Upload an overdue invoice to get started.</p>
                  <DropZone
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onRemove={handleRemoveFile}
                    processing={uploadProcessing}
                  />
                </>
              )}
            </Card>
          ) : viewMode === "table" ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="bg-surface-subtle border-b border-border">
                      <th className="px-4 py-3 text-left text-label text-ink-muted font-medium">Client / Invoice</th>
                      <th className="px-4 py-3 text-right text-label text-ink-muted font-medium tabular-nums">Amount</th>
                      <th className="px-4 py-3 text-left text-label text-ink-muted font-medium">Due date</th>
                      <th className="px-4 py-3 text-left text-label text-ink-muted font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-label text-ink-muted font-medium">Last action</th>
                      <th className="px-4 py-3 text-right text-label text-ink-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <InvoiceTableRow
                        key={inv.id}
                        invoice={inv}
                        onContinue={handleContinue}
                        onMarkPaid={handleMarkPaid}
                        onMarkOverdue={handleMarkOverdue}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInvoices.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  onContinue={handleContinue}
                  onMarkPaid={handleMarkPaid}
                  onMarkOverdue={handleMarkOverdue}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showDeleteDialog && (
        <AlertDialog
          open={!!showDeleteDialog}
          onClose={() => setShowDeleteDialog(null)}
          title="Delete invoice?"
          message="This will remove the invoice, extracted data, and all drafts. This cannot be undone."
          confirmLabel="Delete invoice"
          onConfirm={() => showDeleteDialog && confirmDelete(showDeleteDialog)}
          destructive
        />
      )}

      {showPaidDialog && (
        <AlertDialog
          open={!!showPaidDialog}
          onClose={() => setShowPaidDialog(null)}
          title="Mark as paid?"
          message="This will move the invoice to your Paid list. You can reverse this later if needed."
          confirmLabel="Mark paid"
          onConfirm={() => showPaidDialog && confirmMarkPaid(showPaidDialog)}
        />
      )}

      {showOverdueDialog && (
        <AlertDialog
          open={!!showOverdueDialog}
          onClose={() => setShowOverdueDialog(null)}
          title="Mark as overdue?"
          message="This will move the invoice back to your Overdue list. You'll be able to send another reminder."
          confirmLabel="Mark overdue"
          onConfirm={() => showOverdueDialog && confirmMarkOverdue(showOverdueDialog)}
        />
      )}
    </div>
  );
}