'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  User,
  Users,
  Search,
  ShoppingCart,
  Boxes,
  ClipboardCheck,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  LayoutDashboard,
  MapPin,
  X,
  PanelLeftOpen,
  ShoppingBasket,
  ShoppingCartIcon,

} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { useRouter, usePathname } from 'next/navigation'
import ProfileModal from './ProfileModal'

interface IUser {
  _id?: string
  name?: string
  email?: string
  password?: string
  mobile?: string
  address?: string
  role?: 'user' | 'deliveryBoy' | 'admin' | 'shopkeeper'
  image?: string
}

interface IGroceryItem {
  _id: string
  title?: string
  name?: string
  category?: string
  price?: number
  image?: string
  images?: string[]
}

const publicRoutes = [
  '/signin',
  '/sign-in',
  '/login',
  '/signup',
  '/sign-up',
  '/register',
  '/welcome',
  '/select-role',
  '/select-role-mobile',
  '/selectRole',
  '/selectRoleMobile',
  '/role-selection',
  '/choose-role',
  '/edit-role-mobile',
  '/reset-password',
  '/forgot-password',
  '/unauthorized',
  '/user/order-success',
  '/order-success',
]

export default function Nav({ user: initialUser }: { user?: IUser }) {
  const { data: session } = useSession()

  const storedUser = useSelector(
    (state: RootState) => state.user.userData,
  )

  const { cartData } = useSelector(
    (state: RootState) => state.cart,
  )

  const user: IUser = storedUser?._id
    ? storedUser
    : initialUser?._id
      ? initialUser
      : (session?.user as IUser) || {}

  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [sidebarReady, setSidebarReady] = useState(false)
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<IGroceryItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [allGroceries, setAllGroceries] = useState<IGroceryItem[]>([])
  const [groceriesLoading, setGroceriesLoading] = useState(false)

  const profileDropDownRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const wasPublicRoute = useRef<boolean | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  const normalizedPath =
    (pathname || '/').replace(/\/+$/, '') || '/'

  const isSelectRoleScreen =
    normalizedPath === '/' &&
    (!user.mobile || !user.role)

  const isPublicRoute =
    isSelectRoleScreen ||
    publicRoutes.some((route) => {
      const normalizedRoute = route.replace(/\/+$/, '')

      return (
        normalizedPath === normalizedRoute ||
        normalizedPath.startsWith(`${normalizedRoute}/`)
      )
    })

  // Sirf Dashboard ( Home / ) par Top Nav dikhana hai
  const isDashboardPage = normalizedPath === '/' && !isSelectRoleScreen

  const role = String(user.role || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '')

  const isCustomer = role === 'user' || role === 'customer'
  const isAdmin = role === 'admin'
  const isShopkeeper = role === 'shopkeeper'
  const isDelivery = ['deliveryboy', 'delivery'].includes(role)

  useEffect(() => {
    if (isPublicRoute) {
      document.body.classList.remove(
         'bg-linear-to-b',
  'from-[#dcfce7]',
  'to-white',
  'bg-gradient-to-b',
  'from-green-100'
      )

      document.body.dataset.smartbasketLayout = 'public'
      document.body.dataset.smartbasketSidebar = 'closed'
      document.body.dataset.smartbasketNavbar = 'none'

      setSidebarVisible(false)
      setSidebarReady(true)
      wasPublicRoute.current = true
      return
    }

    const justEnteredPrivate = wasPublicRoute.current === true
    const savedState = localStorage.getItem('sidebar_visible')

    const isOpen =
      justEnteredPrivate || savedState === null
        ? true
        : savedState === 'true'

    if (justEnteredPrivate || savedState === null) {
      localStorage.setItem('sidebar_visible', 'true')
    }

    document.body.dataset.smartbasketLayout = 'private'
    document.body.dataset.smartbasketSidebar = isOpen
      ? 'open'
      : 'closed'

    // Navbar ka track taaki CSS se top padding sahi set ho sake
    document.body.dataset.smartbasketNavbar = isDashboardPage ? 'has-nav' : 'no-nav'

  
document.body.classList.remove(
  'bg-gradient-to-b',
  'from-green-100'
)

document.body.classList.add(
  'bg-linear-to-b',
  'from-[#dcfce7]',
  'to-white'
)


    setSidebarVisible(isOpen)
    setSidebarReady(true)
    wasPublicRoute.current = false
  }, [pathname, isPublicRoute, isDashboardPage])

  const toggleSidebar = () => {
    if (isPublicRoute) return

    const next = !sidebarVisible

    setSidebarVisible(next)
    localStorage.setItem('sidebar_visible', String(next))

    document.body.dataset.smartbasketLayout = 'private'
    document.body.dataset.smartbasketSidebar = next
      ? 'open'
      : 'closed'
  }

  useEffect(() => {
    if (isPublicRoute || !isCustomer) {
      setAllGroceries([])
      setGroceriesLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchGroceries() {
      setGroceriesLoading(true)

      try {
        const response = await fetch('/api/groceries', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Groceries API failed: ${response.status}`)
        }

        const data = await response.json()

        const payload =
          data?.items ??
          data?.groceries ??
          data?.products ??
          data?.groceryList ??
          data?.data?.items ??
          data?.data?.groceries ??
          data?.data ??
          data

        const rawItems = Array.isArray(payload) ? payload : []

        const normalizedItems: IGroceryItem[] = rawItems
          .filter(
            (item: any) =>
              item &&
              typeof item._id === 'string' &&
              (typeof item.name === 'string' ||
                typeof item.title === 'string'),
          )
          .map((item: any) => ({
            _id: item._id,
            name: item.name || item.title || '',
            title: item.title || item.name || '',
            category: item.category || '',
            price: item.price,
            image: item.image || item.images?.[0] || '',
            images: item.images || [],
          }))

        setAllGroceries(normalizedItems)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Navbar search error:', error)
          setAllGroceries([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setGroceriesLoading(false)
        }
      }
    }

    void fetchGroceries()

    return () => controller.abort()
  }, [isPublicRoute, isCustomer])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropDownRef.current &&
        !profileDropDownRef.current.contains(e.target as Node)
      ) {
        setOpenProfileDropdown(false)
      }

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const matched = allGroceries.filter((item) => {
      const name = (item.name || item.title || '')
        .trim()
        .toLowerCase()

      const category = (item.category || '')
        .trim()
        .toLowerCase()

      return name.includes(query) || category.includes(query)
    })

    setSuggestions(matched.slice(0, 8))
    setShowSuggestions(true)
  }, [search, allGroceries])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

    const query = search.trim()

    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`)
    }
  }

  const handleSelectSuggestion = (itemName: string) => {
    setSearch(itemName)
    setShowSuggestions(false)
    router.push(`/?q=${encodeURIComponent(itemName)}`)
  }

  const isActiveRoute = (path: string) => {
    return path === '/'
      ? normalizedPath === '/'
      : normalizedPath === path ||
          normalizedPath.startsWith(`${path}/`)
  }

  const linkClass = (path: string) => {
    const active = isActiveRoute(path)
    return `group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 font-semibold text-sm transition-all duration-300 ease-in-out active:scale-[0.97] hover:scale-[1.02] ${
      active
        ? 'bg-[#dcfce7] text-[#00c853] shadow-sm'
        : 'text-slate-600 hover:bg-emerald-50/70 hover:text-[#00c853]'
    }`
  }

  const firstLetter = (user.name || 'U').charAt(0).toUpperCase()

  if (isPublicRoute) return null

  return (
    <>
      {/* Top Navbar: Sirf Dashboard page par dikhega */}
      {isDashboardPage && (
        <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between bg-[#00c853] px-4 text-white shadow-md sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white transition-transform duration-200 hover:scale-105"
          >
            SmartBasket
          </Link>

          {isCustomer && (
            <div
              ref={searchContainerRef}
              className="relative hidden w-1/3 max-w-md lg:block"
            >
              <form
                onSubmit={handleSearch}
                className="relative flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm"
              >
                <Search className="mr-2 h-4 w-4 flex-shrink-0 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search groceries..."
                  autoComplete="off"
                  className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => {
                    if (search.trim()) setShowSuggestions(true)
                  }}
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearch('')
                      setSuggestions([])
                      setShowSuggestions(false)
                    }}
                    className="ml-2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </form>

              {showSuggestions && search.trim() && (
                <div className="absolute left-0 right-0 top-12 z-[9999] max-h-[300px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-2xl">
                  {suggestions.length > 0 ? (
                    suggestions.map((item) => {
                      const displayName =
                        item.name || item.title || 'Product'

                      return (
                        <button
                          key={item._id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            handleSelectSuggestion(displayName)
                          }
                          className="flex w-full items-center gap-3 rounded-lg border-b border-slate-100 p-2 text-left transition-colors last:border-0 hover:bg-emerald-50"
                        >
                          {item.image ? (
                            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                              <Image
                                src={item.image}
                                alt={displayName}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <Boxes className="h-5 w-5 flex-shrink-0 text-[#00c853]" />
                          )}

                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold">
                              {displayName}
                            </p>

                            {item.category && (
                              <p className="truncate text-xs text-slate-400">
                                {item.category}
                              </p>
                            )}
                          </div>

                          {item.price !== undefined && (
                            <span className="text-xs font-bold text-[#00c853]">
                              Rs. {item.price.toLocaleString('en-PK')}
                            </span>
                          )}
                        </button>
                      )
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500">
                      {groceriesLoading
                        ? 'Loading groceries...'
                        : 'No matching products found'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            {isCustomer && (
              <Link
                href="/user/cart"
                aria-label="Cart"
                className="relative rounded-full p-2 transition hover:bg-[#00b048]"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {cartData?.length || 0}
                </span>
              </Link>
            )}

            <div ref={profileDropDownRef} className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenProfileDropdown((prev) => !prev)
                }
                aria-label="Open profile menu"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white bg-[#00b048] transition-transform duration-300 ease-in-out hover:scale-105"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </button>

              {openProfileDropdown && (
                <div className="absolute right-0 z-[100] mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="mb-1 border-b border-slate-100 p-2">
                    <p className="truncate text-sm font-bold">
                      {user.name}
                    </p>
                    <p className="text-xs font-medium capitalize text-[#00c853]">
                      {user.role}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenProfileDropdown(false)
                      setShowProfileModal(true)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/signin' })}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Sidebar */}
      {sidebarReady && (
        <aside
          aria-hidden={!sidebarVisible}
          className={`fixed bottom-0 left-0 z-40 flex w-60 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-100 bg-white px-4 py-5 shadow-sm transition-all duration-300 ease-in-out motion-reduce:transition-none ${
            isDashboardPage ? 'top-16' : 'top-0'
          } ${
            sidebarVisible
              ? 'translate-x-0'
              : '-translate-x-full pointer-events-none'
          }`}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title="Close sidebar"
            aria-label="Close sidebar"
            tabIndex={sidebarVisible ? 0 : -1}
            className="absolute right-3 top-3 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-red-50 hover:text-red-500 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Logo Section - Green Color & Shopping Basket Icon */}
          <div className="mb-4 flex items-center gap-2.5 px-1">
          <div className="mb-4 flex items-center gap-3 px-1">
  <ShoppingCart className="h-6 w-6 text-[#00c853] shrink-0" />
  <span className="font-bold text-xl text-green-500 tracking-tight">SmartBasket</span>
</div>
           
          </div>

          {/* User Info Card */}
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#e8f5e9]/70 p-3 shadow-xs transition-all duration-300 hover:bg-[#e8f5e9]">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100 text-[#00c853]">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-[#00c853]" />
              )}
            </div>

            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-800">
                {user.name || 'User'}
              </p>
              <span className="inline-block rounded-md bg-[#00c853]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00c853]">
                {user.role || 'User'}
              </span>
            </div>
          </div>

          {/* Main Navigation Menu */}
          <div className="flex-1 space-y-1">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              User Profile
            </p>

            {isCustomer && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <Boxes className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Home / Groceries</span>
                </Link>

                <Link href="/user/cart" className={linkClass('/user/cart')}>
                  <ShoppingCart className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Cart</span>
                  {!!cartData?.length && (
                    <span className="ml-auto rounded-full bg-[#00c853] px-2 py-0.5 text-[10px] font-bold text-white">
                      {cartData.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="/user/my-orders"
                  className={linkClass('/user/my-orders')}
                >
                  <Package className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>My Orders</span>
                </Link>

                <Link
                  href="/user/order-tracking"
                  className={linkClass('/user/order-tracking')}
                >
                  <MapPin className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Track Order</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/admin/view-grocery"
                  className={linkClass('/admin/view-grocery')}
                >
                  <Boxes className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>View Grocery</span>
                </Link>

                <Link
                  href="/admin/manage-orders"
                  className={linkClass('/admin/manage-orders')}
                >
                  <ClipboardCheck className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Manage Orders</span>
                </Link>

                <Link
                  href="/admin/users"
                  className={linkClass('/admin/users')}
                >
                  <Users className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Users</span>
                </Link>
              </>
            )}

            {isShopkeeper && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/admin/add-grocery"
                  className={linkClass('/admin/add-grocery')}
                >
                  <PlusCircle className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Add Grocery</span>
                </Link>

                <Link
                  href="/admin/view-grocery"
                  className={linkClass('/admin/view-grocery')}
                >
                  <Boxes className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>View Grocery</span>
                </Link>
              </>
            )}

            {isDelivery && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/delivery/my-deliveries"
                  className={linkClass('/delivery/my-deliveries')}
                >
                  <Package className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>My Deliveries</span>
                </Link>

                <Link
                  href="/delivery/order-tracking"
                  className={linkClass('/delivery/order-tracking')}
                >
                  <MapPin className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span>Track Order</span>
                </Link>
              </>
            )}

            {/* Account Section */}
            <div className="mt-5 space-y-1 pt-3">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Account
              </p>

              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-600 transition-all duration-300 ease-in-out active:scale-[0.97] hover:scale-[1.02] hover:bg-emerald-50/70 hover:text-[#00c853]"
              >
                <User className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/user/settings')}
                className="group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-600 transition-all duration-300 ease-in-out active:scale-[0.97] hover:scale-[1.02] hover:bg-emerald-50/70 hover:text-[#00c853]"
              >
                <Settings className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Bottom Logout Option */}
          <div className="flex-shrink-0 pt-4">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="group flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-sm font-bold text-slate-600 transition-all duration-300 ease-in-out hover:bg-red-50 hover:text-red-500 active:scale-[0.97]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white transition-all duration-300 group-hover:bg-red-500">
                {firstLetter}
              </div>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Toggle Open Button */}
      {sidebarReady && !sidebarVisible && (
        <button
          type="button"
          onClick={toggleSidebar}
          title="Open sidebar"
          aria-label="Open sidebar"
          className={`fixed left-3 z-[60] flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-emerald-50 hover:text-[#00c853] active:scale-95 motion-reduce:transition-none ${
            isDashboardPage ? 'top-20' : 'top-4'
          }`}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {showProfileModal && (
        <ProfileModal
          user={user as any}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      <style jsx global>{`
        html,
        body {
          overflow-x: clip;
        }

        aside::-webkit-scrollbar {
          width: 5px;
        }

        aside::-webkit-scrollbar-thumb {
          background: #d1fae5;
          border-radius: 999px;
        }

        aside::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Private Layout - Jab Dashboard (Navbar) ho tab padding-top 4.5rem */
        body[data-smartbasket-layout='private'][data-smartbasket-navbar='has-nav'] .smartbasket-main {
          box-sizing: border-box;
          padding-top: 4.5rem !important;
          margin-left: 0;
          width: 100%;
          min-width: 0;
          transition:
            margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1),
            width 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Private Layout - Jab Baki Pages hon (Bina Navbar) tab padding-top 1.5rem */
        body[data-smartbasket-layout='private'][data-smartbasket-navbar='no-nav'] .smartbasket-main {
          box-sizing: border-box;
          padding-top: 1.5rem !important;
          margin-left: 0;
          width: 100%;
          min-width: 0;
          transition:
            margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1),
            width 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        body[data-smartbasket-layout='private'][data-smartbasket-sidebar='open']
          .smartbasket-main {
          margin-left: 15rem;
          width: calc(100% - 15rem);
        }

        body[data-smartbasket-layout='private'][data-smartbasket-sidebar='closed']
          .smartbasket-main {
          margin-left: 0;
          width: 100%;
        }

        body[data-smartbasket-layout='public'] .smartbasket-main {
          margin-left: 0;
          width: 100%;
          padding-top: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          body[data-smartbasket-layout='private'] .smartbasket-main {
            transition: none;
          }
        }
      `}</style>
    </>
  )
}