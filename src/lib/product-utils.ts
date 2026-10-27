const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "7XL"];

const DESCRIPTION_LABELS = [
  "Package Contents",
  "Set Includes",
  "Blouse Piece",
  "Fabric",
  "Material",
  "Work",
  "Embroidery",
  "Neck",
  "Sleeve",
  "Length",
  "Fit",
  "Pattern",
  "Style",
  "Occasion",
  "Care",
  "Color",
  "Weave",
  "Border",
  "Dupatta",
  "Blouse",
  "Wash",
  "Design",
  "Lining",
  "Closure",
  "Pallu",
  "Bottom",
  "Top",
];

export const FILTER_COLORS = [
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
  "Orange",
  "Peach",
  "Wine",
  "Teal",
  "Mustard",
  "Lavender",
  "Rust",
  "Off White",
] as const;

export const PRICE_RANGES = [
  { value: "0-999", label: "Under ₹999", min: 0, max: 999 },
  { value: "1000-1999", label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { value: "2000-2999", label: "₹2,000 – ₹2,999", min: 2000, max: 2999 },
  { value: "3000-4999", label: "₹3,000 – ₹4,999", min: 3000, max: 4999 },
  { value: "5000+", label: "₹5,000+", min: 5000, max: null },
] as const;

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const aBase = a.split(/[\s(]/)[0].toUpperCase();
    const bBase = b.split(/[\s(]/)[0].toUpperCase();
    const aIdx = SIZE_ORDER.indexOf(aBase);
    const bIdx = SIZE_ORDER.indexOf(bBase);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export function formatProductDescription(description: string): string {
  if (!description) return "";

  let formatted = description.replace(/\r\n/g, "\n").trim();

  if (!formatted.includes("\n")) {
    const labels = [...DESCRIPTION_LABELS].sort((a, b) => b.length - a.length);
    for (const label of labels) {
      formatted = formatted.replace(
        new RegExp(`\\s+(${label})\\s+`, "gi"),
        (_, matched: string) => `\n\n${matched}\n`
      );
    }
  }

  return formatted
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function parseFilterList(value?: string | string[]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export function mergeUniqueColors(catalogColors: readonly string[], dbColors: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const color of [...catalogColors, ...dbColors]) {
    const key = color.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(color);
    }
  }

  return result;
}
