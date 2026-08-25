"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { InvoiceCard, InvoiceTableRow } from "@/components/ui";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";
import { DropZone } from "@/components/ui";
import { Toast, ToastContainer } from "@/components/ui";
import { Dialog, AlertDialog } from "@/components/ui";
import { formatAmount, formatDate, getDaysOverdue, generateOperationId } from "@/lib/utils";
import { requestJson } from "@/lib/http";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Session } from "@supabase/supabase-js";
import { Invoice, InvoiceStatus } from "@/types";

interface InvoiceWithExtras extends Omit<Invoice, "lastExportedTone" | "lastExportedAt"> {
  lastExportedTone?: string | null;
  lastExportedAt?: string | null;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filter, setFilter] = useState<"overdue" | "paid" | "all">("overdue");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showPaidDialog, setShowPaidDialog] = useState<string | null>(null);
  const [showOverdueDialog, setShowOverdueDialog] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProcessing, setUploadProcessing] = useState(false);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = generateOperationId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // All state updates happen inside async callbacks (not synchronously in the
  // effect body) to avoid cascading renders.
  useEffect(() => {
    let active = true;

    requestJson<{ success: boolean; invoices?: InvoiceWithExtras[]; error?: string }>(
      `/api/invoices?filter=${filter}`
    )
      .then((result) => {
        if (!active) return;
        if (result.success) {
          setInvoices(result.invoices || []);
        } else {
          addToast(result.error || "Failed to load invoices", "error");
          setInvoices([]);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        addToast(err instanceof Error ? err.message : "Failed to load invoices", "error");
        setInvoices([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filter, addToast]);

  // Session display (state updates inside async callbacks only)
  useEffect(() => {
    let active = true;
    try {
      getSupabaseBrowserClient()
        .auth.getSession()
        .then(({ data }: { data: { session: Session | null } }) => {
          if (active && data.session?.user?.email) setUserEmail(data.session.user.email);
        })
        .catch(() => {});
    } catch {
      // Supabase not configured — stay signed-out view
    }
    return () => {
      active = false;
    };
  }, []);

  const handleContinue = (id: string) => {
    // Reopens the invoice in the drafting flow: facts restored, tone step next.
    router.push(`/new?invoice=${id}`);
  };

  const handleMarkPaid = (id: string) => {
    setShowPaidDialog(id);
  };

  const confirmMarkPaid = async (id: string) => {
    try {
      const result = await requestJson<{ success: boolean; error?: string }>(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      if (result.success) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, status: "paid" as InvoiceStatus, paidAt: new Date().toISOString() } : inv
          )
        );
        addToast("Invoice marked as paid");
      } else {
        addToast(result.error || "Failed to mark as paid", "error");
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to mark as paid", "error");
    }
    setShowPaidDialog(null);
  };

  const handleMarkOverdue = (id: string) => {
    setShowOverdueDialog(id);
  };

  const confirmMarkOverdue = async (id: string) => {
    try {
      const result = await requestJson<{ success: boolean; error?: string }>(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_overdue" }),
      });
      if (result.success) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, status: "overdue" as InvoiceStatus, paidAt: undefined } : inv
          )
        );
        addToast("Invoice marked as overdue");
      } else {
        addToast(result.error || "Failed to mark as overdue", "error");
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to mark as overdue", "error");
    }
    setShowOverdueDialog(null);
  };

  const handleDelete = (id: string) => {
    setShowDeleteDialog(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const result = await requestJson<{ success: boolean; error?: string }>(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (result.success) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        addToast("Invoice deleted");
      } else {
        addToast(result.error || "Failed to delete", "error");
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete invoice", "error");
    }
    setShowDeleteDialog(null);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    addToast(`Selected ${file.name}. Starting extraction...`);
    // In real app, navigate to /new with file
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
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

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-h3 text-ink font-semibold">Invoice Nudge</Link>
          <div className="flex items-center gap-4">
            {userEmail ? (
              <div className="flex items-center gap-3">
                <span className="text-body-sm text-ink-muted">{userEmail}</span>
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={async () => {
                    try {
                      await getSupabaseBrowserClient().auth.signOut();
                    } finally {
                      setUserEmail(null);
                      router.push("/");
                    }
                  }}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-secondary btn-sm">Sign in</Link>
            )}
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

          {loading ? (
            <Card className="py-12 px-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-surface-subtle rounded w-3/4 mb-2" />
                    <div className="h-4 bg-surface-subtle rounded w-1/2" />
                  </div>
                ))}
              </div>
            </Card>
          ) : filteredInvoices.length === 0 ? (
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