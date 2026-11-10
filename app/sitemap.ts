import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || "https://magnetify.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/products", "/customize", "/pricing", "/about", "/contact", "/shipping", "/privacy-policy"];
  return routes.map((r, i) => ({
    url: `${base}${r}`,
    changeFrequency: "weekly",
    priority: i === 0 ? 1 : 0.7,
  }));
}
