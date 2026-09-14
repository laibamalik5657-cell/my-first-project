import { auth } from '@/auth'
import AdminDashboard from '@/components/AdminDashboard'
import DeliveryBoy from '@/components/DeliveryBoy'
import EditRoleMobile from '@/components/EditRoleMobile'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import Footer from "@/components/Footer";
import connectDb from '@/lib/db'
import Grocery, { IGrocery } from '@/models/grocery.model'
import User from '@/models/user.model'
import { redirect } from 'next/navigation'
import React from 'react'

async function Home(props: {
    searchParams: Promise<{
        q?: string
    }>
}) {
    const searchParams = await props.searchParams

    await connectDb()
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await User.findById(session.user.id).lean()

    if (!user) {
        redirect("/login")
    }

    const inComplete = !user.mobile || !user.role || (!user.mobile && user.role === "user")

    if (inComplete) {
        return <EditRoleMobile />
    }

    const plainUser = JSON.parse(JSON.stringify(user))
    let groceryList: IGrocery[] = []
    const NavComponent = Nav as React.ComponentType<any>

    if (user.role === "user") {
        let rawGroceryList: any[]  = []
        if (searchParams?.q) {
            rawGroceryList = await Grocery.find({
                $or: [
                    { name: { $regex: searchParams.q, $options: "i" } },
                    { category: { $regex: searchParams.q, $options: "i" } },
                ]
            }).lean()
        } else {
            rawGroceryList = await Grocery.find({}).lean()
        }

        
        groceryList = JSON.parse(JSON.stringify(rawGroceryList))
    }

    return (
        <>
            <NavComponent user={plainUser} />
            <GeoUpdater userId={plainUser?._id} />
            {user.role === "user" ? (
                <UserDashboard groceryList={groceryList} />
            ) : user.role === "admin" ? (
                <AdminDashboard />
            ) : (
                <DeliveryBoy />
            )}
            <Footer />
        </>
    )
}

export default Home