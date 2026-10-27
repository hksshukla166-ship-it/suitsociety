import { CATALOG_COLORS } from "@/lib/product-catalog";
import { getSetting, saveSetting } from "@/lib/settings";
import { mergeUniqueColors } from "@/lib/product-utils";

const SETTINGS_KEY = "catalog_colors";

export async function getManagedCatalogColors(): Promise<string[]> {
  const stored = await getSetting<{ colors?: string[] }>(SETTINGS_KEY);
  if (stored?.colors?.length) {
    return mergeUniqueColors(CATALOG_COLORS, stored.colors);
  }
  return [...CATALOG_COLORS];
}

export async function saveManagedCatalogColors(colors: string[]): Promise<boolean> {
  const cleaned = mergeUniqueColors(
    [],
    colors.map((color) => color.trim()).filter(Boolean)
  );
  return saveSetting(SETTINGS_KEY, { colors: cleaned });
}

export function getDefaultCatalogColors(): string[] {
  return [...CATALOG_COLORS];
}
