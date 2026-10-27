import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/actions/products";
import { getProductReviews } from "@/actions/auth";
import { getUserSession } from "@/lib/auth";
import { ProductDetail } from "@/components/shop/product-detail";
import { ReviewSection } from "@/components/shop/review-section";
import { ProductCard } from "@/components/shop/product-card";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.description || undefined,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images?.[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related, session] = await Promise.all([
    getProductReviews(product.id),
    product.category_id
      ? getProducts({ category: product.category?.slug, limit: 4 })
      : Promise.resolve({ products: [], total: 0 }),
    getUserSession(),
  ]);

  const relatedProducts = related.products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div>
      <ProductDetail product={product} />

      <ReviewSection
        productId={product.id}
        productName={product.name}
        reviews={reviews}
        isLoggedIn={!!session}
      />

      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="font-serif text-2xl tracking-wider mb-6">YOU MAY ALSO LIKE</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
