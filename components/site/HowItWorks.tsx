import { SectionHeading } from "@/components/site/ui";

/** Heading for the live customizer; the interactive steps live in components/customizer/StepBar.tsx. */
export function HowItWorks({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <SectionHeading title={title} subtitle={subtitle} />
    </div>
  );
}
