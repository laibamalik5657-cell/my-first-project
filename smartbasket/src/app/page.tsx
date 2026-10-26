
import { auth } from '@/auth'
import AdminDashboard from '@/components/AdminDashboard'
import ShopkeeperDashboard from '@/components/ShopkeeperDashboard'
import DeliveryBoy from '@/components/DeliveryBoy'
import GeoUpdater from '@/components/GeoUpdater'
import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import Footer from '@/components/Footer'
import connectDb from '@/lib/db'
import Grocery from '@/models/grocery.model'
import User from '@/models/user.model'
import { DEFAULT_PAGE_SIZE, sellableFilter } from '@/lib/grocery'
import React from 'react'

type HomeProps = {
  searchParams: Promise<{
    q?: string
    category?: string
  }>
}

async function Home(props: HomeProps) {
  const searchParams = await props.searchParams

  const q = searchParams.q ?? ''
  const category = searchParams.category ?? ''

  await connectDb()

  const session = await auth()

  const user = session?.user?.id
    ? await User.findById(session.user.id).lean()
    : null

  console.log('SESSION ROLE:', session?.user?.role)
  console.log('DATABASE USER ROLE:', user?.role)

  const plainUser = user
    ? JSON.parse(JSON.stringify(user))
    : null

  let groceryList: any[] = []
  let total = 0

  // Public visitors aur customers ke liye groceries load karo.
  if (!user || user.role === 'user') {
    const filter: Record<string, any> = {
      ...sellableFilter,
    }

    if (category) {
      filter.category = category
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ]
    }

    const [rawGroceryList, count] = await Promise.all([
      Grocery.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(DEFAULT_PAGE_SIZE)
        .lean(),

      Grocery.countDocuments(filter),
    ])

    groceryList = JSON.parse(JSON.stringify(rawGroceryList))
    total = count
  }

  const NavComponent = Nav as React.ComponentType<any>

  const isCustomer = !user || user.role === 'user'

  return (
    <div className="flex min-h-screen flex-col">
      <NavComponent user={plainUser} />

      <GeoUpdater userId={plainUser?._id} />

      <main className="flex flex-1 flex-col">
        {isCustomer ? (
          <UserDashboard
            groceryList={groceryList}
            hasMore={total > groceryList.length}
            total={total}
            q={q}
            category={category}
          />
        ) : user.role === 'admin' ? (
          <AdminDashboard />
        ) : user.role === 'shopkeeper' ? (
          <ShopkeeperDashboard />
        ) : user.role === 'deliveryBoy' ? (
          <DeliveryBoy />
        ) : (
          <UserDashboard
            groceryList={groceryList}
            hasMore={total > groceryList.length}
            total={total}
            q={q}
            category={category}
          />
        )}
      </main>

      {isCustomer ? (
        <Footer />
      ) : (
        <footer className="mt-auto w-full border-t border-green-200 bg-green-50 px-4 py-3 text-center text-xs text-green-700">
          © {new Date().getFullYear()}{' '}
          <span className="font-semibold text-green-800">
            SmartBasket
          </span>
          . All rights reserved.
        </footer>
      )}
    </div>
  )
}

export default Home
