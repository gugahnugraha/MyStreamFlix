import { NextRequest, NextResponse } from "next/server";
import { updateUserAccount, getUsers, verifyUserPassword, hashPassword } from "@/src/lib/data-service";
import { getCurrentSessionUser } from "@/src/lib/session";

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { name, email, profileImage, currentPassword, newPassword } = await request.json();
    
    // Email conflict check
    if (email) {
      const allUsers = await getUsers();
      if (allUsers.some((user) => user.email === email && user.id !== sessionUser.id)) {
        return NextResponse.json({ error: "Email is already used by another account." }, { status: 400 });
      }
    }

    let payload: any = { name, email, profileImage };

    if (newPassword) {
      const currentPasswordHash = hashPassword(currentPassword);
      const isCurrentValid = await verifyUserPassword(sessionUser.id, currentPasswordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
      payload.passwordHash = hashPassword(newPassword);
    }

    const updatedUser = await updateUserAccount(sessionUser.id, payload);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
