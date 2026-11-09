import { getSiteSettings } from "@/lib/data";
import { isStripeConfigured } from "@/lib/payments";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageTitle title="Settings" description="Contact email, social handles, notices, payments and your password." />
      <SettingsForm initial={settings} stripe={isStripeConfigured()} webhook={Boolean(process.env.STRIPE_WEBHOOK_SECRET)} />
    </>
  );
}
