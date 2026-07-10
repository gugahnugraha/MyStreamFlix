import { NextRequest, NextResponse } from "next/server";
import { subscribeUser } from "@/src/lib/data-service";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Skip validation if stripe webhook secret is default/not set
    if (!signature || !webhookSecret || webhookSecret.includes("placeholder")) {
      return NextResponse.json({ error: "Webhook signature credentials are missing in .env." }, { status: 400 });
    }

    // Manual, native validation of the Stripe webhook signature to remain dependency-free
    const parts = signature.split(",");
    const timestampPart = parts.find(p => p.startsWith("t="));
    const signaturePart = parts.find(p => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) {
      return NextResponse.json({ error: "Malformed stripe-signature header format." }, { status: 400 });
    }

    const timestamp = timestampPart.split("=")[1];
    const stripeSig = signaturePart.split("=")[1];

    const signedPayload = `${timestamp}.${body}`;
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    // Timing-safe comparison to prevent timing verification attacks
    const bufferStripeSig = Buffer.from(stripeSig, "utf-8");
    const bufferExpectedSig = Buffer.from(expectedSig, "utf-8");

    if (bufferStripeSig.length !== bufferExpectedSig.length || 
        !crypto.timingSafeEqual(bufferStripeSig, bufferExpectedSig)) {
      return NextResponse.json({ error: "Stripe signature validation check failed." }, { status: 401 });
    }

    const payload = JSON.parse(body);
    
    // React to completed subscription checkout signals
    if (payload.type === "checkout.session.completed") {
      const session = payload.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;
      
      if (userId) {
        // Grant VIP premium access in the DB / memory store
        await subscribeUser(userId);
        console.log(`[Stripe Webhook SUCCESS] User upgraded successfully: ${userId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
