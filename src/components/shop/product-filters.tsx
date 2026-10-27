"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category, Brand, Fabric, ProductFilters } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildFilterParams, toFilterArray, toggleFilterValue } from "@/lib/filter-utils";
import { PRICE_RANGES } from "@/lib/product-utils";
import { cn } from "@/lib/utils";

const FILTER_SECTIONS_KEY = "suit-society-filter-sections";

interface Props {
  categories: Category[];
  brands: Brand[];
  fabrics: Fabric[];
  colors: string[];
  sizes: string[];
  currentFilters: ProductFilters;
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "discount", label: "Discount" },
  { value: "best_selling", label: "Best Selling" },
];

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-muted transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-border text-gold focus:ring-gold"
      />
      <span className={cn("text-sm", checked && "text-gold font-medium")}>{label}</span>
    </label>
  );
}

export function ProductFilters({ categories, brands, fabrics, colors, sizes, currentFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["sort", "color", "fabric"]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(FILTER_SECTIONS_KEY);
      if (saved) setExpandedSections(JSON.parse(saved));
    } catch {}
  }, []);

  const selectedCategories = useMemo(() => toFilterArray(currentFilters.category), [currentFilters.category]);
  const selectedBrands = useMemo(() => toFilterArray(currentFilters.brand), [currentFilters.brand]);
  const selectedFabrics = useMemo(() => toFilterArray(currentFilters.fabric), [currentFilters.fabric]);
  const selectedColors = useMemo(() => toFilterArray(currentFilters.color), [currentFilters.color]);
  const selectedSizes = useMemo(() => toFilterArray(currentFilters.size), [currentFilters.size]);
  const selectedPriceRanges = useMemo(() => toFilterArray(currentFilters.priceRange), [currentFilters.priceRange]);

  const activeFilterCount = useMemo(() => {
    return (
      selectedCategories.length +
      selectedBrands.length +
      selectedFabrics.length +
      selectedColors.length +
      selectedSizes.length +
      selectedPriceRanges.length +
      (currentFilters.inStock ? 1 : 0) +
      (currentFilters.minPrice ? 1 : 0) +
      (currentFilters.maxPrice ? 1 : 0)
    );
  }, [
    selectedCategories,
    selectedBrands,
    selectedFabrics,
    selectedColors,
    selectedSizes,
    selectedPriceRanges,
    currentFilters.inStock,
    currentFilters.minPrice,
    currentFilters.maxPrice,
  ]);

  const pushFilters = (key: string, values: string[]) => {
    const params = buildFilterParams(searchParams, key, values);
    router.push(`/products?${params.toString()}`);
  };

  const toggleMultiFilter = (key: string, value: string, current: string[]) => {
    pushFilters(key, toggleFilterValue(current, value));
  };

  const updateSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  const updatePriceInputs = (min?: string, max?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");
    router.push(`/products?${params.toString()}`);
  };

  const toggleInStock = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (currentFilters.inStock) params.delete("inStock");
    else params.set("inStock", "true");
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => router.push("/products");

  const handleAccordionChange = (value: string[]) => {
    setExpandedSections(value);
    try {
      sessionStorage.setItem(FILTER_SECTIONS_KEY, JSON.stringify(value));
    } catch {}
  };

  const filterContent = (
    <Accordion
      type="multiple"
      value={expandedSections}
      onValueChange={handleAccordionChange}
      className="w-full"
    >
      <AccordionItem value="sort">
        <AccordionTrigger>Sort By</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSort(opt.value)}
                className={cn(
                  "block w-full text-left text-sm py-1.5 px-2 rounded transition-colors",
                  (currentFilters.sort || "newest") === opt.value ? "bg-gold/10 text-gold font-medium" : "hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      {colors.length > 0 && (
        <AccordionItem value="color">
          <AccordionTrigger>Color</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-48 overflow-y-auto">
              {colors.map((color) => (
                <FilterCheckbox
                  key={color}
                  label={color}
                  checked={selectedColors.includes(color)}
                  onChange={() => toggleMultiFilter("color", color, selectedColors)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {fabrics.length > 0 && (
        <AccordionItem value="fabric">
          <AccordionTrigger>Fabric</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-48 overflow-y-auto">
              {fabrics.map((fabric) => (
                <FilterCheckbox
                  key={fabric.id}
                  label={fabric.name}
                  checked={selectedFabrics.includes(fabric.slug)}
                  onChange={() => toggleMultiFilter("fabric", fabric.slug, selectedFabrics)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {sizes.length > 0 && (
        <AccordionItem value="size">
          <AccordionTrigger>Size</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-1">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleMultiFilter("size", size, selectedSizes)}
                  className={cn(
                    "min-w-[2.5rem] px-2 py-1.5 text-xs border rounded transition-colors",
                    selectedSizes.includes(size) ? "border-gold bg-gold/10 text-gold font-medium" : "hover:border-gold/50"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {categories.length > 0 && (
        <AccordionItem value="category">
          <AccordionTrigger>Category</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <FilterCheckbox
                  key={cat.id}
                  label={cat.name}
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => toggleMultiFilter("category", cat.slug, selectedCategories)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {brands.length > 0 && (
        <AccordionItem value="brand">
          <AccordionTrigger>Brand</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <FilterCheckbox
                  key={brand.id}
                  label={brand.name}
                  checked={selectedBrands.includes(brand.slug)}
                  onChange={() => toggleMultiFilter("brand", brand.slug, selectedBrands)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="price">
        <AccordionTrigger>Price</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {PRICE_RANGES.map((range) => (
            <FilterCheckbox
              key={range.value}
              label={range.label}
              checked={selectedPriceRanges.includes(range.value)}
              onChange={() => toggleMultiFilter("priceRange", range.value, selectedPriceRanges)}
            />
          ))}
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Input
              type="number"
              placeholder="Min"
              defaultValue={currentFilters.minPrice}
              onBlur={(e) => updatePriceInputs(e.target.value, currentFilters.maxPrice?.toString())}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              defaultValue={currentFilters.maxPrice}
              onBlur={(e) => updatePriceInputs(currentFilters.minPrice?.toString(), e.target.value)}
              className="text-sm"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="availability">
        <AccordionTrigger>Availability</AccordionTrigger>
        <AccordionContent>
          <FilterCheckbox
            label="In Stock Only"
            checked={Boolean(currentFilters.inStock)}
            onChange={toggleInStock}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden flex items-center gap-2 mb-4 text-sm px-4 py-2.5 border rounded-lg w-full justify-center hover:border-gold/50 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters & Sort
        {activeFilterCount > 0 && (
          <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gold text-charcoal text-xs font-medium flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div
        className={cn(
          "space-y-4 overflow-hidden transition-all duration-300 ease-in-out lg:!max-h-none lg:!opacity-100 lg:!block",
          open ? "max-h-[2000px] opacity-100 mb-4" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100",
          "lg:block",
          !open && "hidden lg:block"
        )}
      >
        {open && (
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-border/50">
            <h2 className="font-serif text-lg tracking-wider">Filters</h2>
            <button onClick={() => setOpen(false)} aria-label="Close filters" className="p-1 hover:text-gold transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {filterContent}

        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-1" /> Clear Filters
        </Button>
      </div>
    </>
  );
}
