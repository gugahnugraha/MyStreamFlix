import { cookies } from "next/headers";
import { getUserById } from "./data-service";
import { User } from "@/src/types";
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "mystreamflix_super_secret_session_key_123456";

function sign(userId: string): string {
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(userId)
    .digest("hex");
  return `${userId}.${signature}`;
}

function unsign(cookieValue: string): string | null {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [userId, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(userId)
    .digest("hex");
  
  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    
    if (signatureBuffer.length === expectedBuffer.length && 
        crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return userId;
    }
  } catch (error) {
    return null;
  }
  return null;
}

export async function getCurrentSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const rawValue = cookieStore.get("session_user_id")?.value;
    if (!rawValue) return null;
    
    const userId = unsign(rawValue);
    if (!userId) return null;
    
    return await getUserById(userId);
  } catch (error) {
    console.warn("Session retrieval failed:", error);
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const signedValue = sign(userId);
  cookieStore.set("session_user_id", signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session_user_id", "", {
    path: "/",
    maxAge: 0
  });
}
