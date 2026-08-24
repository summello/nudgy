"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { DropZone } from "@/components/ui";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF, PNG, or JPG file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
  };

  const handleContinue = () => {
    if (selectedFile) {
      // In a real app, this would navigate to /new with the file
      // For now, we'll simulate the flow
      window.location.href = `/new?file=${encodeURIComponent(selectedFile.name)}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-h3 text-ink font-semibold">Invoice Nudge</span>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="text-body-sm text-ink-muted hover:text-ink transition-colors">
              Privacy
            </Link>
            <Link href="/invoices" className="btn btn-quiet">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-display text-ink font-semibold leading-tight">
                  Upload an unpaid invoice. Get the perfect follow-up in 10 seconds.
                </h1>
                <p className="text-body-lg text-ink-muted">
                  Turn overdue invoices into polished, payment-ready reminders. Choose your tone, add your UPI ID, and export to Email or WhatsApp — all without retyping a thing.
                </p>
              </div>

              <div className="space-y-3 text-body text-ink-muted border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Your invoice stays private — processed securely, never stored publicly</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Indian-first: INR formatting, UPI IDs, WhatsApp click-to-chat</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>You stay in control — review every detail, edit every word, choose when to send</span>
                </div>
              </div>

              <p className="text-body-sm text-ink-muted">
                By uploading, you agree to our <Link href="/privacy" className="underline hover:text-ink">Privacy Policy</Link>. We use AI to draft reminders from the details you confirm.
              </p>
            </div>

            <div className="card-elevated p-6 lg:p-8">
              <DropZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onRemove={handleRemove}
                processing={processing}
                maxSizeMB={10}
              />
              {error && (
                <div className="mt-4 p-3 bg-danger-soft border border-danger text-danger rounded-lg text-body-sm" role="alert">
                  {error}
                </div>
              )}
              {selectedFile && !processing && (
                <Button className="mt-4 w-full" size="lg" onClick={handleContinue}>
                  Continue — Check details
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-8">
        <div className="max-w-7xl mx-auto text-center text-body-sm text-ink-muted">
          <p>Invoice Nudge — Built for Indian freelancers. Not an accounting tool. Not a collections agent.</p>
        </div>
      </footer>
    </div>
  );
}