import Link from "next/link";
import { PAGE_DEFS } from "@/lib/contentSchema";
import { ContentPage } from "@/components/admin/ContentPage";
import { AdminPageTitle } from "@/components/admin/AdminHeader";

const EDITABLE = PAGE_DEFS.filter((p) => !["home", "gallery"].includes(p.key));

export default async function AdminPages({ searchParams }: PageProps<"/admin/pages">) {
  const sp = await searchParams;
  const key = typeof sp.key === "string" ? sp.key : null;
  if (key && EDITABLE.some((p) => p.key === key)) {
    return (
      <>
        <Link href="/admin/pages" className="mb-4 inline-block text-sm text-gold-light hover:underline">
          ← All pages
        </Link>
        <ContentPage pageKey={key} />
      </>
    );
  }
  return (
    <>
      <AdminPageTitle title="Pages" description="Edit the content of each public page. Homepage and Gallery have their own sections." />
      <ul className="grid gap-4 md:grid-cols-2">
        {EDITABLE.map((p) => (
          <li key={p.key}>
            <Link href={`/admin/pages?key=${p.key}`} className="card-dark block p-5 transition hover:border-gold/60">
              <p className="font-display text-lg font-bold text-cream">{p.title}</p>
              <p className="text-sm text-muted">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
