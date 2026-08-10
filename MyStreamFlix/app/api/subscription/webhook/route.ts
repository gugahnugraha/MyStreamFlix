import { NextRequest, NextResponse } from "next/server";
import { subscribeUser } from "@/src/lib/data-service";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (!signature || !webhookSecret || webhookSecret.includes("placeholder") || !stripeSecret) {
      return NextResponse.json({ error: "Webhook signature credentials or secrets are missing in .env." }, { status: 400 });
    }

    // Initialize official Stripe SDK client
    const stripe = new Stripe(stripeSecret);

    let event: Stripe.Event;

    try {
      // Validate signature securely using Stripe SDK
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      return NextResponse.json({ error: `Stripe signature validation check failed: ${err.message}` }, { status: 401 });
    }

    // React to completed subscription checkout signals
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
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
