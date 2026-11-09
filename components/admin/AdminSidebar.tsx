"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  DollarSign,
  FileText,
  Home,
  Images,
  LayoutDashboard,
  Library,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/messages", label: "Contact Messages", icon: Mail },
  { href: "/admin/media", label: "Media", icon: Library },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin">
      <ul className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active(href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active(href) ? "bg-gold/15 text-gold-light ring-1 ring-gold/40" : "text-cream/80 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden="true" /> {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gold/40 bg-coal text-gold-light lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gold/30 bg-[#0c0c0c] p-4 lg:flex">
        <Link href="/admin" className="mb-6 px-2 pt-2">
          <Logo compact />
        </Link>
        {nav}
        <Link href="/" target="_blank" className="mt-auto px-3 text-xs text-muted hover:text-gold-light">
          View website ↗
        </Link>
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-gold/40 bg-[#0c0c0c] p-4">
            <div className="mb-6 flex items-center justify-between">
              <Logo compact />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close admin menu" className="p-2 text-gold-light">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
    </>
  );
}
