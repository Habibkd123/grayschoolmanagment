import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LandingContent from "@/lib/models/LandingContent";

// Temporary debug route - shows all landing content documents
export async function GET() {
  try {
    await connectDB();
    const docs = await LandingContent.find({}).lean();
    return NextResponse.json({
      env_school_id: process.env.NEXT_PUBLIC_SCHOOL_ID,
      count: docs.length,
      docs: docs.map((d: any) => ({
        _id: d._id,
        school_id: d.school_id,
        has_about: !!d.about?.hero_tagline || !!d.about?.history,
        about_tagline: d.about?.hero_tagline,
        about_history_preview: d.about?.history?.slice(0, 80),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
