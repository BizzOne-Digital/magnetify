import { notFound } from "next/navigation";
import { safeDb } from "@/lib/db";
import { PageContent } from "@/models";
import { DEFAULT_CONTENT, PAGE_DEFS } from "@/lib/contentSchema";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { ContentEditor } from "@/components/admin/ContentEditor";

/** Server wrapper: loads stored content (merged over defaults) and renders the editor. */
export async function ContentPage({ pageKey }: { pageKey: string }) {
  const def = PAGE_DEFS.find((p) => p.key === pageKey);
  if (!def) notFound();
  const stored = await safeDb(async () => (await PageContent.findOne({ key: def.key }).lean())?.data ?? {}, {});
  const initial = JSON.parse(JSON.stringify({ ...DEFAULT_CONTENT[def.key], ...stored }));
  return (
    <>
      <AdminPageTitle title={def.title} description={def.description} />
      <ContentEditor key={def.key} def={def} initial={initial} />
    </>
  );
}
