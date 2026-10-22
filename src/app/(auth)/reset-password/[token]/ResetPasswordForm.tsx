"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";
import { FormField, inputClassName } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/lib/errors";

const initialState: ActionResult<null> | null = null;

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-muted p-6 text-center">
        <CheckCircle2 size={28} className="text-success" />
        <p className="text-sm text-text-primary">رمز عبور شما با موفقیت تغییر کرد.</p>
        <Link href="/login" className="text-sm font-medium text-brand hover:underline">
          ورود به حساب
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormField
        label="رمز عبور جدید"
        htmlFor="password"
        hint="حداقل ۸ کاراکتر شامل حرف و عدد"
        error={state?.success === false ? state.fieldErrors?.password : undefined}
        required
      >
        <input id="password" name="password" type="password" dir="ltr" autoComplete="new-password" required className={inputClassName} placeholder="••••••••" />
      </FormField>
      {state?.success === false && !state.fieldErrors && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="در حال ثبت...">تغییر رمز عبور</SubmitButton>
    </form>
  );
}
