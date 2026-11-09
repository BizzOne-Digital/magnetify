import { getShippingConfig } from "@/lib/data";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { ShippingForm } from "@/components/admin/ShippingForm";

export default async function AdminShippingPage() {
  const config = await getShippingConfig();
  return (
    <>
      <AdminPageTitle title="Shipping" description="Flat rate, free shipping threshold, local pickup and optional province zones." />
      <ShippingForm initial={config} />
    </>
  );
}
