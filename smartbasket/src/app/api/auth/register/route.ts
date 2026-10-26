
import connectDb from "../../../../lib/db";
import User from "../../../../models/user.model";
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

    console.log("REGISTER API RECEIVED ROLE:", role);

    // Required fields check
    if (!name || !email || !password || !mobile || !role) {
      return NextResponse.json(
        { message: "Please fill all required fields." },
        { status: 400 }
      );
    }

    // Allowed roles check
    const allowedRoles = ["user", "shopkeeper", "deliveryBoy"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role selected." },
        { status: 400 }
      );
    }

    // Normalize email before checking duplicates
    const normalizedEmail = email.trim().toLowerCase();

    const existUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existUser) {
      return NextResponse.json(
        { message: "User already exists! Please login." },
        { status: 400 }
      );
    }

    // Validate password
    const strengthError = validatePassword(password);

    if (strengthError) {
      return NextResponse.json(
        { message: strengthError },
        { status: 400 }
      );
    }

    // Validate CNIC for shopkeeper and delivery boy
    if (role !== "user" && !/^\d{13}$/.test(String(cnicNumber || ""))) {
      return NextResponse.json(
        { message: "CNIC must contain exactly 13 digits." },
        { status: 400 }
      );
    }

    // Delivery boy required fields
    if (
      role === "deliveryBoy" &&
      (!vehicleType || !deliveryArea)
    ) {
      return NextResponse.json(
        { message: "Vehicle type and delivery area are required." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save selected role and relevant details
  console.log("REGISTER API HIT");
console.log("ROLE:", role);
console.log("CNIC:", cnicNumber);

console.log("USER MODEL FIELDS:", Object.keys(User.schema.paths));
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      mobile: String(mobile).replace(/\D/g, ""),
      role,
      ...(role !== "user" && {
        cnicNumber: String(cnicNumber).replace(/\D/g, ""),
      }),
      ...(role === "deliveryBoy" && {
        vehicleType,
        vehicleNumber: vehicleNumber || "",
        deliveryArea: deliveryArea.trim(),
      }),
    });

    console.log("REGISTER API SAVED ROLE:", user.role);

    // Do not return the password hash to the browser
    const safeUser = user.toObject();
    delete safeUser.password;

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("REGISTER API ERROR:", error);

    return NextResponse.json(
      { message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
