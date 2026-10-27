"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { SORT_OPTIONS, COLORS, SIZES } from "@/lib/constants";
import type { Product, Category, Brand, Fabric } from "@/types";

interface ShopPageProps {
  products: Product[];
  totalCount: number;
  categories: Category[];
  brands: Brand[];
  fabrics: Fabric[];
  currentFilters: Record<string, string | undefined>;
}

export function ShopPage({
  products,
  totalCount,
  categories,
  brands,
  fabrics,
  currentFilters,
}: ShopPageProps) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Shop</h1>
          <p className="text-gray-500 mt-1">{totalCount} products</p>
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 border border-black/10 rounded-lg"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex gap-8">
        <aside className={`${filterOpen ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto" : "hidden"} lg:block lg:w-64 lg:flex-shrink-0 lg:static`}>
          {filterOpen && (
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h2 className="font-serif text-xl">Filters</h2>
              <button onClick={() => setFilterOpen(false)}><X className="w-6 h-6" /></button>
            </div>
          )}

          <FilterSection title="Sort By">
            <select
              value={currentFilters.sort || "newest"}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FilterSection>

          {categories.length > 0 && (
            <FilterSection title="Category">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={currentFilters.category === cat.slug}
                    onChange={() => updateFilter("category", cat.slug)}
                  />
                  {cat.name}
                </label>
              ))}
              {currentFilters.category && (
                <button onClick={() => updateFilter("category", null)} className="text-xs text-gold mt-1">Clear</button>
              )}
            </FilterSection>
          )}

          {brands.length > 0 && (
            <FilterSection title="Brand">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={currentFilters.brand === brand.slug}
                    onChange={() => updateFilter("brand", brand.slug)}
                  />
                  {brand.name}
                </label>
              ))}
            </FilterSection>
          )}

          {fabrics.length > 0 && (
            <FilterSection title="Fabric">
              {fabrics.map((fabric) => (
                <label key={fabric.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="fabric"
                    checked={currentFilters.fabric === fabric.slug}
                    onChange={() => updateFilter("fabric", fabric.slug)}
                  />
                  {fabric.name}
                </label>
              ))}
            </FilterSection>
          )}

          <FilterSection title="Colour">
            {COLORS.map((color) => (
              <label key={color} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  checked={currentFilters.color === color}
                  onChange={() => updateFilter("color", color)}
                />
                {color}
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Size">
            {SIZES.map((size) => (
              <label key={size} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="size"
                  checked={currentFilters.size === size}
                  onChange={() => updateFilter("size", size)}
                />
                {size}
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Availability">
            <label className="flex items-center gap-2 py-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={currentFilters.inStock === "true"}
                onChange={(e) => updateFilter("inStock", e.target.checked ? "true" : null)}
              />
              In Stock Only
            </label>
          </FilterSection>
        </aside>

        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 pb-6 border-b border-black/5">
      <h3 className="text-sm font-medium tracking-wider uppercase mb-3">{title}</h3>
      {children}
    </div>
  );
}
