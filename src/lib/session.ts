import { cookies } from "next/headers";
import { getUserById } from "./data-service";
import { User } from "@/src/types";

export async function getCurrentSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    if (!userId) return null;
    return await getUserById(userId);
  } catch (error) {
    console.warn("Session retrieval failed:", error);
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set("session_user_id", userId, {
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
