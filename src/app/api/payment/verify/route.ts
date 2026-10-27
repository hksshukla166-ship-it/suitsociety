import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/actions/orders";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await verifyPayment(
      body.orderId,
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
