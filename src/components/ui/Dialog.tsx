"use client";

import { useEffect, useRef, Fragment } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { createPortal } from "react-dom";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  onConfirm,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      contentRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const dialogContent = (
    <Fragment>
      <div
        ref={overlayRef}
        className="dialog-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="text-h3 text-ink mb-1">{title}</h2>
        {description && (
          <p id="dialog-description" className="text-body text-ink-muted mb-6">
            {description}
          </p>
        )}
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Fragment>
  );

  if (typeof window === "undefined") return null;

  return createPortal(dialogContent, document.body);
}

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function AlertDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}: AlertDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      cancelLabel={cancelLabel}
      destructive={destructive}
      loading={loading}
    >
      <p className="text-body text-ink-muted">{message}</p>
    </Dialog>
  );
}