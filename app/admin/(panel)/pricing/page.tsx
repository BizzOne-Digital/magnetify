import { safeDb } from "@/lib/db";
import { Product } from "@/models";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { PricingEditor } from "@/components/admin/PricingEditor";
import { SeedProductsButton } from "@/components/admin/SeedProductsButton";

export default async function AdminPricingPage() {
  const products = await safeDb(() => Product.find().sort({ sortOrder: 1 }).lean(), []);
  return (
    <>
      <AdminPageTitle title="Pricing" description="Quickly update regular, sale, minimum and bulk prices for all products." />
      {products.length === 0 ? (
        <div className="card-dark space-y-3 p-6 text-sm text-muted">
          <p>Import the default catalog first to manage pricing.</p>
          <SeedProductsButton empty />
        </div>
      ) : (
        <PricingEditor products={JSON.parse(JSON.stringify(products))} />
      )}
    </>
  );
}
