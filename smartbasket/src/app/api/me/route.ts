import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { message: "user is not authenticated" },
                { status: 400 }
            );
        }

        const user = session.user;
        if (!user) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            user,
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { message: `get me error : ${error}` },
            { status: 500 }
        );
    }
}

