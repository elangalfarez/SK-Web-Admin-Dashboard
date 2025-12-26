// src/app/api/auth/session/route.ts
// Created: API route for checking session state

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      cookieStore.delete("admin_session");
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
      email: session.email,
      fullName: session.fullName,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session delete error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
