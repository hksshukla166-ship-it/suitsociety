import { slugify } from "@/lib/utils";

/** Full category list from Suit Society spreadsheet dropdown */
export const CATALOG_CATEGORIES = [
  "Readymade 3-pc Suits",
  "Korean Shirts/ Midis",
  "Wedding/Festive collection",
  "Co-Ord Sets",
  "Winter Wear",
  "Night Suits",
] as const;

/** Fabric types from the Suit Society product spreadsheet (16 fabrics) */
export const CATALOG_FABRICS = [
  "Cotton",
  "Imported Fabric",
  "Silk",
  "Mul Cotton",
  "Dola Silk",
  "Georgette",
  "Chiffon",
  "Linen",
  "Velvet",
  "Organza",
  "Crepe",
  "Rayon",
  "Net",
  "Jacquard",
  "Satin",
  "Khadi",
] as const;

/** Colors used in the Suit Society product spreadsheet */
export const CATALOG_COLORS = [
  "Black",
  "White",
  "Blue",
  "Red",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Grey",
  "Brown",
  "Cream",
  "Beige",
  "Maroon",
  "Navy",
  "Multi Color",
  "Golden",
  "Ivory",
  "Lavender",
  "Rust",
  "Off White",
] as const;

/** Full size range S through 7XL */
export const CATALOG_SIZES = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
] as const;

export type ExcelProductRow = {
  productCode: string;
  name: string;
  mrp: number;
  discountPercent: number;
  costPrice: number;
  category: string;
  color: string;
  fabric: string;
  size: string;
  description: string;
};

function cell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function numberCell(row: Record<string, unknown>, ...keys: string[]): number {
  const raw = cell(row, ...keys);
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseExcelProductRow(row: Record<string, unknown>): ExcelProductRow | null {
  const name = cell(row, "Product Name", "name", "Name", "PRODUCT");
  if (!name) return null;

  const discountRaw = numberCell(row, "Discount Percent", "discount_percent", "Discount");
  const discountPercent = discountRaw > 1 ? discountRaw / 100 : discountRaw;

  return {
    productCode: cell(row, "Product Code", "product_code", "SKU", "sku"),
    name,
    mrp: numberCell(row, "MRP", "mrp", "compare_at_price"),
    discountPercent,
    costPrice: numberCell(row, "Cost Price", "cost_price", "cost"),
    category: cell(row, "Category", "category"),
    color: cell(row, "Color", "color", "colors"),
    fabric: cell(row, "Fabric", "fabric"),
    size: cell(row, "Size", "size", "sizes"),
    description: cell(row, "Description", "description"),
  };
}

export function parseSizeList(sizeText: string): string[] {
  if (!sizeText) return [];
  return sizeText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseColorList(colorText: string): string[] {
  if (!colorText) return [];
  return colorText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** @param discountPercent 0–100 (percentage) or 0–1 (fraction from Excel import) */
export function calculateSellingPrice(mrp: number, discountPercent: number): number {
  if (!mrp) return 0;
  const pct = discountPercent <= 1 ? discountPercent * 100 : discountPercent;
  const clamped = Math.min(Math.max(pct, 0), 100);
  return Math.round(mrp * (1 - clamped / 100) * 100) / 100;
}

export function capitalizeFabricName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function uniqueSlug(base: string, suffix: string): string {
  return `${slugify(base)}-${slugify(suffix || "item")}`;
}

export const EXCEL_COLUMN_GUIDE = [
  "Product Code",
  "Product Name",
  "MRP",
  "Discount Percent",
  "Cost Price",
  "Category",
  "Color",
  "Fabric",
  "Size",
  "Description",
] as const;
