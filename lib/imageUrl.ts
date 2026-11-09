export const PLACEHOLDER_IMAGE = "/placeholder.svg";

const ALLOWED_REMOTE_HOSTS = ["images.unsplash.com"];

/** Returns a URL that is safe to render in production. Legacy /uploads/ disk paths fall back to a placeholder. */
export function getSafeImageUrl(image: unknown, fallback: string = PLACEHOLDER_IMAGE): string {
  if (typeof image !== "string" || !image.trim()) return fallback;
  const v = image.trim();
  if (v.startsWith("/api/uploads/")) return v;
  if (v.startsWith("/uploads/")) return fallback;
  if (v.startsWith("https://")) {
    try {
      const u = new URL(v);
      if (ALLOWED_REMOTE_HOSTS.includes(u.hostname)) return v;
    } catch {
      return fallback;
    }
    return fallback;
  }
  if (v.startsWith("/") && !v.startsWith("//")) return v; // static asset in /public
  return fallback;
}

export function unsplash(id: string, w = 900, h?: number) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=80`;
}
