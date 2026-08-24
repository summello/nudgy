"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ToneCardProps extends Omit<HTMLAttributes<HTMLLabelElement>, "onSelect"> {
  tone: "friendly" | "firm" | "final_notice";
  selected?: boolean;
  recommended?: boolean;
  onSelect: (tone: "friendly" | "firm" | "final_notice") => void;
}

const toneData = {
  friendly: {
    label: "Friendly",
    description: "Warm and concise; assumes oversight; asks for an update.",
    sample: "Just checking in on invoice #INV-001 — hope all's well!",
  },
  firm: {
    label: "Firm",
    description: "Direct and professional; clearly states overdue status; requests payment or a specific date.",
    sample: "Invoice #INV-001 is 14 days overdue. Please confirm when payment will be made.",
  },
  final_notice: {
    label: "Final Notice",
    description: "Calm and unambiguous; names a response deadline; does not threaten legal action.",
    sample: "This is a final reminder for invoice #INV-001. We need a response by 30 Aug.",
  },
};

export const ToneCard = forwardRef<HTMLLabelElement, ToneCardProps>(
  ({ className, tone, selected, recommended, onSelect, children, ...props }, ref) => {
    const data = toneData[tone];

    const handleClick = () => {
      onSelect(tone);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <label
        ref={ref}
        className={cn(
          "tone-card",
          selected && "tone-card-selected",
          recommended && !selected && "tone-card-recommended",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <input
          type="radio"
          name="tone"
          value={tone}
          checked={selected}
          onChange={() => onSelect(tone)}
          className="sr-only"
          aria-label={data.label}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-label text-ink font-semibold">{data.label}</h4>
              {recommended && (
                <span className="badge bg-accent-soft text-accent text-[11px] px-2 py-0.5 rounded">Recommended</span>
              )}
            </div>
            <p className="text-body-sm text-ink-muted mb-2">{data.description}</p>
            <p className="text-body-sm text-ink/70 italic">"{data.sample}"</p>
          </div>
          <div className="flex-shrink-0">
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-fast",
              selected ? "border-primary bg-primary" : "border-border"
            )}>
              {selected && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </label>
    );
  }
);

ToneCard.displayName = "ToneCard";