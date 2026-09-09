import React from 'react'
import DeliveryBoyDashboard from './DeliveryBoyDashboard'
import { auth } from '@/auth'
import Order from '@/models/order.model'
import connectDb from '@/lib/db'

async function DeliveryBoy() {
  await connectDb()
  const session=await auth()
  const deliveryBoyId=session?.user?.id
  const orders=await Order.find({
    assignedDeliveryBoy:deliveryBoyId,
    deliveryOtpVerification:true
  })

  const today=new Date().toDateString()
const todayOrders=orders.filter((o)=>new Date(o.deliveredAt).toDateString()===today).length
const todayEarning=todayOrders * 40

return (
  <>
    <DeliveryBoyDashboard earning={todayEarning}/>
    </>
  )
}

export default DeliveryBoy