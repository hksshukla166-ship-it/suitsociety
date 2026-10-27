"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { ensureStorageBucket } from "@/lib/storage-setup";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createCategory(name: string, description?: string, imageUrl?: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("categories").insert({
    name,
    slug: slugify(name),
    description,
    image_url: imageUrl,
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { data };
}

export async function updateCategory(id: string, updates: Record<string, unknown>) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("categories").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function getAllCategories() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return data || [];
}

export async function createBrand(name: string, description?: string, logoUrl?: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("brands").insert({
    name,
    slug: slugify(name),
    description,
    logo_url: logoUrl,
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath("/admin/brands");
  return { data };
}

export async function getAllBrands() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return data || [];
}

export async function createFabric(name: string, description?: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("fabrics").insert({
    name,
    slug: slugify(name),
    description,
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath("/admin/fabrics");
  return { data };
}

export async function getAllFabrics() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("fabrics").select("*").order("name");
  return data || [];
}

export async function createCoupon(data: {
  title: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value?: number;
  max_discount?: number;
  usage_limit?: number;
  starts_at?: string;
  ends_at?: string;
  product_ids?: string[];
  category_ids?: string[];
}) {
  const supabase = await createServiceClient();
  const { data: coupon, error } = await supabase.from("coupons").insert({
    ...data,
    code: data.code.toUpperCase(),
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath("/admin/coupons");
  return { data: coupon };
}

export async function getAllCoupons() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function createFlashSale(data: {
  title: string;
  banner_url?: string;
  discount_percentage: number;
  product_ids: string[];
  starts_at: string;
  ends_at: string;
}) {
  const supabase = await createServiceClient();
  const { data: sale, error } = await supabase.from("flash_sales").insert(data).select().single();
  if (error) return { error: error.message };
  revalidatePath("/admin/flash-sales");
  return { data: sale };
}

export async function getAllFlashSales() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("flash_sales").select("*").order("starts_at", { ascending: false });
  return data || [];
}

export async function createProductDiscount(data: {
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  product_ids?: string[];
  category_ids?: string[];
  starts_at?: string;
  ends_at?: string;
}) {
  const supabase = await createServiceClient();
  const { data: discount, error } = await supabase.from("product_discounts").insert(data).select().single();
  if (error) return { error: error.message };
  revalidatePath("/admin/discounts");
  return { data: discount };
}

export async function getDashboardStats() {
  const supabase = await createServiceClient();
  const [orders, products, customers, revenue] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact" }),
    supabase.from("products").select("id", { count: "exact" }).eq("is_active", true),
    supabase.from("users").select("id", { count: "exact" }),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
  ]);

  const revenueRows = Array.isArray(revenue.data) ? revenue.data : [];
  const totalRevenue = revenueRows.reduce(
    (sum: number, o) => sum + Number(o.total),
    0
  );
  const lowStock = await supabase.from("products").select("id", { count: "exact" }).lt("stock", 5).gt("stock", 0);
  const outOfStock = await supabase.from("products").select("id", { count: "exact" }).eq("stock", 0);

  return {
    totalOrders: orders.count || 0,
    totalProducts: products.count || 0,
    totalCustomers: customers.count || 0,
    totalRevenue,
    lowStock: lowStock.count || 0,
    outOfStock: outOfStock.count || 0,
  };
}

export async function adjustInventory(productId: string, quantity: number, type: "stock_in" | "stock_out", notes?: string) {
  const supabase = await createServiceClient();
  const { data: productRow } = await supabase.from("products").select("stock").eq("id", productId).single();
  if (!productRow || Array.isArray(productRow)) return { error: "Product not found" };

  const previousStock = Number((productRow as { stock: unknown }).stock);
  const newStock = type === "stock_in" ? previousStock + quantity : Math.max(0, previousStock - quantity);

  await supabase.from("products").update({ stock: newStock }).eq("id", productId);
  await supabase.from("inventory").insert({
    product_id: productId,
    type,
    quantity,
    previous_stock: previousStock,
    new_stock: newStock,
    notes,
  });

  revalidatePath("/admin/inventory");
  return { success: true, newStock };
}

export async function getInventoryHistory(productId?: string) {
  const supabase = await createServiceClient();
  let query = supabase
    .from("inventory")
    .select("*, product:products(name, barcode)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (productId) query = query.eq("product_id", productId);
  const { data } = await query;
  return data || [];
}

export async function subscribeNewsletter(email: string) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").upsert({ email }, { onConflict: "email" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadImage(file: File, bucket: string, path: string) {
  const supabase = createServiceClient();
  try {
    await ensureStorageBucket(bucket);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage bucket setup failed";
    return { error: message };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return { error: error.message };
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}
