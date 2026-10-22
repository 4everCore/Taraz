import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

export async function sendEmail(input: SendEmailInput): Promise<{ delivered: boolean }> {
  if (!isSmtpConfigured()) {
    console.info(`[taraz-mail-console] به: ${input.to} | موضوع: ${input.subject}`);
    console.info(input.html);
    return { delivered: false };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { delivered: true };
}

export function renderPasswordResetEmail(resetUrl: string): string {
  return `<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right">
    <p>برای بازنشانی رمز عبور حساب تراز خود روی لینک زیر کلیک کنید. این لینک تا ۶۰ دقیقه معتبر است.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
  </div>`;
}
