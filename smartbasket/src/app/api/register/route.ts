import connectDb from "../../../lib/db";
import User from "../../../models/user.model";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const {
      name,
      email,
      password,
      mobile,
      role,
      cnicNumber,
      vehicleType,
      vehicleNumber,
      deliveryArea,
    } = await req.json();

    // Sirf allowed roles par signup ho sakta hai.
    const allowedRoles = ["user", "shopkeeper", "deliveryBoy"];

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: "Please select a valid role" },
        { status: 400 }
      );
    }

    // Zaroori fields check karein.
    if (!name || !email || !password || !mobile) {
      return NextResponse.json(
        { message: "Please fill all required fields" },
        { status: 400 }
      );
    }

    // Check karein ke email pehle se registered to nahi.
    const existUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existUser) {
      return NextResponse.json(
        { message: "User already exists!" },
        { status: 400 }
      );
    }

    // Password ki strength check karein.
    const strengthError = validatePassword(password);

    if (strengthError) {
      return NextResponse.json(
        { message: strengthError },
        { status: 400 }
      );
    }

    // Password ko hash karein.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Selected role aur mobile database mein save karein.
    console.log("CNIC RECEIVED BY API:", cnicNumber);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      mobile,
      role,
      cnicNumber,
      vehicleType,
      vehicleNumber,
      deliveryArea,
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}