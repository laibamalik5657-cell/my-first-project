import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

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

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { role, mobile },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { user, message: "Role updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Edit role and mobile error: ${error}` },
      { status: 500 }
    );
  }
}