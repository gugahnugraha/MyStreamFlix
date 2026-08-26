import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser, verifyUserPassword, hashPassword } from "@/src/lib/data-service";
import { setSessionCookie } from "@/src/lib/session";
import { User } from "@/src/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }
    
    // Check if the user already exists in the database
    let user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Akun dengan email ini tidak terdaftar. Silakan registrasi terlebih dahulu." },
        { status: 401 }
      );
    }

    const passwordHash = hashPassword(password);
    const isValid = await verifyUserPassword(user.id, passwordHash);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Password yang Anda masukkan salah. Silakan coba lagi." },
        { status: 401 }
      );
    }
    
    await setSessionCookie(user.id);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
