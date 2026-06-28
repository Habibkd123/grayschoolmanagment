import { NextResponse } from "next/server";

// ─── Logout ───────────────────────────────────────────────────────
// Since we use stateless JWT, server-side logout just tells the client
// to discard the tokens. For production you'd also maintain a token
// blacklist (Redis) — but for now, client-side clearing is sufficient.
export async function POST() {
  return NextResponse.json(
    {
      success: true,
      message: "Logged out successfully. Please clear your tokens on the client.",
    },
    { status: 200 }
  );
}
