"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { useCart } from "@/components/cart/CartProvider";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/products", label: "Products / Shop" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const cart = (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-gold-light transition hover:bg-white/5"
      aria-label={`Shopping cart, ${ready ? count : 0} magnets`}
    >
      <ShoppingCart className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-promo px-1 text-[11px] font-bold text-cream ring-2 ring-ink">
        {ready ? count : 0}
      </span>
    </Link>
  );

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-gold/40 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/85">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Magnetify home" className="shrink-0">
          <Logo priority />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <span className="h-8 w-px bg-gold/40" aria-hidden="true" />
          <nav aria-label="Main">
            <ul className="flex items-center gap-7">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    className={`relative py-2 text-[15px] font-medium transition-colors ${
                      isActive(n.href) ? "text-gold-light" : "text-cream/90 hover:text-gold-light"
                    }`}
                  >
                    {n.label}
                    {isActive(n.href) && (
                      <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-gold-metal" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {cart}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {cart}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gold-light hover:bg-white/5"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Menu className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile drawer (outside <header>: backdrop-filter would trap position:fixed) */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? "" : "pointer-events-none invisible"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/70 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-gold/50 bg-coal p-6 shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <Logo compact />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gold-light hover:bg-white/5"
              aria-label="Close menu"
              tabIndex={open ? 0 : -1}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <ul className="space-y-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  tabIndex={open ? 0 : -1}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 font-display text-lg font-semibold ${
                    isActive(n.href) ? "bg-gold/10 text-gold-light ring-1 ring-gold/40" : "text-cream hover:bg-white/5"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="gold-divider my-6" />
          <Link href="/customize" tabIndex={open ? 0 : -1} className="btn btn-primary w-full">
            Start Customizing
          </Link>
          <Link href="/cart" tabIndex={open ? 0 : -1} className="btn btn-secondary mt-3 w-full">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" /> View Cart ({ready ? count : 0})
          </Link>
        </nav>
      </div>
    </>
  );
}
