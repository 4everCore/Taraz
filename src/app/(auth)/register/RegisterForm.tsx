"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { FormField, inputClassName } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/lib/errors";

const initialState: ActionResult<null> | null = null;

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormField label="نام نمایشی" htmlFor="displayName" error={state?.success === false ? state.fieldErrors?.displayName : undefined} required>
        <input id="displayName" name="displayName" type="text" autoComplete="name" required className={inputClassName} placeholder="مثلاً سارا احمدی" />
      </FormField>
      <FormField label="ایمیل" htmlFor="email" error={state?.success === false ? state.fieldErrors?.email : undefined} required>
        <input id="email" name="email" type="email" autoComplete="email" dir="ltr" required className={inputClassName} placeholder="you@example.com" />
      </FormField>
      <FormField
        label="رمز عبور"
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
      <SubmitButton pendingLabel="در حال ساخت حساب...">ساخت حساب</SubmitButton>
      <p className="text-center text-xs leading-6 text-text-secondary">
        با ثبت‌نام، شرایط استفاده و حریم خصوصی تراز را می‌پذیرید.
      </p>
    </form>
  );
}
