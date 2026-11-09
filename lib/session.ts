/**
 * Stateless signed admin session token (HMAC-SHA256 via Web Crypto).
 * Works in both the Node.js runtime and the proxy/edge runtime.
 */
export const SESSION_COOKIE = "magnetify_admin";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  exp: number;
}

const enc = new TextEncoder();

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET must be set (32+ chars)");
    return "dev-only-insecure-secret-change-me-please-0000";
  }
  return s;
}

function b64url(bytes: Uint8Array | string) {
  const bin = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string) {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return atob(pad);
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}

export async function signSession(payload: Omit<SessionPayload, "exp">) {
  const full: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE };
  const body = b64url(unescape(encodeURIComponent(JSON.stringify(full))));
  return `${body}.${await hmac(body)}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const payload = JSON.parse(decodeURIComponent(escape(fromB64url(body)))) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
