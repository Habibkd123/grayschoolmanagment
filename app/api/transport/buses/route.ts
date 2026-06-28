import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Bus } from "@/lib/models";
import mongoose from "mongoose";

// We'll use a hardcoded school_id for now as in other APIs
const DEFAULT_SCHOOL_ID = new mongoose.Types.ObjectId("65f0a1b2c3d4e5f6a7b8c9d0");

export async function GET(request: Request) {
  try {
    await connectDB();
    const buses = await Bus.find({ school_id: DEFAULT_SCHOOL_ID }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: buses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    
    const newBus = await Bus.create({
      ...body,
      school_id: DEFAULT_SCHOOL_ID
    });
    
    return NextResponse.json({ success: true, data: newBus }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Bus number already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
