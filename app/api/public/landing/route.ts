import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LandingContent from "@/lib/models/LandingContent";
import mongoose from "mongoose";

// GET /api/public/landing — fetch landing content for this school (no auth required)
export async function GET() {
  try {
    const schoolId = process.env.NEXT_PUBLIC_SCHOOL_ID;
    if (!schoolId) {
      return NextResponse.json(
        { success: false, message: "School not configured" },
        { status: 500 }
      );
    }

    await connectDB();
    const doc = await LandingContent.findOne({
      school_id: new mongoose.Types.ObjectId(schoolId),
    }).lean();

    if (!doc) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    console.error("[PUBLIC LANDING GET ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch landing content" },
      { status: 500 }
    );
  }
}
