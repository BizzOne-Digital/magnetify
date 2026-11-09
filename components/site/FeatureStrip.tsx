import { Heart, Smartphone, Store, ThumbsUp } from "lucide-react";

const ICONS = [ThumbsUp, Smartphone, Heart, Store];

export function FeatureStrip({ features }: { features: { title: string; text?: string }[] }) {
  return (
    <section className="mt-14 border-y border-gold/30 bg-coal" aria-label="Why customers choose Magnetify">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-gold/30">
        {features.slice(0, 4).map((f, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <li key={f.title} className="flex items-center justify-center gap-3 px-2 lg:px-6">
              <Icon className="h-9 w-9 shrink-0 text-gold" strokeWidth={1.4} aria-hidden="true" />
              <span>
                <span className="block font-display text-sm font-bold leading-tight text-cream sm:text-base">{f.title}</span>
                {f.text ? <span className="hidden text-xs text-muted sm:block">{f.text}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
