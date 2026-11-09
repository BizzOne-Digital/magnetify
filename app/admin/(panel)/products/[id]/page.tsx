import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { safeDb } from "@/lib/db";
import { Product } from "@/models";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";

const EMPTY: ProductFormValues = {
  slug: "",
  name: "",
  shortName: "",
  kind: "photo",
  size: "2x2",
  regularPrice: 5.99,
  salePrice: 4.99,
  minOrder: 9,
  description: "",
  image: "",
  gallery: [],
  status: "draft",
  bulkTiers: [
    { minQty: 50, price: 4.49, label: "OVER 50 MAGNETS" },
    { minQty: 100, price: 3.99, label: "OVER 100 MAGNETS" },
  ],
  sortOrder: 10,
};

export default async function AdminProductEdit({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  let initial = EMPTY;
  if (id !== "new") {
    if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
    const p = await safeDb(() => Product.findById(id).lean(), null);
    if (!p) notFound();
    initial = {
      slug: p.slug,
      name: p.name,
      shortName: p.shortName,
      kind: p.kind,
      size: p.size,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      minOrder: p.minOrder,
      description: p.description ?? "",
      image: p.image ?? "",
      gallery: p.gallery ?? [],
      status: p.status,
      bulkTiers: (p.bulkTiers ?? []).map((t) => ({ minQty: t.minQty, price: t.price, label: t.label ?? "" })),
      sortOrder: p.sortOrder ?? 0,
    };
  }
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-light hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All products
      </Link>
      <AdminPageTitle title={id === "new" ? "New product" : `Edit: ${initial.name}`} />
      <ProductForm id={id === "new" ? null : id} initial={initial} />
    </>
  );
}
