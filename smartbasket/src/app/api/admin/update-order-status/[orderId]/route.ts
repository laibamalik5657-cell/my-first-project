
import connectDb from "@/lib/db";
import emitEventHandler from "@/lib/emitEventHandler";
import DeliveryAssignment from "@/models/deliveryAssignment.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";


import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, params: { params: { orderId: string } }) {
    try {
    await connectDb()
    const { orderId } = params.params
    const { status } = await req.json()
    const order = await Order.findById(orderId).populate("user")
    if (!order) {
    return NextResponse.json({
    message: "order not found",
    status: 400
    })
    }
    order.status=status
    let availableDeliveryBoysPayload :any=[]
    if (status === "out of delivery" && !order.assignment) {
const {latitude,longitude}=order.address
const nearByDeliveryBoys=await User.find({
    role:"deliveryBoy",
    location:{
    $near:{
    $geometry:{type:"Point",coordinates:[Number(longitude),Number(latitude)]},
    $maxDistance:10000
    }
    }
})
// filter out busy ids (if you have a source for busyIds populate it here)
const nearByIds = nearByDeliveryBoys.map((b:any)=>b._id)
const busyIds = await DeliveryAssignment.find({
    assignedTo:{$in:nearByIds},
    status:{$in:["brodcasted", "completed"]}
}).distinct("assignedTo") as string[]
const busyIdSet = new Set<string>(busyIds.map((b:any)=>String(b)))
const availableDeliveryBoys = nearByDeliveryBoys.filter(
    (b:any) => !busyIdSet.has(String(b._id))
)
const candidates = availableDeliveryBoys.map((b:any) => b._id)

if(candidates.length === 0){
    await order.save()
await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})

    return NextResponse.json({ message: "there is no available Delivery boys" }, { status: 200 })
}

    const deliveryAssignment = await DeliveryAssignment.create({
      order: order._id,
      brodcastTo: candidates,
      status: "brodcasted"
    })

    await deliveryAssignment.populate("order")
    for(const boyId of candidates){
    const boy=await User.findById(boyId)
    if(boy.socketId){
    await emitEventHandler("new-assignment",deliveryAssignment,boy.socketId)
    }
}


    order.assignment = deliveryAssignment._id
    const deliveryBoysPayload = availableDeliveryBoys.map((b:any) => ({
      id: b._id,
      name: b.name,
      mobile: b.mobile,
      latitude: b.location.coordinates[1],
      longitude: b.location.coordinates[0]
    }))
    // save order and respond
   await deliveryAssignment.populate("order")



   await order.save()
await order.populate("user")
await emitEventHandler("order-status-update",{orderId:order._id,status:order.status})

return NextResponse.json({
    assignment: order.assignment?._id,
    availableBoys: deliveryBoysPayload
}, {status: 200})
    }

    } catch (error) {
    return NextResponse.json({
    message: `update status error ${error}`,
    }, {status: 500})
    }
}