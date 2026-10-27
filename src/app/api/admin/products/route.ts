import { getAdminSession } from "@/lib/auth";
import { resolveProductBarcode } from "@/lib/barcode";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify as slugUtil } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const supabase = createServiceClient();

    let query = supabase
      .from("products")
      .select("*, category:categories(name), brand:brands(name), product_images(*)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return Response.json({ products: data, count });
  } catch (error) {
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const supabase = createServiceClient();
    const barcode = await resolveProductBarcode(supabase, body.sku || body.product_code);
    const slug = slugUtil(body.name);

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: body.name,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: body.description,
        specifications: body.specifications || {},
        category_id: body.category_id || null,
        brand_id: body.brand_id || null,
        fabric_id: body.fabric_id || null,
        price: body.price ?? body.base_price,
        compare_at_price: body.compare_at_price ?? body.compare_price,
        barcode,
        sku: body.sku,
        colors: body.colors || [],
        sizes: body.sizes || [],
        stock: body.stock ?? body.stock_quantity ?? 0,
        low_stock_threshold: body.low_stock_threshold || 5,
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        is_new_arrival: body.is_new_arrival ?? false,
        is_trending: body.is_trending ?? false,
        is_best_seller: body.is_best_seller ?? false,
        meta_title: body.meta_title,
        meta_description: body.meta_description,
      })
      .select()
      .single();

    if (error) throw error;

    if (body.images?.length) {
      await supabase.from("product_images").insert(
        body.images.map((url: string, i: number) => ({
          product_id: product.id,
          url,
          sort_order: i,
          is_primary: i === 0,
        }))
      );
    }

    const stockQty = body.stock ?? body.stock_quantity ?? 0;
    if (stockQty > 0) {
      await supabase.from("inventory").insert({
        product_id: product.id,
        type: "stock_in",
        quantity: stockQty,
        previous_stock: 0,
        new_stock: stockQty,
        notes: "Initial stock",
        created_by: session.id,
      });
    }

    const { data: newProductDiscounts } = await supabase
      .from("product_discounts")
      .select("*")
      .eq("apply_to_new_products", true)
      .eq("is_active", true);

    return Response.json({ product, barcode, appliedDiscounts: newProductDiscounts?.length || 0 });
  } catch (error) {
    console.error("Product create error:", error);
    return Response.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const supabase = createServiceClient();

    const { id, images, ...updates } = body;
    delete updates.barcode;

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (images) {
      await supabase.from("product_images").delete().eq("product_id", id);
      if (images.length) {
        await supabase.from("product_images").insert(
          images.map((url: string, i: number) => ({
            product_id: id,
            url,
            sort_order: i,
            is_primary: i === 0,
          }))
        );
      }
    }

    return Response.json({ product: data });
  } catch {
    return Response.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID required" }, { status: 400 });

    const supabase = createServiceClient();
    await supabase.from("products").delete().eq("id", id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
