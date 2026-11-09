import { useId } from "react";

/** Magnetify camera mark: gold camera outline with an "M" lens. */
export function LogoMark({ className = "h-10 w-10", title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 56" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF1B8" />
          <stop offset="0.35" stopColor="#F5D67B" />
          <stop offset="0.65" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#A8801E" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#g${id})`} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M8 14h11l4-6h18l4 6h11a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5z" />
        <rect x="9" y="8" width="7" height="4" rx="1.5" />
        <circle cx="32" cy="31" r="13" />
        <circle cx="32" cy="31" r="9.5" strokeWidth="1.5" opacity="0.7" />
        <path d="M26.5 36.5v-11l5.5 7 5.5-7v11" strokeWidth="2.6" />
      </g>
      <circle cx="51" cy="21" r="1.8" fill={`url(#g${id})`} />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={compact ? "h-9 w-10" : "h-11 w-12"} />
      <span className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
        <span className="text-gold-metal">Magnetify</span>
      </span>
    </span>
  );
}
