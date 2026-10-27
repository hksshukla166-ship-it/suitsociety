import type { Product, ProductDiscount, FlashSale, Coupon } from "@/types";
import { createServiceClient } from "@/lib/supabase/admin";

export function isDateActive(start?: string | null, end?: string | null): boolean {
  const now = new Date();
  if (start && new Date(start) > now) return false;
  if (end && new Date(end) < now) return false;
  return true;
}

export function applyDiscount(
  price: number,
  type: "percentage" | "fixed",
  value: number
): number {
  if (type === "percentage") return Math.max(0, price - (price * value) / 100);
  return Math.max(0, price - value);
}

export function getProductPricing(
  product: Product,
  discounts: ProductDiscount[] = [],
  flashSales: FlashSale[] = []
): { original: number; effective: number; discountPercent: number; badge?: string } {
  let effectivePrice = product.price;
  const original = product.compare_at_price ?? product.price;
  let badge: string | undefined;

  for (const d of discounts) {
    if (!d.is_active || !isDateActive(d.starts_at, d.ends_at)) continue;
    const applies =
      d.product_ids?.includes(product.id) ||
      (product.category_id && d.category_ids?.includes(product.category_id)) ||
      d.apply_to_new_products;
    if (applies) {
      effectivePrice = applyDiscount(effectivePrice, d.discount_type, d.discount_value);
      badge = d.name;
    }
  }

  for (const fs of flashSales) {
    if (!fs.is_active || !isDateActive(fs.starts_at, fs.ends_at)) continue;
    if (fs.product_ids?.includes(product.id)) {
      effectivePrice = applyDiscount(effectivePrice, "percentage", fs.discount_percentage);
      badge = "Flash Sale";
    }
  }

  const discountPercent =
    original > effectivePrice ? Math.round(((original - effectivePrice) / original) * 100) : 0;
  return { original, effective: effectivePrice, discountPercent, badge };
}

export function validateCoupon(
  coupon: Coupon,
  subtotal: number,
  userId: string,
  productIds: string[],
  categoryIds: string[]
): { valid: boolean; discount: number; error?: string } {
  if (!coupon.is_active) return { valid: false, discount: 0, error: "Coupon inactive" };
  if (!isDateActive(coupon.starts_at, coupon.ends_at))
    return { valid: false, discount: 0, error: "Coupon expired" };
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit)
    return { valid: false, discount: 0, error: "Coupon limit reached" };
  if (subtotal < coupon.min_order_value)
    return { valid: false, discount: 0, error: `Minimum order ₹${coupon.min_order_value}` };

  if (coupon.customer_ids?.length && !coupon.customer_ids.includes(userId)) {
    return { valid: false, discount: 0, error: "Coupon not applicable" };
  }
  if (coupon.product_ids?.length && !productIds.some((id) => coupon.product_ids.includes(id))) {
    return { valid: false, discount: 0, error: "Coupon not applicable to cart items" };
  }
  if (coupon.category_ids?.length && !categoryIds.some((id) => coupon.category_ids.includes(id))) {
    return { valid: false, discount: 0, error: "Coupon not applicable to cart items" };
  }

  let discount =
    coupon.discount_type === "percentage"
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value;

  if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  discount = Math.min(discount, subtotal);

  return { valid: true, discount };
}

export async function getActiveFlashSales(): Promise<FlashSale[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("flash_sales").select("*").eq("is_active", true);
  return (data || []).filter((fs) => isDateActive(fs.starts_at, fs.ends_at)) as FlashSale[];
}

export async function getActiveCouponsForHomepage(): Promise<Coupon[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("coupons").select("*").eq("is_active", true);
  return (data || []).filter((c) => isDateActive(c.starts_at, c.ends_at)).slice(0, 6) as Coupon[];
}

export async function enrichProductsWithPricing(products: Product[]): Promise<Product[]> {
  if (!products.length) return [];

  const supabase = createServiceClient();
  const [{ data: discounts }, flashSales] = await Promise.all([
    supabase.from("product_discounts").select("*").eq("is_active", true),
    getActiveFlashSales(),
  ]);

  return products.map((product) => {
    const pricing = getProductPricing(product, (discounts || []) as ProductDiscount[], flashSales);
    return {
      ...product,
      effective_price: pricing.effective,
      discount_percentage: pricing.discountPercent,
      flash_sale: pricing.badge === "Flash Sale",
    };
  });
}
