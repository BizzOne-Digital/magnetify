import Link from "next/link";
import { CheckSquare, Mail, Square } from "lucide-react";
import { LogoMark } from "@/components/site/Logo";

export function AboutStrip({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 pt-14 sm:px-6 lg:grid-cols-[1.25fr_1fr]" aria-label="About Magnetify">
      <div className="card-gold flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
        <LogoMark className="h-24 shrink-0 sm:h-28" title="Magnetify" />
        <span className="hidden h-28 w-px bg-gold/40 sm:block" aria-hidden="true" />
        <div className="text-center sm:text-left">
          <h2 className="section-title text-gold-metal text-2xl sm:text-3xl">{title}</h2>
          <p className="mt-3 leading-relaxed text-cream/85">{text}</p>
          <Link href="/about" className="mt-4 inline-block text-sm font-semibold text-gold-light hover:underline">
            Read our story
          </Link>
        </div>
      </div>
      <div className="card-gold p-6 sm:p-8">
        <h2 className="section-title text-gold-metal text-2xl sm:text-[1.7rem]">Social Media Feature Consent</h2>
        <p className="mt-2 text-sm text-muted">You choose at checkout — we only share orders with your permission.</p>
        <ul className="mt-4 space-y-3 text-cream/90">
          <li className="flex gap-3">
            <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />I agree to have my order featured in your social media
            content.
          </li>
          <li className="flex gap-3">
            <Square className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />I do not agree to have my order featured in your social
            media content.
          </li>
        </ul>
      </div>
    </section>
  );
}

export function EmailBar({ email }: { email: string }) {
  return (
    <section className="relative mt-14 overflow-hidden py-10" aria-label="Contact email">
      <div
        className="absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(212,175,55,0.25),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-2xl px-4">
        <a
          href={`mailto:${email}`}
          className="flex items-center justify-center gap-3 rounded-2xl border-2 border-gold bg-ink px-5 py-4 font-display text-lg font-bold text-cream shadow-[0_0_30px_rgba(212,175,55,0.2)] transition hover:bg-[#15120a] sm:text-2xl"
        >
          <Mail className="h-7 w-7 shrink-0 text-gold" aria-hidden="true" />
          <span className="break-all">{email}</span>
        </a>
      </div>
    </section>
  );
}
