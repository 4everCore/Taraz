import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "ثبت‌نام | تراز" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="ساخت حساب تراز"
      description="رایگان ثبت‌نام کنید و مدیریت مالی خود را همین امروز شروع کنید."
      footer={
        <span>
          قبلاً حساب ساخته‌اید؟{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            وارد شوید
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
