"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant = "primary",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "danger" | "outline";
}) {
  const { pending } = useFormStatus();

  const variantClass =
    variant === "primary"
      ? "btn-brand"
      : variant === "danger"
        ? "bg-danger text-white hover:bg-danger/90 rounded-[var(--radius-control)]"
        : "border border-border bg-surface text-text-primary hover:bg-surface-muted rounded-[var(--radius-control)]";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className ?? ""}`}
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? (pendingLabel ?? "در حال پردازش...") : children}
    </button>
  );
}
