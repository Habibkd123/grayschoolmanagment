import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { TransportAllocation } from "@/lib/models";
import mongoose from "mongoose";

const DEFAULT_SCHOOL_ID = new mongoose.Types.ObjectId("65f0a1b2c3d4e5f6a7b8c9d0");

export async function GET(request: Request) {
  try {
    await connectDB();

    // Populate student, route, and bus details
    const allocations = await TransportAllocation.find({ school_id: DEFAULT_SCHOOL_ID })
      .populate("student_id", "first_name last_name admission_no current_class")
      .populate("route_id", "routeName")
      .populate("bus_id", "busNumber")
      .sort({ createdAt: -1 })
      .lean();

    // Transform data to match frontend requirements
    const transformed = allocations.map((alloc: any) => ({
      _id: alloc._id,
      id: alloc._id.toString(), // Mocked TA-XXX logic usually but keeping mongo id is safer
      studentName: `${alloc.student_id?.first_name || ""} ${alloc.student_id?.last_name || ""}`.trim(),
      studentId: alloc.student_id?._id,
      admissionNo: alloc.student_id?.admission_no || "N/A",
      className: alloc.student_id?.current_class || "N/A",
      route: alloc.route_id?.routeName || "Unknown",
      busNumber: alloc.bus_id?.busNumber || "Unknown",
      pickupStop: alloc.pickupStop,
      status: alloc.status,
      createdAt: alloc.createdAt
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();

    const newAlloc = await TransportAllocation.create({
      ...body,
      school_id: DEFAULT_SCHOOL_ID
    });

    return NextResponse.json({ success: true, data: newAlloc }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Student is already allocated to a transport route" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
