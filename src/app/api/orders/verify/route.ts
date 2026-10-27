import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      await request.json();

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: order } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        razorpay_payment_id,
      })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (order) {
      for (const item of order.order_items || []) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("stock, sales_count")
            .eq("id", item.product_id)
            .single();

          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);

            await supabase
              .from("products")
              .update({
                stock: newStock,
                sales_count: (product.sales_count || 0) + item.quantity,
              })
              .eq("id", item.product_id);

            await supabase.from("inventory").insert({
              product_id: item.product_id,
              type: "sale",
              quantity: item.quantity,
              previous_stock: product.stock,
              new_stock: newStock,
              notes: `Order ${order.order_number}`,
            });
          }
        }
      }

      if (order.coupon_code) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("usage_count")
          .eq("code", order.coupon_code)
          .single();
        if (coupon) {
          await supabase
            .from("coupons")
            .update({ usage_count: (coupon.usage_count || 0) + 1 })
            .eq("code", order.coupon_code);
        }
      }
    }

    return Response.json({ success: true, orderNumber: order?.order_number });
  } catch {
    return Response.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
