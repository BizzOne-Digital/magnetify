import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Dancing_Script, Inter, Montserrat, Pacifico, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

// Magnet text fonts (see lib/cart/fonts.ts). Not preloaded: only needed once a customer adds text.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["700"], display: "swap", preload: false });
const dancing = Dancing_Script({ variable: "--font-dancing", subsets: ["latin"], weight: ["700"], display: "swap", preload: false });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400", display: "swap", preload: false });
const pacifico = Pacifico({ variable: "--font-pacifico", subsets: ["latin"], weight: "400", display: "swap", preload: false });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Magnetify | Personalized Photo Magnets",
    template: "%s | Magnetify",
  },
  description:
    "Turn your favorite photos into personalized magnets for families, couples, pets, gifts and businesses. Small magnets, big memories.",
  applicationName: "Magnetify",
  openGraph: {
    type: "website",
    siteName: "Magnetify",
    locale: "en_CA",
    url: siteUrl,
    title: "Magnetify | Personalized Photo Magnets",
    description:
      "Turn your favorite photos into personalized magnets for families, couples, pets, gifts and businesses. Small magnets, big memories.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#090909",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${montserrat.variable} ${playfair.variable} ${dancing.variable} ${bebas.variable} ${pacifico.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ink text-cream">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          toastOptions={{ style: { background: "#151515", border: "1px solid rgba(212,175,55,.4)", color: "#FFF8E7" } }}
        />
      </body>
    </html>
  );
}
