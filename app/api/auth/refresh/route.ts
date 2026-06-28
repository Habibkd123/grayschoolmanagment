import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "@/lib/utils/jwt";
import { validate, validationErrorResponse } from "@/lib/utils/validate";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errors = validate(body, {
      refresh_token: { required: true },
    });

    if (errors.length > 0) return validationErrorResponse(errors);

    const { refresh_token } = body as { refresh_token: string };

    // ─── Verify refresh token ─────────────────────────────────────
    let decoded;
    try {
      decoded = verifyRefreshToken(refresh_token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired refresh token. Please login again." },
        { status: 401 }
      );
    }

    // ─── Verify user still exists and is active ───────────────────
    await connectDB();
    const user = await User.findOne({ _id: decoded.user_id, is_active: true });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found or deactivated" },
        { status: 401 }
      );
    }

    // ─── Issue new tokens (token rotation for security) ───────────
    const tokenPayload = {
      user_id: user._id.toString(),
      school_id: user.school_id?.toString() ?? null,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload); // Rotate refresh token

    return NextResponse.json(
      {
        success: true,
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[REFRESH ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
