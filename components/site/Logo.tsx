import Image from "next/image";

/**
 * Brand logo. Assets are generated from the client's master logo by scripts/build-logo.mjs:
 *  - /brand/logo.png       full logo (camera + "Magnetify.ca"), transparent, 1246x240
 *  - /brand/logo-mark.png  camera mark only, transparent, 368x240
 */
const FULL = { src: "/brand/logo.png", w: 1246, h: 240 };
const MARK = { src: "/brand/logo-mark.png", w: 368, h: 240 };

/** Camera mark only (icons, About section). Size it with height classes, e.g. "h-24". */
export function LogoMark({ className = "h-10", title }: { className?: string; title?: string }) {
  return (
    <Image
      src={MARK.src}
      width={MARK.w}
      height={MARK.h}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={`w-auto object-contain ${className}`}
      sizes="160px"
    />
  );
}

/** Full logo. `compact` is used in tight spaces (mobile drawer, admin sidebar). */
export function Logo({ compact = false, priority = false, className }: { compact?: boolean; priority?: boolean; className?: string }) {
  return (
    <Image
      src={FULL.src}
      width={FULL.w}
      height={FULL.h}
      alt="Magnetify.ca"
      priority={priority}
      className={`w-auto object-contain ${className ?? (compact ? "h-9" : "h-10 sm:h-12")}`}
      sizes="(max-width: 640px) 200px, 260px"
    />
  );
}
