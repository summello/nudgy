"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";

export type ProcStatus = "pending" | "active" | "done" | "error";

export interface ProcStage {
  key: string;
  label: string;
  status: ProcStatus;
  /** Human-readable detail, e.g. the error message or a timing. */
  detail?: string;
  /** Brief machine code shown as a chip on errors, e.g. SIGNATURE_MISMATCH. */
  code?: string;
  elapsedMs?: number;
}

export interface ProcessingLogProps {
  stages: ProcStage[];
  onRetry?: () => void;
  onManualEntry?: () => void;
}

function StageIcon({ status }: { status: ProcStatus }) {
  if (status === "active") {
    return (
      <svg className="animate-spin h-4 w-4 text-primary flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
        <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30" strokeDashoffset="10" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "done") {
    return (
      <svg className="h-4 w-4 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg className="h-4 w-4 text-danger flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  }
  return <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-border-strong flex-shrink-0" aria-hidden="true" />;
}

function formatElapsed(ms?: number): string | null {
  if (ms === undefined) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function ProcessingLog({ stages, onRetry, onManualEntry }: ProcessingLogProps) {
  const hasError = stages.some((s) => s.status === "error");
  const allDone = stages.length > 0 && stages.every((s) => s.status === "done");

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3 animate-fade-in",
        hasError ? "border-danger bg-danger-soft/40" : allDone ? "border-success bg-success-soft/40" : "border-border bg-surface-subtle"
      )}
      role="status"
      aria-live="polite"
    >
      <ol className="space-y-2.5" aria-label="Processing progress">
        {stages.map((stage) => {
          const elapsed = formatElapsed(stage.elapsedMs);
          return (
            <li key={stage.key} className="flex items-start gap-2.5">
              <span className="mt-0.5"><StageIcon status={stage.status} /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "text-body-sm",
                      stage.status === "pending" && "text-ink-muted",
                      stage.status === "active" && "text-ink font-medium",
                      stage.status === "done" && "text-ink-muted",
                      stage.status === "error" && "text-danger font-medium"
                    )}
                  >
                    {stage.label}
                  </span>
                  {elapsed && stage.status === "done" && (
                    <span className="text-caption text-ink-muted tabular-nums flex-shrink-0">{elapsed}</span>
                  )}
                </div>
                {stage.status === "error" && stage.detail && (
                  <p className="text-body-sm text-danger mt-0.5">
                    {stage.detail}
                    {stage.code && (
                      <span className="ml-2 inline-block align-middle rounded bg-danger-soft border border-danger/30 px-1.5 py-0.5 font-mono text-caption text-danger">
                        {stage.code}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {hasError && (onRetry || onManualEntry) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
          {onManualEntry && (
            <Button variant="quiet" size="sm" onClick={onManualEntry}>
              Enter details manually
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
