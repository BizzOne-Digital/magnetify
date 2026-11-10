import type { Metadata } from "next";
import { getPageContent } from "@/lib/data";
import { PolicyBody, type PolicyContent } from "@/components/site/PolicyPage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Magnetify collects, uses and protects your personal information and photos.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function PrivacyPage() {
  const content = await getPageContent<PolicyContent>("privacy");
  return <PolicyBody content={content} />;
}
