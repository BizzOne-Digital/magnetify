import Link from "next/link";
import { Plus } from "lucide-react";
import { safeDb } from "@/lib/db";
import { Product } from "@/models";
import { getSafeImageUrl } from "@/lib/imageUrl";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SeedProductsButton } from "@/components/admin/SeedProductsButton";

export default async function AdminProductsPage() {
  const products = await safeDb(() => Product.find().sort({ sortOrder: 1, createdAt: 1 }).lean(), []);
  return (
    <>
      <AdminPageTitle title="Products" description="Prices, minimums, images and bulk tiers for every magnet product.">
        <SeedProductsButton empty={products.length === 0} />
        <Link href="/admin/products/new" className="btn btn-gold btn-sm">
          <Plus className="h-4 w-4" aria-hidden="true" /> New product
        </Link>
      </AdminPageTitle>
      {products.length === 0 ? (
        <div className="card-dark p-6 text-sm text-muted">
          No products in the database yet. The website is currently showing the default catalog. Click <strong className="text-cream">Import default catalog</strong> to start managing it here.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <li key={String(p._id)}>
              <Link href={`/admin/products/${p._id}`} className="card-dark flex gap-4 p-4 transition hover:border-gold/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getSafeImageUrl(p.image)} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-display font-bold text-cream">{p.name}</p>
                  <p className="text-muted">
                    {p.size} · {p.kind} · min {p.minOrder}
                  </p>
                  <p>
                    <s className="text-cream/50">${p.regularPrice.toFixed(2)}</s> <strong className="text-gold-light">${p.salePrice.toFixed(2)}</strong>
                  </p>
                  <div className="mt-1">
                    <StatusBadge value={p.status} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
