"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { FormField, inputClassName } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionResult } from "@/lib/errors";

const initialState: ActionResult<null> | null = null;

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormField label="ایمیل" htmlFor="email" error={state?.success === false ? state.fieldErrors?.email : undefined} required>
        <input id="email" name="email" type="email" autoComplete="email" dir="ltr" required className={inputClassName} placeholder="you@example.com" />
      </FormField>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            رمز عبور <span className="text-danger">*</span>
          </label>
          <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">
            فراموشی رمز عبور
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          className={`${inputClassName} mt-1.5`}
          placeholder="••••••••"
        />
      </div>
      {state?.success === false && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="در حال ورود...">ورود</SubmitButton>
    </form>
  );
}
