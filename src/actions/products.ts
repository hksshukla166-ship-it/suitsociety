"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Product, ProductFilters, Category, Brand, Fabric, FlashSale, Coupon, ProductDiscount } from "@/types";
import { slugify, getEffectivePrice, isDateInRange, calculateDiscountPercentage } from "@/lib/utils";
import { resolveProductBarcode } from "@/lib/barcode";
import { parseFilterList, PRICE_RANGES, mergeUniqueColors, FILTER_COLORS, sortSizes } from "@/lib/product-utils";
import { parseSizeStock, syncProductTotalStock, buildSizeStockFromForm } from "@/lib/inventory";
import { ensureStorageBucket } from "@/lib/storage-setup";
import { revalidatePath } from "next/cache";

function formatDbSchemaError(message: string): string {
  if (
    message.includes("cost_price") ||
    message.includes("discount_percent") ||
    message.includes("size_stock") ||
    (message.includes("schema cache") && message.includes("products"))
  ) {
    return "Database migration required: missing product columns (cost_price, discount_percent, size_stock). Re-run mysql/schema.sql or Admin database setup.";
  }
  return message;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").eq("is_active", true);
  return data || [];
}

export async function getFabrics(): Promise<Fabric[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("fabrics").select("*").eq("is_active", true).order("name");
  return data || [];
}

export async function getDistinctProductColors(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("colors").eq("is_active", true);
  const colorSet = new Set<string>();
  for (const row of data || []) {
    for (const color of row.colors || []) {
      if (color) colorSet.add(color);
    }
  }
  return mergeUniqueColors(FILTER_COLORS, Array.from(colorSet));
}

export async function getDistinctProductSizes(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("sizes").eq("is_active", true);
  const sizeSet = new Set<string>();
  for (const row of data || []) {
    for (const size of row.sizes || []) {
      if (size) sizeSet.add(size);
    }
  }
  return sortSizes(Array.from(sizeSet));
}

async function resolveSlugsToIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "categories" | "brands" | "fabrics",
  slugs: string[]
): Promise<string[]> {
  if (!slugs.length) return [];
  const { data } = await supabase.from(table).select("id, slug").in("slug", slugs);
  return (data || []).map((row) => row.id);
}

function buildArrayOrFilter(column: string, values: string[]): string {
  return values.map((value) => `${column}.cs.{${value}}`).join(",");
}

function buildPriceRangeOrFilter(ranges: string[]): string | null {
  const parts = ranges
    .map((value) => PRICE_RANGES.find((range) => range.value === value))
    .filter(Boolean)
    .map((range) => {
      if (range!.max === null) return `price.gte.${range!.min}`;
      return `and(price.gte.${range!.min},price.lte.${range!.max})`;
    });

  return parts.length ? parts.join(",") : null;
}

async function getActiveDiscounts(): Promise<ProductDiscount[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("product_discounts").select("*").eq("is_active", true);
  return (data || []).filter((d) => isDateInRange(d.starts_at, d.ends_at));
}

export async function getActiveFlashSales(): Promise<FlashSale[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("flash_sales")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now);
  return data || [];
}

function applyDiscountsToProduct(
  product: Product,
  discounts: ProductDiscount[],
  flashSales: FlashSale[]
): Product {
  const applicableDiscounts = discounts.filter(
    (d) =>
      d.product_ids.includes(product.id) ||
      (product.category_id && d.category_ids.includes(product.category_id))
  );

  const flashSale = flashSales.find((fs) => fs.product_ids.includes(product.id));
  const { price: effectivePrice } = getEffectivePrice(
    product.price,
    applicableDiscounts,
    flashSale?.discount_percentage
  );

  const mrp = product.compare_at_price && product.compare_at_price > effectivePrice
    ? product.compare_at_price
    : product.price;

  return {
    ...product,
    effective_price: effectivePrice,
    discount_percentage:
      mrp > effectivePrice ? calculateDiscountPercentage(mrp, effectivePrice) : 0,
  };
}

export async function getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number }> {
  const supabase = await createClient();
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select("*, images:product_images(*), category:categories(*), brand:brands(*), fabric:fabrics(*)", { count: "exact" })
    .eq("is_active", true);

  if (filters.category) {
    const slugs = parseFilterList(filters.category);
    const ids = await resolveSlugsToIds(supabase, "categories", slugs);
    if (ids.length === 1) query = query.eq("category_id", ids[0]);
    else if (ids.length > 1) query = query.in("category_id", ids);
  }
  if (filters.brand) {
    const slugs = parseFilterList(filters.brand);
    const ids = await resolveSlugsToIds(supabase, "brands", slugs);
    if (ids.length === 1) query = query.eq("brand_id", ids[0]);
    else if (ids.length > 1) query = query.in("brand_id", ids);
  }
  if (filters.fabric) {
    const slugs = parseFilterList(filters.fabric);
    const ids = await resolveSlugsToIds(supabase, "fabrics", slugs);
    if (ids.length === 1) query = query.eq("fabric_id", ids[0]);
    else if (ids.length > 1) query = query.in("fabric_id", ids);
  }

  const colors = parseFilterList(filters.color);
  if (colors.length === 1) query = query.contains("colors", [colors[0]]);
  else if (colors.length > 1) query = query.or(buildArrayOrFilter("colors", colors));

  const sizes = parseFilterList(filters.size);
  if (sizes.length === 1) query = query.contains("sizes", [sizes[0]]);
  else if (sizes.length > 1) query = query.or(buildArrayOrFilter("sizes", sizes));

  const priceRanges = parseFilterList(filters.priceRange);
  const priceRangeFilter = buildPriceRangeOrFilter(priceRanges);
  if (priceRangeFilter) query = query.or(priceRangeFilter);

  if (filters.minPrice) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.inStock) query = query.gt("stock", 0);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  switch (filters.sort) {
    case "price_low": query = query.order("price", { ascending: true }); break;
    case "price_high": query = query.order("price", { ascending: false }); break;
    case "popular": query = query.order("views", { ascending: false }); break;
    case "best_selling": query = query.order("sales_count", { ascending: false }); break;
    case "discount": query = query.order("compare_at_price", { ascending: false }); break;
    default: query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
      return { products: [], total: 0 };
    }
    throw error;
  }
  const discounts = await getActiveDiscounts();
  const flashSales = await getActiveFlashSales();

  const products = (data || []).map((p) => applyDiscountsToProduct(p as Product, discounts, flashSales));
  return { products, total: count || 0 };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, images:product_images(*), videos:product_videos(*), category:categories(*), brand:brands(*), fabric:fabrics(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return null;

  const discounts = await getActiveDiscounts();
  const flashSales = await getActiveFlashSales();
  const product = applyDiscountsToProduct(data as Product, discounts, flashSales);
  return { ...product, sizes: sortSizes(product.sizes || []) };
}

export async function getFeaturedProducts(type: "featured" | "new_arrival" | "trending" | "best_seller", limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const field = type === "featured" ? "is_featured" : type === "new_arrival" ? "is_new_arrival" : type === "trending" ? "is_trending" : "is_best_seller";

  const { data } = await supabase
    .from("products")
    .select("*, images:product_images(*), brand:brands(*)")
    .eq("is_active", true)
    .eq(field, true)
    .limit(limit);

  const discounts = await getActiveDiscounts();
  const flashSales = await getActiveFlashSales();
  return (data || []).map((p) => applyDiscountsToProduct(p as Product, discounts, flashSales));
}

export async function getHomepageData() {
  const supabase = await createClient();

  try {
    const [heroes, banners, videos, happyCustomers, categories, flashSales, coupons, reviews] = await Promise.all([
      supabase.from("homepage_heroes").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("homepage_videos").select("*, product:products(id, name, slug)").eq("is_active", true).order("sort_order"),
      supabase.from("happy_customers").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("flash_sales").select("*").eq("is_active", true),
      supabase.from("coupons").select("*").eq("is_active", true),
      supabase.from("reviews").select("*, user:users(full_name), product:products(name, slug)").eq("is_approved", true).order("created_at", { ascending: false }).limit(6),
    ]);

    const now = new Date().toISOString();
    const activeFlashSales = (flashSales.data || []).filter(
      (fs) => fs.starts_at <= now && fs.ends_at >= now
    );
    const activeCoupons = (coupons.data || []).filter((c) => isDateInRange(c.starts_at, c.ends_at));

    return {
      heroes: heroes.data || [],
      banners: banners.data || [],
      videos: videos.data || [],
      happyCustomers: happyCustomers.data || [],
      categories: categories.data || [],
      flashSales: activeFlashSales,
      coupons: activeCoupons,
      reviews: reviews.data || [],
    };
  } catch {
    return {
      heroes: [],
      banners: [],
      videos: [],
      happyCustomers: [],
      categories: [],
      flashSales: [],
      coupons: [],
      reviews: [],
    };
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (!query || query.length < 2) return [];
  const { products } = await getProducts({ search: query, limit: 10 });
  return products;
}

async function saveProductImage(productId: string, file: File, options?: { isPrimary?: boolean; sortOrder?: number }) {
  const supabase = createServiceClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${productId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await ensureStorageBucket("products");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage bucket setup failed";
    return { error: message };
  }

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    const message = /bucket not found/i.test(uploadError.message)
      ? 'Media storage is not ready. Re-run Admin → Settings → Database setup.'
      : uploadError.message;
    return { error: message };
  }

  const { data: urlData } = supabase.storage.from("products").getPublicUrl(path);

  const isPrimary = options?.isPrimary ?? false;
  if (isPrimary) {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  }

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    url: urlData.publicUrl,
    alt_text: file.name,
    sort_order: options?.sortOrder ?? 0,
    is_primary: isPrimary,
  });

  if (error) return { error: formatDbSchemaError(error.message) };
  return { success: true };
}

async function syncProductImages(
  productId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServiceClient();
  const rawMeta = formData.get("existing_images");
  const primaryId = (formData.get("primary_image_id") as string) || "";

  if (rawMeta) {
    let existing: { id: string; sort_order: number }[] = [];
    try {
      existing = JSON.parse(rawMeta as string);
    } catch {
      return { error: "Invalid image metadata" };
    }

    const { data: currentImages } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId);

    const keepIds = new Set(existing.map((img) => img.id));
    const toDelete = (currentImages || []).filter((img) => !keepIds.has(img.id));

    for (const img of toDelete) {
      await supabase.from("product_images").delete().eq("id", img.id);
    }

    for (const img of existing) {
      await supabase
        .from("product_images")
        .update({
          sort_order: img.sort_order,
          is_primary: img.id === primaryId,
        })
        .eq("id", img.id);
    }
  }

  const imageFiles = formData.getAll("images") as File[];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    if (!file || file.size === 0) continue;
    const result = await saveProductImage(productId, file, {
      sortOrder: 100 + i,
      isPrimary: !primaryId && i === 0 && !rawMeta,
    });
    if (result.error) return result;
  }

  if (primaryId) {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", primaryId);
  }

  return { success: true };
}

function buildProductPayload(formData: FormData) {
  const mrp = parseFloat(formData.get("mrp") as string) || parseFloat(formData.get("compare_at_price") as string) || 0;
  const price =
    parseFloat(formData.get("price") as string) ||
    parseFloat(formData.get("selling_price") as string) ||
    mrp;
  const costPriceRaw = formData.get("cost_price") as string;
  const costPrice = costPriceRaw ? parseFloat(costPriceRaw) : null;
  const discountPercentRaw = formData.get("discount_percent") as string;
  const discountPercent = discountPercentRaw ? parseFloat(discountPercentRaw) : null;

  const sizes = JSON.parse((formData.get("sizes") as string) || "[]") as string[];
  let sizeStock = parseSizeStock(JSON.parse((formData.get("size_stock") as string) || "{}"));
  sizeStock = buildSizeStockFromForm(sizes, sizeStock);
  const legacyStock = parseInt(formData.get("stock") as string) || 0;
  const stock = syncProductTotalStock(sizeStock, legacyStock);

  return {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    sku: ((formData.get("product_code") as string) || (formData.get("sku") as string) || "").trim() || null,
    price,
    compare_at_price: mrp || null,
    cost_price: costPrice,
    discount_percent: discountPercent,
    category_id: (formData.get("category_id") as string) || null,
    brand_id: (formData.get("brand_id") as string) || null,
    fabric_id: (formData.get("fabric_id") as string) || null,
    colors: JSON.parse((formData.get("colors") as string) || "[]"),
    sizes,
    size_stock: sizeStock,
    stock,
    is_featured: formData.get("is_featured") === "true",
    is_new_arrival: formData.get("is_new_arrival") === "true",
    is_trending: formData.get("is_trending") === "true",
    is_best_seller: formData.get("is_best_seller") === "true",
    is_active: formData.get("is_active") !== "false",
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    specifications: {},
  };
}

type ProductVideoInput = { url: string; title?: string | null };

async function syncProductVideos(
  productId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const rawVideos = formData.get("videos");
  if (!rawVideos) return { success: true };

  let videos: ProductVideoInput[] = [];
  try {
    const parsed = JSON.parse(rawVideos as string);
    if (Array.isArray(parsed)) {
      videos = parsed
        .map((item) => ({
          url: String(item?.url || "").trim(),
          title: item?.title ? String(item.title) : null,
        }))
        .filter((item) => item.url);
    }
  } catch {
    return { error: "Invalid video data" };
  }

  if (!videos.length) return { success: true };

  const supabase = await createServiceClient();
  const { error: deleteError } = await supabase
    .from("product_videos")
    .delete()
    .eq("product_id", productId);

  if (deleteError) return { error: deleteError.message };

  const { error: insertError } = await supabase.from("product_videos").insert(
    videos.map((video, index) => ({
      product_id: productId,
      url: video.url,
      title: video.title || null,
      sort_order: index,
    }))
  );

  if (insertError) return { error: insertError.message };
  return { success: true };
}

export async function createProduct(formData: FormData) {
  const supabase = await createServiceClient();
  const payload = buildProductPayload(formData);

  if (payload.cost_price == null || Number.isNaN(payload.cost_price)) {
    return { error: "Cost price is required" };
  }

  const barcode = await resolveProductBarcode(supabase, payload.sku);

  const { data, error } = await supabase.from("products").insert({
    ...payload,
    barcode,
    slug: slugify(payload.name) + "-" + Date.now().toString(36),
  }).select().single();

  if (error) return { error: formatDbSchemaError(error.message) };

  const rollbackProduct = async () => {
    await supabase.from("product_images").delete().eq("product_id", data.id);
    await supabase.from("products").delete().eq("id", data.id);
  };

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const imageResult = await saveProductImage(data.id, imageFile, { isPrimary: true, sortOrder: 0 });
    if (imageResult.error) {
      await rollbackProduct();
      return { error: imageResult.error };
    }
  }

  const imagesResult = await syncProductImages(data.id, formData);
  if (imagesResult.error) {
    await rollbackProduct();
    return { error: imagesResult.error };
  }

  const videoResult = await syncProductVideos(data.id, formData);
  if (videoResult.error) {
    await rollbackProduct();
    return { error: videoResult.error };
  }

  if (payload.stock > 0) {
    await supabase.from("inventory").insert({
      product_id: data.id,
      type: "stock_in",
      quantity: payload.stock,
      previous_stock: 0,
      new_stock: payload.stock,
      notes: "Initial stock",
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { data: { ...data, barcode } };
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createServiceClient();
  const payload = buildProductPayload(formData);

  if (payload.cost_price == null || Number.isNaN(payload.cost_price)) {
    return { error: "Cost price is required" };
  }

  const barcode = await resolveProductBarcode(supabase, payload.sku, id);

  const { error } = await supabase.from("products").update({ ...payload, barcode }).eq("id", id);
  if (error) return { error: formatDbSchemaError(error.message) };

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const imageResult = await saveProductImage(id, imageFile, { isPrimary: true, sortOrder: 0 });
    if (imageResult.error) return { error: imageResult.error };
  }

  const imagesResult = await syncProductImages(id, formData);
  if (imagesResult.error) return { error: imagesResult.error };

  const videoResult = await syncProductVideos(id, formData);
  if (videoResult.error) return { error: videoResult.error };

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/products");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: formatDbSchemaError(error.message) };
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

export async function deleteAllProducts() {
  const supabase = await createServiceClient();
  const { data: products } = await supabase.from("products").select("id");
  const count = products?.length || 0;
  if (count === 0) return { success: true, deleted: 0 };

  await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("inventory").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return { error: formatDbSchemaError(error.message) };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true, deleted: count };
}

export async function getProductByIdAdmin(id: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, images:product_images(*), videos:product_videos(*), category:categories(id, name), fabric:fabrics(id, name)")
    .eq("id", id)
    .single();
  return data;
}

export async function getDashboardStats() {
  const supabase = await createServiceClient();

  const [
    { count: totalProducts },
    { count: totalCustomers },
    { data: paidOrders },
    { count: totalOrders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const totalRevenue = (paidOrders || []).reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  return {
    totalProducts: totalProducts || 0,
    totalCustomers: totalCustomers || 0,
    totalOrders: totalOrders || 0,
    totalRevenue,
  };
}

export async function getAllProductsAdmin() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, images:product_images(*), category:categories(name), brand:brands(name)")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getProductByBarcode(barcode: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, images:product_images(*), category:categories(name)")
    .eq("barcode", barcode)
    .single();
  return data;
}
