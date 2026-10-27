import { CATALOG_SIZES } from "@/lib/product-catalog";
import { getSetting, saveSetting } from "@/lib/settings";
import { sortSizes } from "@/lib/product-utils";

const SETTINGS_KEY = "catalog_sizes";

export async function getManagedCatalogSizes(): Promise<string[]> {
  const stored = await getSetting<{ sizes?: string[] }>(SETTINGS_KEY);
  if (stored?.sizes?.length) {
    return sortSizes(stored.sizes);
  }
  return sortSizes([...CATALOG_SIZES]);
}

export async function saveManagedCatalogSizes(sizes: string[]): Promise<boolean> {
  const cleaned = sortSizes(
    sizes.map((size) => size.trim()).filter(Boolean)
  );
  return saveSetting(SETTINGS_KEY, { sizes: cleaned });
}

export function getDefaultCatalogSizes(): string[] {
  return sortSizes([...CATALOG_SIZES]);
}
