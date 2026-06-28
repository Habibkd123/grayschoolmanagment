import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User, { IUser, UserRole } from "@/lib/models/User";
import School from "@/lib/models/School";
import { generateAccessToken, generateRefreshToken } from "@/lib/utils/jwt";
import { validate, validationErrorResponse } from "@/lib/utils/validate";

// ─── Allowed roles that can self-register ─────────────────────────
// Teachers and students must be added by school_admin, NOT self-register.
// Only school_admin can be created this way (after school is set up).
const ALLOWED_SELF_REGISTER_ROLES = ["school_admin"];

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // ─── Strict Validation ──────────────────────────────────────
    const errors = validate(body, {
      name: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, isEmail: true },
      password: {
        required: true,
        minLength: 8,
        maxLength: 100,
        match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        matchMessage:
          "password must contain at least one uppercase letter, one lowercase letter, and one number",
      },
      school_id: { required: true, isMongoId: true },
      role: { required: true, isEnum: ALLOWED_SELF_REGISTER_ROLES },
    });

    if (errors.length > 0) return validationErrorResponse(errors);

    const { name, email, password, school_id, role } = body as {
      name: string;
      email: string;
      password: string;
      school_id: string;
      role: string;
    };

    // ─── Verify school exists and is active ───────────────────────
    const school = await School.findOne({ _id: school_id, is_active: true });
    if (!school) {
      return NextResponse.json(
        { success: false, message: "School not found or inactive" },
        { status: 404 }
      );
    }

    // ─── Check duplicate email in same school ─────────────────────
    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
      school_id,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email already registered in this school" },
        { status: 409 }
      );
    }

    // ─── Create user ────────────────────────────────────────────────
    // Use new + save() pattern to avoid Mongoose TS overload issues
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: password, // pre-save hook will bcrypt this
      role: role as UserRole,
      school_id,
      is_active: true,
    });
    await newUser.save();

    // ─── Send Welcome Email ──────────────────────────
    try {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail({
        to: newUser.email,
        subject: "Welcome to School ERP!",
        html: `
          <h3>Welcome ${newUser.name}!</h3>
          <p>Your account has been successfully created.</p>
          <p>You are registered as: <strong>${newUser.role.replace("_", " ").toUpperCase()}</strong></p>
          <p>You can now log in to the portal using your email and password.</p>
          <br/>
          <p>Thank you,<br/>School ERP Team</p>
        `
      });
    } catch (e) {
      console.error("Failed to send welcome email", e);
    }

    // ─── Generate tokens ──────────────────────────────────────────────────
    const tokenPayload = {
      user_id: newUser._id.toString(),
      school_id: newUser.school_id?.toString() ?? null,
      role: newUser.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            school_id: newUser.school_id,
          },
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
