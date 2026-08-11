import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, getUsers, hashPassword } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";
import { User } from "@/src/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const role = body.role === "admin" ? "admin" : "user";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const timestamp = Date.now();
    const newUser: User = {
      id: `usr-${timestamp}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      isPremium: Boolean(body.isPremium),
      profiles: [
        {
          id: `prof-${timestamp}-1`,
          name,
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
          isKids: false,
        },
      ],
      activeProfileId: `prof-${timestamp}-1`,
    };

    const created = await createUser(newUser, hashPassword(password));
    return NextResponse.json({ success: true, user: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
