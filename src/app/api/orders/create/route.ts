import Razorpay from "razorpay";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserSession } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shipping, couponCode, couponDiscount, subtotal, shippingAmount, totalAmount } = body;
    const session = await getUserSession();
    if (!session) {
      return Response.json({ error: "Please login to place an order" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const orderNumber = generateOrderNumber();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: orderNumber,
    });

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: session.id,
        status: "pending",
        subtotal,
        coupon_discount: couponDiscount || 0,
        coupon_code: couponCode || null,
        shipping: shippingAmount || 0,
        total: totalAmount,
        payment_method: "razorpay",
        payment_status: "pending",
        razorpay_order_id: razorpayOrder.id,
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_pincode: shipping.pincode,
      })
      .select()
      .single();

    if (error) throw error;

    const productIds = [...new Set(items.map((item: { productId: string }) => item.productId))];
    const { data: products } = await supabase
      .from("products")
      .select("id, barcode, sku")
      .in("id", productIds);
    const codeByProduct = new Map(
      (products || []).map((p) => [p.id, p.barcode || p.sku || null])
    );

    const orderItems = items.map((item: {
      productId: string;
      name: string;
      image: string;
      color?: string;
      size?: string;
      quantity: number;
      price: number;
      originalPrice: number;
    }) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      product_code: codeByProduct.get(item.productId) || null,
      product_image: item.image,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      discount: Math.max(0, item.originalPrice - item.price),
      total: item.price * item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);

    return Response.json({
      orderId: order.id,
      orderNumber,
      razorpayOrderId: razorpayOrder.id,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
