import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/src/lib/session";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { planId } = await request.json();

    // Check if Stripe configurations are present in .env
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const isConfigured = stripeSecret && 
                        stripeSecret !== "" && 
                        !stripeSecret.includes("placeholder");

    if (!isConfigured) {
      // Trigger sandbox fallback mode in client modal
      return NextResponse.json({ sandbox: true });
    }

    // Map plan selected to Stripe price IDs in env
    let priceId = "";
    if (planId === "vip") priceId = process.env.STRIPE_PRICE_ID_VIP || "";
    else if (planId === "premium") priceId = process.env.STRIPE_PRICE_ID_PREMIUM || "";
    else if (planId === "ultra") priceId = process.env.STRIPE_PRICE_ID_ULTRA || "";

    if (!priceId || priceId.includes("placeholder") || priceId === "") {
      return NextResponse.json({ 
        error: `Stripe Price ID for plan '${planId}' is not configured in .env.` 
      }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Initialize official Stripe SDK client
    const stripe = new Stripe(stripeSecret);

    // Call checkout session creation using official Stripe SDK
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"], // Supports credit cards in USD
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?checkout=success&plan=${planId}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      client_reference_id: sessionUser.id,
      metadata: {
        userId: sessionUser.id,
        planId: planId,
      },
    });

    if (!session.url) {
      throw new Error("Failed to generate Stripe checkout session URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
