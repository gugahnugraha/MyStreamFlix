import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/src/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { planId } = await request.json();

    // Check if PayPal is configured in .env
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || "sandbox";

    const isConfigured = clientId && 
                        clientId !== "" && 
                        !clientId.includes("placeholder") &&
                        clientSecret &&
                        clientSecret !== "" &&
                        !clientSecret.includes("placeholder");

    if (!isConfigured) {
      // Sandbox fallback mode trigger
      return NextResponse.json({ sandbox: true });
    }

    // Map plan to PayPal plan IDs in env
    let planPriceId = "";
    if (planId === "vip") planPriceId = process.env.PAYPAL_PLAN_ID_VIP || "";
    else if (planId === "premium") planPriceId = process.env.PAYPAL_PLAN_ID_PREMIUM || "";
    else if (planId === "ultra") planPriceId = process.env.PAYPAL_PLAN_ID_ULTRA || "";

    if (!planPriceId || planPriceId.includes("placeholder") || planPriceId === "") {
      return NextResponse.json({ 
        error: `PayPal Plan ID for plan '${planId}' is not configured in .env.` 
      }, { status: 400 });
    }

    // Determine environment endpoints
    const paypalApiUrl = mode === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    // 1. Get Access Token from PayPal OAuth API
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const oauthResponse = await fetch(`${paypalApiUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "grant_type": "client_credentials"
      }).toString()
    });

    const oauthData = await oauthResponse.json();

    if (!oauthResponse.ok) {
      throw new Error(oauthData.error_description || "PayPal OAuth Token extraction failed.");
    }

    const accessToken = oauthData.access_token;

    // 2. Create Billing Subscription
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const subResponse = await fetch(`${paypalApiUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        plan_id: planPriceId,
        custom_id: sessionUser.id, // User ID metadata
        application_context: {
          brand_name: "FlixSphere Streaming",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${origin}/?checkout=success&provider=paypal&plan=${planId}`,
          cancel_url: `${origin}/?checkout=cancelled`
        }
      })
    });

    const subData = await subResponse.json();

    if (!subResponse.ok) {
      throw new Error(subData.message || "PayPal subscription creation failed.");
    }

    // Find the approval link to redirect the customer to PayPal
    const approveLink = subData.links?.find((l: any) => l.rel === "approve")?.href;

    if (!approveLink) {
      throw new Error("PayPal approval link not found in response.");
    }

    return NextResponse.json({ url: approveLink });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
