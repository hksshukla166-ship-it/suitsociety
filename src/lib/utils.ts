import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SS${timestamp}${random}`;
}

export function calculateDiscountPercentage(original: number, discounted: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

export function isDateInRange(start: string | null, end: string | null): boolean {
  const now = new Date();
  if (start && new Date(start) > now) return false;
  if (end && new Date(end) < now) return false;
  return true;
}

export function getEffectivePrice(
  price: number,
  productDiscounts: { discount_type: string; discount_value: number }[],
  flashSaleDiscount?: number
): { price: number; discountPercentage: number } {
  let effectivePrice = price;
  let totalDiscount = 0;

  for (const discount of productDiscounts) {
    if (discount.discount_type === "percentage") {
      totalDiscount += discount.discount_value;
    } else {
      effectivePrice -= discount.discount_value;
    }
  }

  if (flashSaleDiscount) {
    totalDiscount += flashSaleDiscount;
  }

  if (totalDiscount > 0) {
    effectivePrice = price * (1 - Math.min(totalDiscount, 90) / 100);
  }

  effectivePrice = Math.max(0, Math.round(effectivePrice));

  return {
    price: effectivePrice,
    discountPercentage: calculateDiscountPercentage(price, effectivePrice),
  };
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export const SITE_CONFIG = {
  name: "Suit Society",
  instagram: "https://www.instagram.com/suitsociety_official/",
  email: "suitsocietyofficial@gmail.com",
  phone: "07974100362",
  phones: ["07974100362", "8120650803"],
  whatsapp: "917974100362",
  address: "Kewdabadi Bus Stand Road, Near SBI Bank Chowk, Raigarh, Chhattisgarh - 496001",
  defaultAdmin: {
    username: "SUiTsOcIety",
    password: "SuitXSociety@123897254",
  },
};
