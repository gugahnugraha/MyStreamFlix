import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser, hashPassword } from "@/src/lib/data-service";
import { setSessionCookie } from "@/src/lib/session";
import { User } from "@/src/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 400 });
    }

    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name,
      email,
      role: "user",
      createdAt: new Date().toISOString(),
      isPremium: false,
      profiles: [
        { id: `prof-${Date.now()}-1`, name: name, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", isKids: false },
        { id: `prof-${Date.now()}-2`, name: "Kids Zone", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", isKids: true }
      ],
      activeProfileId: `prof-${Date.now()}-1`
    };

    const finalPassword = password || "password";
    const passwordHash = hashPassword(finalPassword);

    await createUser(newUser, passwordHash);
    await setSessionCookie(newUser.id);

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
