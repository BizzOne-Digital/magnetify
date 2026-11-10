import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/icons/BrandIcons";
import { getSiteSettings } from "@/lib/data";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/shipping", label: "Shipping" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

export async function Footer() {
  const s = await getSiteSettings();
  return (
    <footer className="mt-auto border-t border-gold/40 bg-[#070707]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1.3fr] md:items-start">
        <div className="space-y-4">
          <Link href="/" aria-label="Magnetify home" className="inline-block">
            <Logo className="h-12 sm:h-14" />
          </Link>
          <p className="max-w-xs text-sm text-muted">Small magnets, big memories. Personalized photo magnets made in Canada.</p>
          <a href={`mailto:${s.contactEmail}`} className="inline-flex items-center gap-2 text-sm text-gold-light hover:underline">
            <Mail className="h-4 w-4" aria-hidden="true" /> {s.contactEmail}
          </a>
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-4 font-display text-sm font-bold tracking-[0.18em] text-champagne">QUICK LINKS</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cream/85 hover:text-gold-light">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 font-display text-sm font-bold tracking-[0.18em] text-champagne">FOLLOW US</h2>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href={`https://www.facebook.com/${s.facebookHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-cream/90 hover:text-gold-light"
              >
                <FacebookIcon className="h-7 w-7" />
                <span>
                  Facebook: <strong className="text-cream">{s.facebookHandle}</strong>
                </span>
              </a>
            </li>
            <li>
              <a
                href={`https://www.instagram.com/${s.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-cream/90 hover:text-gold-light"
              >
                <InstagramIcon className="h-7 w-7" />
                <span>
                  Instagram: <strong className="text-cream">{s.instagramHandle}</strong>
                </span>
              </a>
            </li>
            {s.tiktokHandle ? (
              <li>
                <a
                  href={`https://www.tiktok.com/@${s.tiktokHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-cream/90 hover:text-gold-light"
                >
                  <TikTokIcon className="h-7 w-7" />
                  <span>
                    TikTok: <strong className="text-cream">{s.tiktokHandle}</strong>
                  </span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} Magnetify. All rights reserved. {s.finalSaleNotice}
        </p>
      </div>
    </footer>
  );
}
