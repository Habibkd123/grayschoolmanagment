import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, grade } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and Email are required." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.SMTP_TO || process.env.EMAIL_TO || process.env.SMTP_USER || process.env.EMAIL_USER, // recipient
      subject: `New Admission Enquiry from ${name}`,
      html: `
        <h3>New Admission Enquiry</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Grade Applying For:</strong> ${grade}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Enquiry sent successfully!" });
  } catch (error: any) {
    console.error("Nodemailer error:", error);
    return NextResponse.json({ success: false, message: "Failed to send email. Check SMTP credentials." }, { status: 500 });
  }
}
