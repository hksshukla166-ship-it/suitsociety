import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { createUserToken } from "@/lib/auth";
import { getActiveOtpSession, markOtpVerified, saveOtpSession } from "@/lib/otp-store";
import { isFonosterConfigured, sendOtpViaFonoster } from "@/lib/fonoster";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { phone, action, otp, name } = await request.json();

    if (!phone || phone.length < 10) {
      return Response.json({ error: "Valid phone number required" }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
    const supabase = createServiceClient();

    if (action === "send_otp") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: otpSaveError } = await saveOtpSession(normalizedPhone, otpHash, expiresAt);
      if (otpSaveError) {
        console.error("OTP session save failed:", otpSaveError);
        return Response.json(
          { error: "Could not start login. Please try again in a moment." },
          { status: 500 }
        );
      }
      let callDelivered = false;
      const showOtpOnScreen =
        !isFonosterConfigured() ||
        process.env.FONOSTER_OTP_FALLBACK === "true";

      if (isFonosterConfigured()) {
        if (showOtpOnScreen) {
          void sendOtpViaFonoster(normalizedPhone, otp).catch((error) => {
            const message = error instanceof Error ? error.message : "Unknown Fonoster error";
            console.error("Fonoster OTP delivery failed:", message, error);
          });
        } else {
          try {
            const callResult = await sendOtpViaFonoster(normalizedPhone, otp);
            callDelivered = callResult.delivered;
            if (!callDelivered) {
              return Response.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown Fonoster error";
            console.error("Fonoster OTP delivery failed:", message, error);
            return Response.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
          }
        }
      } else if (process.env.NODE_ENV === "development") {
        console.log(`OTP for ${normalizedPhone}: ${otp}`);
      }

      return Response.json({
        success: true,
        message: showOtpOnScreen
          ? "Use the verification code shown below to login"
          : "OTP call initiated — answer your phone",
        callDelivered,
        showOtpOnScreen,
        ...(showOtpOnScreen ? { fallbackOtp: otp } : {}),
        ...(process.env.NODE_ENV === "development" && !isFonosterConfigured()
          ? { devOtp: otp }
          : {}),
      });
    }

    if (action === "verify_otp") {
      if (!otp || String(otp).length !== 6) {
        return Response.json({ error: "Valid 6-digit OTP required" }, { status: 400 });
      }

      const session = await getActiveOtpSession(normalizedPhone);
      if (!session) {
        return Response.json({ error: "OTP expired or not found" }, { status: 400 });
      }

      const valid = await bcrypt.compare(String(otp), session.otp_hash);
      if (!valid) {
        return Response.json({ error: "Invalid OTP" }, { status: 400 });
      }

      await markOtpVerified(normalizedPhone);

      let { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (!user) {
        const userId = randomUUID();
        const { data: newUser, error: profileError } = await supabase
          .from("users")
          .upsert(
            {
              id: userId,
              phone: normalizedPhone,
              full_name: name || null,
            },
            { onConflict: "phone" }
          )
          .select()
          .single();

        if (profileError) {
          console.error("User profile creation failed:", profileError.message);
          return Response.json({ error: "Failed to create user" }, { status: 500 });
        }

        user = newUser;
      } else if (name && !user.full_name) {
        const { data: updatedUser } = await supabase
          .from("users")
          .update({ full_name: name })
          .eq("id", user.id)
          .select()
          .single();
        user = updatedUser || user;
      }

      if (!user) {
        return Response.json({ error: "Failed to create user" }, { status: 500 });
      }

      const token = await createUserToken(user);
      const cookieStore = await cookies();
      cookieStore.set("user_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return Response.json({ success: true, user });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("OTP auth error:", error);
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("user_token");
  return Response.json({ success: true });
}
