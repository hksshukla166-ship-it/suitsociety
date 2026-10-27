import { createServiceClient } from "@/lib/supabase/admin";
import { getUserSession } from "@/lib/auth";
import { validateCoupon } from "@/lib/pricing";
import type { Coupon } from "@/types";

export async function POST(request: Request) {
  try {
    const { code, cartTotal, productIds, categoryIds } = await request.json();
    const session = await getUserSession();
    const supabase = createServiceClient();

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", String(code).toUpperCase())
      .single();

    if (!coupon) {
      return Response.json({ valid: false, message: "Invalid coupon" });
    }

    const result = validateCoupon(
      coupon as Coupon,
      cartTotal,
      session?.id || "guest",
      productIds || [],
      categoryIds || []
    );

    if (!result.valid) {
      return Response.json({ valid: false, message: result.error });
    }

    return Response.json({ valid: true, discount: result.discount, coupon });
  } catch {
    return Response.json({ valid: false, message: "Validation failed" }, { status: 500 });
  }
}
