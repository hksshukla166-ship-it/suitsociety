export const BRAND = {
  name: "Suit Society",
  tagline: "Luxury Ethnic & Formal Wear",
  email: "suitsocietyofficial@gmail.com",
  phone: "07974100362",
  address: "Kewdabadi Bus Stand Road, Near SBI Bank Chowk, Raigarh, Chhattisgarh - 496001",
  city: "Raigarh",
  state: "Chhattisgarh",
  pincode: "496001",
} as const;

export const DEFAULT_ADMIN = {
  username: "SUiTsOcIety",
  password: "SuitXSociety@123897254",
} as const;

export const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
] as const;

export const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "discount", label: "Discount" },
  { value: "best_selling", label: "Best Selling" },
] as const;

export { CATALOG_SIZES as SIZES, CATALOG_COLORS as COLORS } from "@/lib/product-catalog";
