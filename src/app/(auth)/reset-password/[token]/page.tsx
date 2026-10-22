import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "بازنشانی رمز عبور | تراز" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="تعیین رمز عبور جدید" description="یک رمز عبور جدید و امن برای حساب خود انتخاب کنید.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
