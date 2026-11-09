import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { IntroSplash } from "@/components/site/IntroSplash";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <IntroSplash />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </CartProvider>
  );
}
