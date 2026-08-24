"use client";

import { useCallback, useRef, useState, DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  selectedFile?: File | null;
  onRemove?: () => void;
  processing?: boolean;
}

export function DropZone({
  onFileSelect,
  accept = ".pdf,.png,.jpg,.jpeg",
  maxSizeMB = 10,
  disabled,
  selectedFile,
  onRemove,
  processing,
}: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a PDF, PNG, or JPG file.";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB.`;
    }
    return null;
  }, [maxSizeMB]);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFileSelect(file);
  }, [onFileSelect, validateFile]);

  const openPicker = useCallback(() => {
    if (!disabled && !processing) fileInputRef.current?.click();
  }, [disabled, processing]);

  // Container-level activation; the inner button stops propagation so a
  // single physical click never reaches both handlers.
  const handleContainerClick = useCallback(() => {
    openPicker();
  }, [openPicker]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (disabled || processing) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [disabled, processing, handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !processing) setIsDragActive(true);
  }, [disabled, processing]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  }, [handleFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div>
        <div className="file-card" role="status" aria-live="polite">
          {selectedFile.type === "application/pdf" ? (
            <svg className="h-6 w-6 text-ink-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-ink-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-body font-medium text-ink truncate">{selectedFile.name}</p>
            <p className="text-body-sm text-ink-muted">{formatFileSize(selectedFile.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            {processing ? (
              <span className="text-body-sm text-ink-muted">Processing…</span>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); openPicker(); }}
                  disabled={disabled || processing}
                >
                  Replace
                </Button>
                {onRemove && (
                  <Button variant="quiet" size="sm" onClick={onRemove} disabled={disabled || processing} aria-label="Remove file">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        {error && (
          <p className="error-text mt-2" role="alert">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
      />
      <div
        className={cn("drop-zone", isDragActive && "drop-zone-active", disabled && "opacity-50 cursor-not-allowed")}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleContainerClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
        aria-label="Upload invoice file"
      >
        <div className="space-y-3 pointer-events-none">
          <svg className="mx-auto h-10 w-10 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <h3 className="text-h3 text-ink">Upload invoice</h3>
            <p className="text-body-sm text-ink-muted mt-1">
              PDF, PNG, or JPG · Up to {maxSizeMB}MB · Your invoice stays private
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={(e) => { e.stopPropagation(); openPicker(); }}
          disabled={disabled || processing}
        >
          Choose file
        </Button>
        <p className="text-body-sm text-ink-muted">or drag and drop</p>
      </div>
      {error && (
        <p className="error-text mt-2" role="alert">{error}</p>
      )}
    </div>
  );
}
