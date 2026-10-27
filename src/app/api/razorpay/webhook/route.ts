import { fulfillPaidOrder, markOrderPaymentFailed } from "@/actions/orders";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RazorpayWebhookEvent = {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
      };
    };
  };
};

async function findOrderByRazorpayOrderId(razorpayOrderId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();
  return data;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.error("[Razorpay Webhook] Invalid signature");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "payment.captured":
      case "order.paid": {
        const payment = event.payload?.payment?.entity;
        const orderEntity = event.payload?.order?.entity;
        const razorpayOrderId = payment?.order_id || orderEntity?.id;
        const paymentId = payment?.id;

        if (!razorpayOrderId) break;

        const order = await findOrderByRazorpayOrderId(razorpayOrderId);
        if (order) {
          await fulfillPaidOrder(order.id, paymentId);
        }
        break;
      }
      case "payment.failed": {
        const razorpayOrderId = event.payload?.payment?.entity?.order_id;
        if (razorpayOrderId) {
          await markOrderPaymentFailed(razorpayOrderId);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[Razorpay Webhook] Handler error:", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return Response.json({ status: "ok" }, { status: 200 });
}

export async function GET() {
  return Response.json({ status: "Razorpay webhook endpoint active" }, { status: 200 });
}
