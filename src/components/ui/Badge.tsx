import type { ReactNode } from "react";

type BadgeTone = "success" | "danger" | "warning" | "brand" | "neutral";

const TONE_CLASS: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  brand: "bg-brand-light text-brand-dark",
  neutral: "bg-surface-muted text-text-secondary",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}
