import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

const SELF_ASSIGNABLE_ROLES = [
  "user",
  "deliveryBoy",
  "shopkeeper",
  "admin",
] as const;

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const { role, mobile } = await req.json();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const existingUser = await User.findById(session.user.id);

    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Profile already completed
    if (existingUser.mobile) {
      return NextResponse.json(
        {
          message:
            "Your profile is already set up. Contact an admin to change your role.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------
    // ADMIN CHECK
    // ------------------------------------------------
    // If someone is trying to become Admin,
    // check whether an Admin already exists.
    if (role === "admin") {
      const adminAlreadyExists = await User.findOne({
        role: "admin",
      });

      // If Admin already exists, do NOT allow another Admin
      if (adminAlreadyExists) {
        return NextResponse.json(
          {
            message: "Admin already exists. Please choose another role.",
          },
          { status: 403 }
        );
      }
    }

    // Preserve role if it was already assigned by an admin
    const nextRole =
      existingUser.role === "user"
        ? role
        : existingUser.role;

    // Check valid roles
    if (
      existingUser.role === "user" &&
      !SELF_ASSIGNABLE_ROLES.includes(nextRole)
    ) {
      return NextResponse.json(
        {
          message:
            "Choose User, Delivery Boy, Shopkeeper, or Admin",
        },
        { status: 403 }
      );
    }

    // Check mobile
    if (
      typeof mobile !== "string" ||
      !/^\d{10,15}$/.test(mobile)
    ) {
      return NextResponse.json(
        { message: "Enter a valid mobile number" },
        { status: 400 }
      );
    }

    // Save role + mobile
    const user = await User.findOneAndUpdate(
      {
        _id: existingUser._id,
        role: existingUser.role,
        mobile: existingUser.mobile,
        isActive: { $ne: false },
      },
      {
        role: nextRole,
        mobile,
      },
      {
        returnDocument: "after",
      }
    ).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Your profile changed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        user,
        message: "Role updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Edit role and mobile error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while saving your profile.",
      },
      { status: 500 }
    );
  }
}