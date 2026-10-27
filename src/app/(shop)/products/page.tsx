import { getProducts, getCategories, getBrands, getFabrics, getDistinctProductColors, getDistinctProductSizes } from "@/actions/products";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductFilters } from "@/components/shop/product-filters";
import { ProductFilters as Filters } from "@/types";
import { parseSearchParam } from "@/lib/filter-utils";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters: Filters = {
    category: parseSearchParam(params.category),
    brand: parseSearchParam(params.brand),
    fabric: parseSearchParam(params.fabric),
    color: parseSearchParam(params.color),
    size: parseSearchParam(params.size),
    priceRange: parseSearchParam(params.priceRange),
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStock: params.inStock === "true",
    sort: (params.sort as Filters["sort"]) || "newest",
    search: params.search,
    page: params.page ? Number(params.page) : 1,
  };

  const [result, categories, brands, fabrics, colors, sizes] = await Promise.all([
    getProducts(filters),
    getCategories(),
    getBrands(),
    getFabrics(),
    getDistinctProductColors(),
    getDistinctProductSizes(),
  ]);

  const categoryLabel = Array.isArray(filters.category)
    ? filters.category.join(", ")
    : filters.category?.replace(/-/g, " ");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl tracking-wider">
          {params.search ? `Search: "${params.search}"` : categoryLabel ? categoryLabel.toUpperCase() : "ALL PRODUCTS"}
        </h1>
        <p className="text-muted-foreground mt-2">{result.total} products found</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <ProductFilters
            categories={categories}
            brands={brands}
            fabrics={fabrics}
            colors={colors}
            sizes={sizes}
            currentFilters={filters}
          />
        </aside>
        <div className="flex-1">
          <ProductGrid products={result.products} total={result.total} currentPage={filters.page || 1} />
        </div>
      </div>
    </div>
  );
}
