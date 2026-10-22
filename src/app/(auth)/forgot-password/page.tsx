import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "فراموشی رمز عبور | تراز" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="فراموشی رمز عبور"
      description="ایمیل خود را وارد کنید تا لینک بازنشانی رمز عبور برای شما ارسال شود."
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          بازگشت به صفحه ورود
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
