import { auth } from "@/auth";
import connectDb from "@/lib/db";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import { dispatchOrder } from "@/lib/dispatch";
import { NextRequest, NextResponse } from "next/server";


export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDb()
        const session = await auth()
        const deliveryBoyId = session?.user?.id

        if (!deliveryBoyId || session?.user?.role !== "deliveryBoy") {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 })
        }

        const { id } = await context.params
        const assignment = await DeliveryAssignment.findById(id)
        if (!assignment) {
            return NextResponse.json({ message: "assignment not found" }, { status: 404 })
        }
        if (assignment.status !== "broadcasted") {
            return NextResponse.json({ message: "this assignment is no longer open" }, { status: 409 })
        }
        if (!assignment.brodcastedTo.some((b: any) => String(b) === String(deliveryBoyId))) {
            return NextResponse.json({ message: "this assignment was not offered to you" }, { status: 403 })
        }

        const remaining = assignment.brodcastedTo
            .map((b: any) => String(b))
            .filter((b: string) => b !== String(deliveryBoyId)).length

    
        await DeliveryAssignment.updateOne(
            { _id: assignment._id },
            {
                $pull: { brodcastedTo: deliveryBoyId },
                $addToSet: { rejectedBy: deliveryBoyId },
            }
        )

        if (remaining > 0) {
           
            return NextResponse.json(
                { message: "Assignment rejected", reBroadcast: false },
                { status: 200 }
            )
        }

     
        const order = await Order.findById(assignment.order)
        if (!order) {
            return NextResponse.json({ message: "order not found" }, { status: 404 })
        }

      
        const { assignment: reDispatched } = await dispatchOrder(order)

        return NextResponse.json(
            {
                message: reDispatched
                    ? "Assignment rejected and offered to another rider"
                    : "Assignment rejected. No other rider is available right now.",
                reBroadcast: Boolean(reDispatched),
            },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json({ message: `reject assignment error ${error}` }, { status: 500 })
    }
}
