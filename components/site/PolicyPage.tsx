import { PageHero } from "@/components/site/ui";

export type PolicyContent = { heroTitle: string; intro: string; sections: { title: string; text: string }[] };

export function PolicyBody({ content, children }: { content: PolicyContent; children?: React.ReactNode }) {
  return (
    <>
      <PageHero title={content.heroTitle} text={content.intro} />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-14 sm:px-6">
        {children}
        {(content.sections ?? []).map((s) => (
          <section key={s.title} className="card-dark p-6">
            <h2 className="font-display text-xl font-bold text-gold-light">{s.title}</h2>
            {String(s.text ?? "")
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-cream/85">
                  {p}
                </p>
              ))}
          </section>
        ))}
      </div>
    </>
  );
}
