"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Boxes,
  ClipboardCheck,
  Users,
  UserCircle,
  LogOut,
} from "lucide-react"

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "View Grocery",
    href: "/admin/view-grocery",
    icon: Boxes,
  },
  {
    name: "Manage Orders",
    href: "/admin/manage-orders",
    icon: ClipboardCheck,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-24 z-40 h-[calc(100vh-6rem)] w-64 bg-white border border-gray-200 rounded-tr-2xl shadow-md flex flex-col">

      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-green-700">
          SmartBasket
        </h1>

        <p className="text-xs text-gray-400 mt-1">
          Management
        </p>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="px-3 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Menu
        </p>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon

            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-green-100 text-green-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-green-700"
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <p className="px-3 mt-8 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Account
        </p>

        <Link
          href="/admin/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            pathname.startsWith("/admin/profile")
              ? "bg-green-100 text-green-700 font-semibold"
              : "text-gray-600 hover:bg-gray-50 hover:text-green-700"
          }`}
        >
          <UserCircle size={20} />
          <span>Profile</span>
        </Link>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}