import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { userId, location } = await req.json()
        
        if (!userId || !location) {
            return NextResponse.json({
                message: "Missing userId or location"
            }, { status: 400 })
        }

        // Update user's location
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                "location.latitude": location.latitude,
                "location.longitude": location.longitude,
                isOnline: true 
            },
            { new: true }
        )

        if (!user) {
            return NextResponse.json({
                message: "User not found"
            }, { status: 400 })
        }

        return NextResponse.json({
            
            message: "Location updated",
            user
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({
            message: `update location error ${error}`
        }, { status: 500 })
    }
}