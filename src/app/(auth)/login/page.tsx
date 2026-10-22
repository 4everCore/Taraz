import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "ورود | تراز" };

export default function LoginPage() {
  return (
    <AuthShell
      title="ورود به تراز"
      description="برای مشاهده داشبورد مالی خود وارد شوید."
      footer={
        <span>
          هنوز حساب ندارید؟{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            ثبت‌نام کنید
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
