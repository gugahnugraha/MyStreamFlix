import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser, verifyUserPassword, hashPassword } from "@/src/lib/data-service";
import { setSessionCookie } from "@/src/lib/session";
import { User } from "@/src/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    let user = await getUserByEmail(email);

    if (user) {
      if (password) {
        const passwordHash = hashPassword(password);
        const isValid = await verifyUserPassword(user.id, passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
      }
      
      await setSessionCookie(user.id);
      return NextResponse.json({ success: true, user });
    }

    // Mock admin login fallback
    if (email === "admin@streamcms.com") {
      const allUsers = await getUserByEmail("admin@streamcms.com");
      if (allUsers) {
        await setSessionCookie(allUsers.id);
        return NextResponse.json({ success: true, user: allUsers });
      }
    }

    // Auto-create viewer account if user not found (as in original server.ts)
    const newId = `usr-${Date.now()}`;
    const username = email.split("@")[0];
    const newUser: User = {
      id: newId,
      name: username,
      email: email,
      role: "user",
      createdAt: new Date().toISOString(),
      isPremium: false,
      profiles: [
        { id: `prof-${Date.now()}-1`, name: username, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", isKids: false },
        { id: `prof-${Date.now()}-2`, name: "Kids Zone", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", isKids: true }
      ],
      activeProfileId: `prof-${Date.now()}-1`
    };

    const finalPassword = password || "password";
    const finalHash = hashPassword(finalPassword);
    
    await createUser(newUser, finalHash);
    await setSessionCookie(newUser.id);
    
    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
