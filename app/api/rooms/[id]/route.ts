import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Room } from "@/lib/models/index";
import { requireAuth } from "@/lib/utils/auth";

// PUT: Update a room
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { schoolId, error } = requireAuth(req, ["school_admin", "super_admin"]);
  if (error) return error;

  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();
    const room = await Room.findOneAndUpdate(
      { _id: id, school_id: schoolId },
      { $set: body },
      { new: true }
    );
    if (!room) return NextResponse.json({ success: false, message: "Room not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE: Delete a room
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { schoolId, error } = requireAuth(req, ["school_admin", "super_admin"]);
  if (error) return error;

  try {
    const { id } = await params;
    await connectToDatabase();
    const room = await Room.findOneAndDelete({ _id: id, school_id: schoolId });
    if (!room) return NextResponse.json({ success: false, message: "Room not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Room deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
