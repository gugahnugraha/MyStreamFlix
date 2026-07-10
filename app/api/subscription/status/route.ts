import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripeActive = !!(stripeSecret && stripeSecret !== "" && !stripeSecret.includes("placeholder"));

  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;
  const paypalActive = !!(
    paypalClientId && 
    paypalClientId !== "" && 
    !paypalClientId.includes("placeholder") &&
    paypalSecret && 
    paypalSecret !== "" && 
    !paypalSecret.includes("placeholder")
  );

  return NextResponse.json({ stripeActive, paypalActive });
}
