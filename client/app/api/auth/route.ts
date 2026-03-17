import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      new URL("/register?error=Tokens_Missing", req.url),
    );
  }

  const cookieStore = await cookies();

  // 1. Lock the Refresh Token in an httpOnly cookie
  cookieStore.set("agentx_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 Days
  });

  // 2. Redirect to Dashboard and pass the Access Token in the URL
  // The frontend will read this, save it to memory, and instantly remove it from the URL.
  return NextResponse.redirect(
    new URL(`/dashboard?accessToken=${accessToken}`, req.url),
  );
}
