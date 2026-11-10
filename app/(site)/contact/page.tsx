import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getPageContent, getSiteSettings } from "@/lib/data";
import { PageHero } from "@/components/site/ui";
import { ContactForm } from "@/components/site/ContactForm";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/icons/BrandIcons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Magnetify about personalized photo magnets, bulk orders and business magnets. Email magnetify1@hotmail.com.",
  alternates: { canonical: "/contact" },
};

type ContactContent = { heroTitle: string; heroText: string; formTitle: string; responseNote: string };

export default async function ContactPage() {
  const [c, site] = await Promise.all([getPageContent<ContactContent>("contact"), getSiteSettings()]);
  return (
    <>
      <PageHero eyebrow="CONTACT" title={c.heroTitle} text={c.heroText} />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <div className="card-gold p-6 sm:p-8">
            <h2 className="font-display text-sm font-bold tracking-[0.2em] text-champagne">EMAIL</h2>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-3 flex items-center gap-3 break-all font-display text-xl font-bold text-cream hover:text-gold-light sm:text-2xl"
            >
              <Mail className="h-7 w-7 shrink-0 text-gold" aria-hidden="true" />
              {site.contactEmail}
            </a>
            <p className="mt-3 text-sm text-muted">{c.responseNote}</p>
          </div>
          <div className="card-dark space-y-3 p-6">
            <h2 className="font-display text-sm font-bold tracking-[0.2em] text-champagne">FOLLOW US</h2>
            <a href={`https://www.facebook.com/${site.facebookHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cream hover:text-gold-light">
              <FacebookIcon className="h-7 w-7" /> Facebook: <strong>{site.facebookHandle}</strong>
            </a>
            <a href={`https://www.instagram.com/${site.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cream hover:text-gold-light">
              <InstagramIcon className="h-7 w-7" /> Instagram: <strong>{site.instagramHandle}</strong>
            </a>
            {site.tiktokHandle ? (
              <a href={`https://www.tiktok.com/@${site.tiktokHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-cream hover:text-gold-light">
                <TikTokIcon className="h-7 w-7" /> TikTok: <strong>{site.tiktokHandle}</strong>
              </a>
            ) : null}
          </div>
        </div>
        <ContactForm title={c.formTitle} />
      </section>
    </>
  );
}
