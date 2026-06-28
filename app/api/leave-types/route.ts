import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { LeaveType } from "@/lib/models/index";
import { requireAuth } from "@/lib/utils/auth";

export async function GET(req: NextRequest) {
  const { schoolId, error } = requireAuth(req, ["school_admin", "super_admin", "teacher", "student"]);
  if (error) return error;

  try {
    await connectToDatabase();
    const leaveTypes = await LeaveType.find({ school_id: schoolId }).sort({ leave_type: 1 }).lean();
    return NextResponse.json({ success: true, data: leaveTypes });
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
    const { leave_type, status } = body;

    if (!leave_type) {
      return NextResponse.json({ success: false, message: "Leave type name is required" }, { status: 400 });
    }

    const leaveType = await LeaveType.create({
       school_id: schoolId as string,
       leave_type: leave_type.trim(),
      status: status || "Active",
    });

    return NextResponse.json({ success: true, data: leaveType }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, message: "Leave type with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
