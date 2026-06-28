import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Holiday } from "@/lib/models/index";
import { requireAuth } from "@/lib/utils/auth";

export async function GET(req: NextRequest) {
  const { schoolId, error } = requireAuth(req, ["school_admin", "super_admin", "teacher", "student"]);
  if (error) return error;

  try {
    await connectToDatabase();
    const holidays = await Holiday.find({ school_id: schoolId }).sort({ date: 1 });
    return NextResponse.json(
      { success: true, data: holidays },
      { headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=600" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { schoolId, error } = requireAuth(req, ["school_admin", "super_admin"]);
  if (error) return error;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { title, date, description, status } = body;

    if (!title || !date) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const display_id = `H${Math.floor(100000 + Math.random() * 900000)}`;

    const holiday = await Holiday.create({
      school_id: schoolId as string,
      display_id,
      title: title.trim(),
      date: new Date(date),
      description: description?.trim(),
      status: status || "Active",
    });

    return NextResponse.json({ success: true, data: holiday }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, message: "Holiday on this date with this title already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
