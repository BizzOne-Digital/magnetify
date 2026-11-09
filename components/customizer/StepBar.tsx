"use client";

import { Check, ChevronRight, ImageIcon, MousePointerClick, ShoppingCart, Upload } from "lucide-react";

export const STEPS = [
  { icon: MousePointerClick, label: "Select Size" },
  { icon: Upload, label: "Upload Your Photos" },
  { icon: ImageIcon, label: "Reposition Photos & Add Text" },
  { icon: ShoppingCart, label: "Checkout" },
] as const;

/**
 * Live "How to Customize" steps. Each step is a button that jumps to that part of the
 * customizer; completed steps show a check and the current step is highlighted.
 */
export function StepBar({
  done,
  current,
  hints,
  onStep,
}: {
  done: boolean[];
  current: number;
  hints: string[];
  onStep: (index: number) => void;
}) {
  return (
    <nav aria-label="Customization steps" className="mb-6">
      <ol className="grid grid-cols-2 gap-3 md:flex md:items-stretch md:justify-center md:gap-2">
        {STEPS.map((s, i) => {
          const isDone = done[i];
          const isCurrent = i === current;
          return (
            <li key={s.label} className="flex items-center gap-2 md:flex-1">
              <button
                type="button"
                onClick={() => onStep(i)}
                aria-current={isCurrent ? "step" : undefined}
                data-step={i + 1}
                data-state={isDone ? "done" : isCurrent ? "current" : "todo"}
                className={`flex h-full w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
                  isCurrent
                    ? "border-gold bg-gold/10 shadow-[0_0_22px_rgba(212,175,55,0.3)]"
                    : isDone
                      ? "border-gold/60 bg-card"
                      : "border-white/15 bg-card hover:border-gold/50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${
                    isDone || isCurrent ? "bg-gold-metal text-ink" : "bg-white/10 text-cream/70"
                  } ${isCurrent ? "animate-pulse" : ""}`}
                >
                  {isDone ? <Check className="h-4 w-4" aria-label="Done" /> : i + 1}
                </span>
                <s.icon className={`hidden h-5 w-5 shrink-0 sm:block ${isCurrent ? "text-gold-light" : "text-cream"}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold leading-tight ${isCurrent ? "text-gold-light" : "text-cream"}`}>{s.label}</span>
                  <span className="block text-[11px] leading-tight text-muted">{hints[i]}</span>
                </span>
              </button>
              {i < STEPS.length - 1 ? <ChevronRight className="hidden h-5 w-5 shrink-0 text-cream/60 md:block" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
