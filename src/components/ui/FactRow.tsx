"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./Input";
import { Badge } from "./Badge";

export interface FactRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  label: string;
  value: string;
  type?: "text" | "number" | "date" | "currency";
  confidence?: "high" | "review" | "missing";
  evidence?: string;
  error?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  helperText?: string;
}

export const FactRow = forwardRef<HTMLDivElement, FactRowProps>(
  ({ className, label, value, type = "text", confidence = "high", evidence, error, onChange, required, disabled, id, children, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    const confidenceLabels = {
      high: "High confidence",
      review: "Please check — low confidence",
      missing: "Not found — please enter",
    };

    const confidenceVariants = {
      high: "default" as const,
      review: "needs-review" as const,
      missing: "needs-review" as const,
    };

    const renderInput = () => {
      if (type === "currency") {
        return (
          <Input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            currency
            error={error}
            disabled={disabled}
            aria-required={required}
            inputMode="decimal"
            placeholder="0.00"
          />
        );
      }
      if (type === "date") {
        return (
          <Input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            error={error}
            disabled={disabled}
            aria-required={required}
          />
        );
      }
      if (type === "number") {
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            error={error}
            disabled={disabled}
            aria-required={required}
            inputMode="numeric"
          />
        );
      }
      return (
        <Input
          id={fieldId}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          error={error}
          disabled={disabled}
          aria-required={required}
        />
      );
    };

    return (
      <div ref={ref} className={cn("fact-row", confidence === "review" || confidence === "missing" ? "fact-row-attention" : "", className)} {...props}>
        <div className="flex items-center gap-2">
          <label htmlFor={fieldId} className="label w-32 flex-shrink-0">{label}{required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}</label>
          <div className="flex-1 min-w-0">
            {renderInput()}
          </div>
          {confidence !== "high" && (
            <Badge variant={confidenceVariants[confidence]} className="flex-shrink-0" title={confidenceLabels[confidence]}>
              {confidence === "missing" ? "Missing" : "Review"}
            </Badge>
          )}
        </div>
        {evidence && (
          <details className="mt-1">
            <summary className="text-caption text-ink-muted cursor-pointer hover:text-ink">Show source snippet</summary>
            <p className="text-body-sm text-ink-muted mt-1 p-2 bg-surface-subtle rounded font-mono text-xs overflow-x-auto">{evidence}</p>
          </details>
        )}
      </div>
    );
  }
);

FactRow.displayName = "FactRow";

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; href?: string }>;
  className?: string;
}

export function StepIndicator({ currentStep, totalSteps, steps, className }: StepIndicatorProps) {
  return (
    <nav className={cn("flex items-center gap-4", className)} aria-label="Progress">
      <ol className="flex items-center gap-4" role="list">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <li key={step.label} className="relative">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full text-caption font-medium transition-all duration-fast",
                  isComplete && "bg-primary text-white",
                  isCurrent && "bg-primary text-white ring-4 ring-primary-soft",
                  isFuture && "bg-surface border-2 border-border text-ink-muted",
                )}>
                  {isComplete ? (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className={cn("text-caption text-center max-w-[80px]",
                  isCurrent ? "text-ink font-medium" : "text-ink-muted"
                )}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "absolute top-4 left-1/2 w-full h-0.5 -ml-px",
                  isComplete ? "bg-primary" : "bg-border"
                )} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}