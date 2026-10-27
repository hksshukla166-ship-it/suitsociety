import { createServiceClient } from "@/lib/supabase/server";
import { getActiveFlashSales } from "@/actions/products";
import { FlashSaleSection } from "@/components/shop/flash-sale-section";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/types";

export default async function FlashSalePage() {
  const flashSales = await getActiveFlashSales();
  const supabase = createServiceClient();

  const salesWithProducts = await Promise.all(
    flashSales.map(async (sale) => {
      if (!sale.product_ids?.length) {
        return { ...sale, products: [] as Product[] };
      }

      const { data: products } = await supabase
        .from("products")
        .select("*, product_images(*), brand:brands(*), category:categories(*)")
        .in("id", sale.product_ids)
        .eq("is_active", true);

      return {
        ...sale,
        products: (products || []).map((p) => ({
          ...p,
          images: p.product_images,
          flash_sale: true,
        })) as Product[],
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="text-center">
        <h1 className="font-serif text-4xl tracking-wider">FLASH SALES</h1>
        <p className="text-muted-foreground mt-2">Limited time offers on premium fashion</p>
      </div>

      {salesWithProducts.length === 0 ? (
        <p className="text-center text-muted-foreground py-20">No active flash sales right now. Check back soon!</p>
      ) : (
        salesWithProducts.map((sale) => (
          <section key={sale.id} className="space-y-6">
            <FlashSaleSection flashSales={[sale]} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sale.products.map((product) => (
                <ProductCard key={product.id} product={product} showBadge="flash" />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
