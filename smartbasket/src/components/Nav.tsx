'use client';

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
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { useRouter, usePathname } from 'next/navigation'
import ProfileModal from './ProfileModal'

interface IUser {
  _id?:string;
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  role: "user" | "deliveryBoy" | "admin";
  image?: string;
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
    
const [readyPath, setReadyPath] = useState(pathname)

useEffect(() => {
  const timer = window.setTimeout(() => {
    setReadyPath(pathname)
  }, 250)

  return () => window.clearTimeout(timer)
}, [pathname])

const routeReady = readyPath === pathname


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
    const showNavOnlyOnDashboard =
  normalizedPath === '/' && !isSelectRoleScreen

  const role = String(user.role || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '')

  const isCustomer = role === 'user' || role === 'customer'
  const isAdmin = role === 'admin'
  const isShopkeeper = role === 'shopkeeper'
  const isDelivery = ['deliveryboy', 'delivery'].includes(role)

  // Public pages have no navbar/sidebar.
  // Entering the private area from a public page opens the sidebar.
  // On a first private-page visit, the sidebar also defaults to open.
 
useEffect(() => {
  if (isPublicRoute) {
    document.body.classList.remove(
      'bg-gradient-to-b',
      'from-green-100',
      'to-white'
    )

    document.body.dataset.smartbasketLayout = 'public'
    document.body.dataset.smartbasketSidebar = 'closed'

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

  // Gradient sirf private pages par
  document.body.classList.add(
    'bg-gradient-to-b',
    'from-green-100',
    'to-white'
  )

  setSidebarVisible(isOpen)
  setSidebarReady(true)
  wasPublicRoute.current = false
}, [pathname, isPublicRoute])

  

  // Keep the body layout synchronized with the current sidebar state.
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

  // Fetch groceries for customer search suggestions.
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

  // Close profile dropdown and suggestions when clicking outside.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Match products by name, title, and category.
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

  const linkClass = (path: string) =>
    `flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 ${
      isActiveRoute(path)
        ? 'bg-[#e8f5e9] font-bold text-[#00c853]'
        : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00c853]'
    }`

  // Do not render navbar/sidebar on public pages.



  return (
    <>
      {/* Top navbar */}
      {normalizedPath === '/' && (
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between bg-[#00c853] px-4 text-white shadow-md sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white"
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
              <div className="absolute right-0 z-[100] mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">
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
      </nav> )}
      
      {/* Sidebar */}
          
      {sidebarReady && (
        <aside
          aria-hidden={!sidebarVisible}
          className={`fixed bottom-0 left-0 top-16 z-40 flex w-60 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-sm transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
            sidebarVisible
              ? 'translate-x-0'
              : '-translate-x-full pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            title="Close sidebar"
            aria-label="Close sidebar"
            tabIndex={sidebarVisible ? 0 : -1}
            className="absolute right-2 top-2 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 flex flex-shrink-0 items-center gap-3 rounded-xl bg-slate-50 p-2 pr-10">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e8f5e9] font-bold text-[#00c853]">
              <User className="h-4 w-4" />
            </div>

            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-slate-800">
                {user.name}
              </p>
              <p className="truncate text-[10px] capitalize text-slate-400">
                {user.role}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-1 text-sm font-medium">
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu
            </p>

            {isCustomer && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <Boxes className="h-5 w-5 flex-shrink-0" />
                  <span>Home / Groceries</span>
                </Link>

                <Link href="/user/cart" className={linkClass('/user/cart')}>
                  <ShoppingCart className="h-5 w-5 flex-shrink-0" />
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
                  <Package className="h-5 w-5 flex-shrink-0" />
                  <span>My Orders</span>
                </Link>

                <Link
                  href="/user/order-tracking"
                  className={linkClass('/user/order-tracking')}
                >
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  <span>Track Order</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/admin/view-grocery"
                  className={linkClass('/admin/view-grocery')}
                >
                  <Boxes className="h-5 w-5 flex-shrink-0" />
                  <span>View Grocery</span>
                </Link>

                <Link
                  href="/admin/manage-orders"
                  className={linkClass('/admin/manage-orders')}
                >
                  <ClipboardCheck className="h-5 w-5 flex-shrink-0" />
                  <span>Manage Orders</span>
                </Link>

                <Link
                  href="/admin/users"
                  className={linkClass('/admin/users')}
                >
                  <Users className="h-5 w-5 flex-shrink-0" />
                  <span>Users</span>
                </Link>

              
              </>
            )}

            {isShopkeeper && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/admin/add-grocery"
                  className={linkClass('/admin/add-grocery')}
                >
                  <PlusCircle className="h-5 w-5 flex-shrink-0" />
                  <span>Add Grocery</span>
                </Link>

                <Link
                  href="/admin/view-grocery"
                  className={linkClass('/admin/view-grocery')}
                >
                  <Boxes className="h-5 w-5 flex-shrink-0" />
                  <span>View Grocery</span>
                </Link>
              </>
            )}

            {isDelivery && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/delivery/my-deliveries"
                  className={linkClass('/delivery/my-deliveries')}
                >
                  <Package className="h-5 w-5 flex-shrink-0" />
                  <span>My Deliveries</span>
                </Link>

                <Link
                  href="/delivery/order-tracking"
                  className={linkClass('/delivery/order-tracking')}
                >
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  <span>Track Order</span>
                </Link>
              </>
            )}

            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account
              </p>

              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left text-slate-600 transition hover:bg-slate-50 hover:text-[#00c853]"
              >
                <User className="h-5 w-5 flex-shrink-0" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/user/settings')}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left text-slate-600 transition hover:bg-slate-50 hover:text-[#00c853]"
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span>Settings</span>
              </button>
            </div>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
          </div>

          <div className="flex-shrink-0 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>

      {/* Show open control only while sidebar is closed */}
      {sidebarReady && !sidebarVisible && (
        <button
          type="button"
          onClick={toggleSidebar}
          title="Open sidebar"
          aria-label="Open sidebar"
className="fixed left-3 top-20 z-[60] flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-md transition-colors duration-300 ease-in-out hover:bg-emerald-50 hover:text-[#00c853] motion-reduce:transition-none"        >
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

/* Private pages: navbar ke neeche content */
body[data-smartbasket-layout='private'] .smartbasket-main {
  box-sizing: border-box;
  padding-top: 4rem;
  margin-left: 0;
  width: 100%;
  min-width: 0;
  transition:
    margin-left 300ms ease-in-out,
    width 300ms ease-in-out;
}

/* Sidebar open: content sidebar ke baad se start ho */
body[data-smartbasket-layout='private'][data-smartbasket-sidebar='open']
  .smartbasket-main {
  margin-left: 15rem;
  width: calc(100% - 15rem);
}

/* Sidebar close: content full width use kare */
body[data-smartbasket-layout='private'][data-smartbasket-sidebar='closed']
  .smartbasket-main {
  margin-left: 0;
  width: 100%;
}

/* Public pages par navbar/sidebar ki spacing nahi */
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
  );
}