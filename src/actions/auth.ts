"use server";

import { adminLogin, adminLogout, getAdminSession, updateAdminCredentials } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function loginAdmin(username: string, password: string) {
  return adminLogin(username, password);
}

export async function logoutAdmin() {
  await adminLogout();
  revalidatePath("/admin");
}

export async function getSession() {
  return getAdminSession();
}

export async function changeAdminCredentials(newUsername?: string, newPassword?: string) {
  const session = await getAdminSession();
  if (!session) return { error: "Not authenticated" };
  return updateAdminCredentials(session.id, newUsername, newPassword);
}

export async function sendOTP(phone: string) {
  const supabase = await createServiceClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
  if (error) return { error: error.message };
  return { success: true };
}

export async function verifyOTP(phone: string, token: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+91${phone}`,
    token,
    type: "sms",
  });
  if (error) return { error: error.message };

  const user = (data as { user?: { id: string } })?.user;
  if (user) {
    const { data: existing } = await supabase.from("users").select("id").eq("id", user.id).single();
    if (!existing) {
      await supabase.from("users").insert({ id: user.id, phone: `+91${phone}` });
    }
  }

  return { success: true, user: user ?? null };
}

export async function getCurrentUser() {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  return profile;
}

export async function updateProfile(userId: string, data: { full_name?: string; email?: string }) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("users").update(data).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/account");
  return { success: true };
}

export async function addToWishlist(userId: string, productId: string) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("wishlists").upsert({ user_id: userId, product_id: productId });
  if (error) return { error: error.message };
  return { success: true };
}

export async function getWishlist(userId: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("wishlists")
    .select("*, product:products(*, images:product_images(*))")
    .eq("user_id", userId);
  return data || [];
}

export async function submitReview(productId: string, userId: string, rating: number, title: string, comment: string) {
  const supabase = await createServiceClient();

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  const payload = {
    product_id: productId,
    user_id: userId,
    rating,
    title,
    comment,
    is_approved: false,
  };

  const existingId = existing ? (existing as { id: string }).id : null;
  const { error } = existingId
    ? await supabase.from("reviews").update(payload).eq("id", existingId)
    : await supabase.from("reviews").insert(payload);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getProductReviews(productId: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, user:users(full_name)")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getRecentApprovedReviews(limit = 6) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, user:users(full_name), product:products(name, slug)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getPendingReviews() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, product:products(name), user:users(full_name, phone)")
    .eq("is_approved", false)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function approveReview(reviewId: string, approved: boolean) {
  const supabase = await createServiceClient();
  if (approved) {
    await supabase.from("reviews").update({ is_approved: true }).eq("id", reviewId);
    const { data: review } = await supabase.from("reviews").select("product_id, rating").eq("id", reviewId).single();
    if (review) {
      const { data: reviews } = await supabase.from("reviews").select("rating").eq("product_id", review.product_id).eq("is_approved", true);
      const avg =
        (reviews || []).reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
        (reviews?.length || 1);
      await supabase.from("products").update({ rating_avg: avg, rating_count: reviews?.length || 0 }).eq("id", review.product_id);
    }
  } else {
    await supabase.from("reviews").delete().eq("id", reviewId);
  }
  revalidatePath("/admin/reviews");
  return { success: true };
}
