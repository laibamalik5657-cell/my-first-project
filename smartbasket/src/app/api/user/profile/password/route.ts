import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

/**
 * Valid Pakistani Mobile Operator Prefixes:
 * - Jazz / Warid: 0300-0309, 0320-0328
 * - Zong: 0310-0318, 0370
 * - Ufone: 0330-0337
 * - Telenor: 0340-0349
 * - Special / SCO: 0355, 0364
 */
const PK_MOBILE_REGEX =
    /^03(?:0[0-9]|1[0-8]|2[0-8]|3[0-7]|4[0-9]|55|64)\d{7}$/;

export async function PUT(req: NextRequest) {
    try {
        await connectDb();

        const session = await auth();

        // Check authentication
        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();

        const name =
            typeof body.name === "string" ? body.name.trim() : "";

        const mobile =
            typeof body.mobile === "string" ? body.mobile.trim() : "";

        const address =
            typeof body.address === "string" ? body.address.trim() : "";

        // -------------------------
        // 1. Name Validation
        // -------------------------
        if (!name || name.length < 2) {
            return NextResponse.json(
                { message: "Name must be at least 2 characters." },
                { status: 400 }
            );
        }

        // -------------------------
        // 2. Mobile Validation
        // -------------------------

        // Must contain digits only
        if (!/^\d+$/.test(mobile)) {
            return NextResponse.json(
                { message: "Mobile number must contain digits only." },
                { status: 400 }
            );
        }

        // Must be exactly 11 digits
        if (mobile.length !== 11) {
            return NextResponse.json(
                { message: "Mobile number must contain exactly 11 digits." },
                { status: 400 }
            );
        }

        // Must match a valid Pakistani mobile network prefix
        if (!PK_MOBILE_REGEX.test(mobile)) {
            return NextResponse.json(
                {
                    message:
                        "Please enter a valid Pakistani mobile number (e.g., 03001234567)."
                },
                { status: 400 }
            );
        }

        // Reject repeated dummy numbers in subscriber part (e.g. 03333333333, 03000000000)
        const subscriberPart = mobile.slice(4);
        if (/^(\d)\1{6}$/.test(subscriberPart)) {
            return NextResponse.json(
                { message: "Please enter a valid Pakistani mobile number." },
                { status: 400 }
            );
        }

        // -------------------------
        // 3. Find User
        // -------------------------
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { message: "User not found." },
                { status: 404 }
            );
        }

        // -------------------------
        // 4. Update User
        // -------------------------
        user.name = name;
        user.mobile = mobile;

        if (body.address !== undefined) {
            user.address = address;
        }

        await user.save();

        // -------------------------
        // 5. Safe Response
        // -------------------------
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
            {
                message: "Profile updated successfully.",
                user: updatedUser,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Profile update error:", error);

        return NextResponse.json(
            { message: "An error occurred while updating the profile." },
            { status: 500 }
        );
    }
}