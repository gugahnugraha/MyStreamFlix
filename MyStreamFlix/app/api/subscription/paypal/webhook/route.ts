import { NextRequest, NextResponse } from "next/server";
import { subscribeUser } from "@/src/lib/data-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // PayPal sends BILLING.SUBSCRIPTION.ACTIVATED when a subscription is approved/started
    // and PAYMENT.SALE.COMPLETED on each subsequent automatic monthly billing sale clearing
    const eventType = payload.event_type;

    if (
      eventType === "BILLING.SUBSCRIPTION.ACTIVATED" || 
      eventType === "PAYMENT.SALE.COMPLETED"
    ) {
      const resource = payload.resource;
      
      // custom_id stores our userId metadata
      const userId = resource.custom_id || resource.custom;
      
      if (userId) {
        // Upgrade user status to premium VIP in the database/store
        await subscribeUser(userId);
        console.log(`[PayPal Webhook SUCCESS] Upgraded user: ${userId} via ${eventType}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
