import { notFound } from "next/navigation";
import { getAllCategories, getAllFabrics } from "@/actions/admin";
import { getProductByIdAdmin } from "@/actions/products";
import { getManagedCatalogSizes } from "@/lib/catalog-sizes";
import { getManagedCatalogColors } from "@/lib/catalog-colors";
import { ProductForm } from "@/components/admin/product-form";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, fabrics, availableSizes, availableColors] = await Promise.all([
    getProductByIdAdmin(id),
    getAllCategories(),
    getAllFabrics(),
    getManagedCatalogSizes(),
    getManagedCatalogColors(),
  ]);

  if (!product) notFound();

  return (
    <AdminLayout>
      <ProductForm
        categories={categories}
        fabrics={fabrics}
        product={product}
        availableSizes={availableSizes}
        availableColors={availableColors}
      />
    </AdminLayout>
  );
}
