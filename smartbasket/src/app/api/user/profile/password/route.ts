import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

// Regex for Pakistani mobile numbers: 03001234567, +923001234567, 923001234567
const PK_MOBILE_REGEX = /^((\+92)|(92)|(0))3\d{9}$/;

export async function PUT(req: NextRequest) {
    try {
        await connectDb();
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { name, mobile, address } = await req.json();

        // 1. Name validation
        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { message: "Name must be at least 2 characters" },
                { status: 400 }
            );
        }

        // 2. Strict Pakistani Mobile Number Validation
        if (!mobile || !PK_MOBILE_REGEX.test(mobile.trim())) {
            return NextResponse.json(
                { message: "Invalid mobile number. Only valid Pakistani phone numbers are allowed (e.g., 03001234567 or +923001234567)." },
                { status: 400 }
            );
        }

        // 3. User update logic
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        user.name = name.trim();
        user.mobile = mobile.trim();
        if (address !== undefined) {
            user.address = address.trim();
        }

        await user.save();

        // Pass updated user data without sensitive fields
        const updatedUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            address: user.address,
            role: user.role,
            image: user.image,
        };

        return NextResponse.json(
            { message: "Profile updated successfully", user: updatedUser },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: `Profile update error: ${error}` },
            { status: 500 }
        );
    }
}