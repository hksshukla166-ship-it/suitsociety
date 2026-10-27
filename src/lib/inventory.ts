import type { Product } from "@/types";

export type SizeStockMap = Record<string, number>;

export function parseSizeStock(value: unknown): SizeStockMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: SizeStockMap = {};
  for (const [size, qty] of Object.entries(value as Record<string, unknown>)) {
    const parsed = Number(qty);
    if (size && Number.isFinite(parsed) && parsed >= 0) {
      result[size] = Math.floor(parsed);
    }
  }
  return result;
}

export function getTotalStock(sizeStock: SizeStockMap, fallback = 0): number {
  const values = Object.values(sizeStock);
  if (values.length === 0) return fallback;
  return values.reduce((sum, qty) => sum + qty, 0);
}

export function getSizeStock(
  product: Pick<Product, "size_stock" | "stock" | "sizes">,
  size?: string
): number {
  const sizeStock = parseSizeStock(product.size_stock);
  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const hasSizeStockData = Object.keys(sizeStock).length > 0;

  if (size) {
    if (size in sizeStock) return sizeStock[size];
    // Size-specific products must not fall back to legacy product.stock
    if (hasSizeStockData || hasSizes) return 0;
  }

  if (hasSizeStockData) return getTotalStock(sizeStock);
  return product.stock ?? 0;
}

export function isSizeInStock(
  product: Pick<Product, "size_stock" | "stock" | "sizes">,
  size?: string
): boolean {
  if (!size) {
    const sizeStock = parseSizeStock(product.size_stock);
    if (Object.keys(sizeStock).length > 0) {
      return getTotalStock(sizeStock) > 0;
    }
    if ((product.sizes?.length ?? 0) > 0) {
      return product.sizes.some((s) => getSizeStock(product, s) > 0);
    }
    return (product.stock ?? 0) > 0;
  }
  return getSizeStock(product, size) > 0;
}

export function buildSizeStockFromForm(
  sizes: string[],
  raw: SizeStockMap,
  legacyStock?: number
): SizeStockMap {
  const result: SizeStockMap = {};
  for (const size of sizes) {
    result[size] = raw[size] ?? 0;
  }
  if (sizes.length === 0 && legacyStock != null) {
    return {};
  }
  return result;
}

export function syncProductTotalStock(sizeStock: SizeStockMap, legacyStock = 0): number {
  const total = getTotalStock(sizeStock);
  return total > 0 || Object.keys(sizeStock).length > 0 ? total : legacyStock;
}
