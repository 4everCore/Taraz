import { headers } from "next/headers";

export async function getClientIp(): Promise<string | null> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }
  return headerList.get("x-real-ip");
}

export async function getUserAgent(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get("user-agent");
}

export async function getOrigin(): Promise<string> {
  // Prefer a configured application URL. Never trust the Host header for
  // security-sensitive links (e.g. password reset), otherwise an attacker
  // can poison the link via host-header injection.
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("host") ?? "localhost:3000";
  return `${protocol}://${host}`;
}
