import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-sm font-bold tracking-[0.25em] text-champagne">404</p>
      <h1 className="section-title text-gold-metal mt-2 text-4xl">Page not found</h1>
      <p className="mt-4 text-cream/80">The page you are looking for has moved or does not exist.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to Home
      </Link>
    </div>
  );
}
