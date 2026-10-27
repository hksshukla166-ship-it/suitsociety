/** Pure barcode helpers (safe for client + server). */

export function normalizeBarcodeFromCode(productCode: string): string {
  return productCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
}

export function barcodeFromProductCode(productCode?: string | null): string | null {
  if (!productCode?.trim()) return null;
  const normalized = normalizeBarcodeFromCode(productCode);
  return normalized || null;
}

export function generateFallbackBarcode(): string {
  const seq = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SS${seq}${rand}`;
}
