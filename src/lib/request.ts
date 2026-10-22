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
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("host") ?? "localhost:3000";
  return `${protocol}://${host}`;
}
