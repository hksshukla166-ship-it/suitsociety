"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCart() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("cart_items")
    .select("*, product:products(*, images:product_images(*))")
    .eq("user_id", user.id);
  return data || [];
}

export async function addToCart(productId: string, quantity: number, color?: string, size?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please login first" };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("color", color || "")
    .eq("size", size || "")
    .maybeSingle();

  if (existing) {
    await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity, color, size });
  }
  revalidatePath("/cart");
  return { success: true };
}

export async function updateCartItem(id: string, quantity: number) {
  const supabase = await createClient();
  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", id);
  } else {
    await supabase.from("cart_items").update({ quantity }).eq("id", id);
  }
  revalidatePath("/cart");
  return { success: true };
}

export async function removeFromCart(id: string) {
  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("id", id);
  revalidatePath("/cart");
  return { success: true };
}

export async function getWishlist() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("wishlists")
    .select("*, product:products(*, images:product_images(*))")
    .eq("user_id", user.id);
  return data || [];
}

export async function toggleWishlist(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please login first" };

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    return { success: true, added: false };
  }
  await supabase.from("wishlists").upsert(
    { user_id: user.id, product_id: productId },
    { onConflict: "user_id,product_id" }
  );
  return { success: true, added: true };
}

export async function subscribeNewsletter(email: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").upsert({ email }, { onConflict: "email" });
  if (error) return { error: error.message };
  return { success: true };
}
