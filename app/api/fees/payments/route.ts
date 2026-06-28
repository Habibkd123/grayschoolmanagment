import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { FeePayment, FeeMaster } from "@/lib/models";
import Student from "@/lib/models/Student";
import Parent from "@/lib/models/Parent";
import { requireAuth } from "@/lib/utils/auth";

// Generate a random unique receipt number
function generateReceiptNumber() {
  return "REC-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
}

export async function GET(req: NextRequest) {
  try {
    const { schoolId, role, userId, error } = requireAuth(req);
    if (error) return error;

    const url = new URL(req.url);
    const student_id = url.searchParams.get("student_id");

    const query: any = { school_id: schoolId };

    await connectDB();

    if (role === "student") {
      const studentProfile = await Student.findOne({ school_id: schoolId, user_id: userId }).select("_id").lean();
      if (!studentProfile) {
        return NextResponse.json({ success: true, data: { payments: [] } });
      }
      query.student_id = studentProfile._id;
    } else if (role === "parent") {
      const parent = await Parent.findOne({ user_id: userId, school_id: schoolId }).select("_id").lean();
      if (!parent) {
        return NextResponse.json({ success: true, data: { payments: [] } });
      }
      const children = await Student.find({ school_id: schoolId, parent_id: parent._id }).select("_id").lean();
      const childIds = children.map((c: any) => c._id.toString());
      if (student_id) {
        if (!childIds.includes(student_id)) {
          return NextResponse.json({ success: false, message: "Access denied to student record" }, { status: 403 });
        }
        query.student_id = student_id;
      } else {
        query.student_id = { $in: childIds };
      }
    } else {
      if (student_id) query.student_id = student_id;
    }

    const payments = await FeePayment.find(query)
      .populate("student_id", "name admission_no roll_no")
      .populate({
        path: "fee_master_id",
        populate: [
          { path: "fee_group_id", select: "name" },
          { path: "fee_type_id", select: "name" }
        ]
      })
      .sort({ transaction_date: -1 })
      .lean();

    return NextResponse.json({ success: true, data: { payments } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { role, schoolId, error } = requireAuth(req);
    if (error) return error;
    if (role !== "school_admin" && role !== "super_admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!schoolId) {
      return NextResponse.json({ success: false, message: "No school context" }, { status: 403 });
    }

    const body = await req.json();
    const { student_id, fee_master_id, amount_paid, payment_method, remarks } = body;

    if (!student_id || !fee_master_id || !amount_paid || !payment_method) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    
    // Validate that fee master exists
    const master = await FeeMaster.findOne({ _id: fee_master_id, school_id: schoolId });
    if (!master) {
      return NextResponse.json({ success: false, message: "Invalid Fee Master record" }, { status: 400 });
    }

    const payment = await FeePayment.create({
      school_id: schoolId,
      student_id,
      fee_master_id,
      amount_paid: Number(amount_paid),
      payment_method,
      remarks,
      receipt_number: generateReceiptNumber(),
      transaction_date: new Date()
    });

    const populatedPayment = await FeePayment.findById(payment._id)
      .populate("student_id", "name admission_no roll_no")
      .populate({
        path: "fee_master_id",
        populate: [
          { path: "fee_group_id", select: "name" },
          { path: "fee_type_id", select: "name" }
        ]
      });

    return NextResponse.json({ success: true, message: "Payment recorded successfully", data: { payment: populatedPayment } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
