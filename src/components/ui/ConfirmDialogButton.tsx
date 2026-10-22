"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function ConfirmDialogButton({
  trigger,
  title,
  description,
  confirmLabel = "تایید و حذف",
  cancelLabel = "انصراف",
  onConfirm,
  danger = true,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  danger?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleConfirm() {
    startTransition(async () => {
      try {
        await onConfirm();
        close();
      } catch {
        setError("انجام عملیات با خطا مواجه شد. دوباره تلاش کنید.");
      }
    });
  }

  return (
    <>
      <span onClick={open} className="contents cursor-pointer">
        {trigger}
      </span>
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-0 text-text-primary backdrop:bg-slate-950/50"
      >
        <div className="p-5">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-[var(--radius-control)] border border-border px-3.5 py-2 text-sm text-text-primary hover:bg-surface-muted"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className={`flex items-center gap-2 rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? "bg-danger hover:bg-danger/90" : "bg-brand hover:bg-brand-dark"}`}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
