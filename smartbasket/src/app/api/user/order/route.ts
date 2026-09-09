import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Order from "@/models/order.model";

import { NextRequest, NextResponse } from "next/server";
import emitEventHandler from "@/lib/emitEventHandler";

export async function POST(req: NextRequest) {
    try {
        await connectDb()
        const { userId, items, paymentMethod, totalAmount, address } = await req.json()
        
        if (!items || !userId || !paymentMethod || !totalAmount || !address) {
            return NextResponse.json(
                { error: "Please send all credentials" },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        } 


        // Create new order
        const newOrder = await Order.create({
            user: userId,
            items,
            paymentMethod,
            totalAmount,
            address,
           
        })

await emitEventHandler("new-order", newOrder)

        return NextResponse.json(
           newOrder,
            { status: 201 }
        )

    } catch (error) {
        return NextResponse.json(
            { message : `place order error ${error}` },
            { status: 500 }
        )
    }
}