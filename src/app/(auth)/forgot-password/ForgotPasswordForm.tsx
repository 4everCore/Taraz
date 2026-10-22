"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { FormField, inputClassName } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/lib/errors";

const initialState: ActionResult<null> | null = null;

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-muted p-6 text-center">
        <CheckCircle2 size={28} className="text-success" />
        <p className="text-sm text-text-primary">
          اگر ایمیل وارد شده در سامانه ثبت شده باشد، لینک بازنشانی رمز عبور برای آن ارسال شد.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormField label="ایمیل" htmlFor="email" required>
        <input id="email" name="email" type="email" dir="ltr" autoComplete="email" required className={inputClassName} placeholder="you@example.com" />
      </FormField>
      {state?.success === false && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="در حال ارسال...">ارسال لینک بازنشانی</SubmitButton>
    </form>
  );
}
