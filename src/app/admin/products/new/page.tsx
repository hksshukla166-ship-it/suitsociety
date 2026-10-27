import { getAllCategories, getAllFabrics } from "@/actions/admin";
import { getManagedCatalogSizes } from "@/lib/catalog-sizes";
import { getManagedCatalogColors } from "@/lib/catalog-colors";
import { ProductForm } from "@/components/admin/product-form";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default async function NewProductPage() {
  const [categories, fabrics, availableSizes, availableColors] = await Promise.all([
    getAllCategories(),
    getAllFabrics(),
    getManagedCatalogSizes(),
    getManagedCatalogColors(),
  ]);

  return (
    <AdminLayout>
    <div>
      <h1 className="text-2xl font-serif tracking-wider mb-6 text-white">Add New Product</h1>
      <ProductForm
        categories={categories}
        fabrics={fabrics}
        availableSizes={availableSizes}
        availableColors={availableColors}
      />
    </div>
    </AdminLayout>
  );
}
