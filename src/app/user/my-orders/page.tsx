'use client'
import axios from 'axios';
import { ArrowLeft, Package ,PackageSearch } from 'lucide-react'
import { useRouter } from 'next/navigation';
import React from 'react'
import {useEffect, useState} from 'react';
import {motion} from 'motion/react';
import UserOrderCard from '@/components/UserOrderCard';
import mongoose from 'mongoose';
import { IUser } from '@/models/user.model';
import { getSocket } from '@/lib/socket';
interface IOrder {
    _id?: string
    user: string
    items: Array<{
        grocery: string,
        name: string,
        price: string,
        unit: string,
        image: string,
        quantity: number
    }>
    isPaid?: boolean
    totalAmount?: string,
    paymentMethod: "cod" | "online"

    address: {
        fullName: string,
        mobile: string,
        city: string,
        state: string,
        pincode: string,
        fullAddress: string,
        latitude?: number,
        longitude?: number
    }
    assignment?: mongoose.Types.ObjectId
    assignedDeliveryBoy?: IUser;
    status: "pending" | "out of delivery" | "delivered",
    createdAt?: string | Date
    updatedAt?: string | Date
}

function MyOrder() {
    const router=useRouter()
    const [orders, setOrders] = useState<IOrder[]>([])
    const [loading,setLoading] = useState(true)

    useEffect(() => {
        const getMyOrders = async () => {
            try {
                const result = await axios.get("/api/user/my-orders");
                const normalizedOrders = ((result.data ?? []) as any[]).map((order) => ({
                    ...order,
                    _id: order?._id ? String(order._id) : undefined,
                })) as IOrder[];

                setOrders(normalizedOrders)
                setLoading(false)
            } catch (error) {
                console.error(error);
                setLoading(false)
            }
        };

        getMyOrders();
    }, []);

useEffect(()=>{
  const socket = getSocket()
  socket.on("order-assigned", ({orderId, assignedDeliveryBoy}) => {
    setOrders((prev) => prev.map((o) => (
      o._id === orderId ? { ...o, assignedDeliveryBoy } : o
    )))
  })

  return () => { socket.off("order-assigned") }
}, [])






if (loading) {
    return <div className='flex items-center justify-center min-h-[50vh] text-gray-600'>Loading Your Orders....
        </div>
    
}

    return (
        <div className='bg-linear-to-bg-white to-gray-100 min-h-screen w-full'>
            <div className='max-w-3xl mx-auto px-4 pt-16 pb-10 relative'>
                <div className='fixed top-0 left-0 w-full backdrop-blur-1g bg-white/70 shadow-sm border-b z-50'>
                    <div className='max-w-3xl mx-auto flex items-center gap-4 px-4 py-3'>
                        <button className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition'
                         onClick={()=>router.push("/")}>
                            <ArrowLeft size={24} className="text-green-700" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">My Orders</h1>
                    </div>
                </div>

          {orders?.length === 0 ? (
  <div className='pt-20 flex flex-col items-center text-center'>
    <PackageSearch size={70} className="text-green-600 mb-4" />
    <h2 className='text-xl font-semibold text-gray-700'>No Orders Found</h2>
    <p className='text-gray-500 text-sm mt-1'>Start shopping to view your orders here.</p>
  </div>
) : (

  <div className='mt-4 space-y-6'>
    {orders?.map((order,index) => (
      <motion.div key={index}
      initial={{ opacity: 0, scale: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
      >
        <UserOrderCard order={order} />
      </motion.div>
    ))}
  </div>
)}
            </div>
        </div>
    )
}

export default MyOrder