
'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  User, Users, Search, ShoppingCart, Boxes, ClipboardCheck,
  LogOut, Package, PlusCircle, Settings, LayoutDashboard,
  MapPin, X, PanelLeftOpen,
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

export default function Nav({ user: initialUser }: { user?: IUser }) {
  const { data: session } = useSession()
  const storedUser = useSelector((state: RootState) => state.user.userData)
  const user: IUser = storedUser?._id
    ? storedUser
    : initialUser?._id
      ? initialUser
      : (session?.user as IUser) || {}

  const { cartData } = useSelector((state: RootState) => state.cart)

  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<IGroceryItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [allGroceries, setAllGroceries] = useState<IGroceryItem[]>([])
  const [groceriesLoading, setGroceriesLoading] = useState(false)

  const profileDropDownRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = [
    '/signin', '/sign-in', '/login', '/signup', '/sign-up', '/register',
    '/select-role', '/selectRole', '/role-selection', '/choose-role',
    '/reset-password', '/forgot-password', '/unauthorized',
  ]

  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  )

  const role = String(user.role || '').toLowerCase().replace(/[\s_-]/g, '')
  const isCustomer = role === 'user' || role === 'customer'
  const isAdmin = role === 'admin'
  const isShopkeeper = role === 'shopkeeper'
  const isDelivery = ['deliveryboy', 'delivery'].includes(role)

  useEffect(() => {
    if (isPublicRoute) return

    const savedState = localStorage.getItem('sidebar_visible')
    setSidebarVisible(savedState !== null ? savedState === 'true' : true)
  }, [pathname, isPublicRoute])

  useEffect(() => {
    const styleId = 'smartbasket-layout-style'
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null
    const sidebarWidth = sidebarVisible ? '240px' : '0px'

    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = styleId
      document.head.appendChild(styleTag)
    }

    if (isPublicRoute) {
      styleTag.innerHTML = `
        main.smartbasket-main {
          margin-left: ${sidebarWidth} !important;
          padding-left: 0 !important;
          padding-top: 80px !important;
          width: calc(100% - ${sidebarWidth}) !important;
          min-height: 100vh !important;
          box-sizing: border-box !important;
          transition: margin-left 320ms cubic-bezier(.22,1,.36,1),
                      width 320ms cubic-bezier(.22,1,.36,1) !important;
        }

        main.smartbasket-main > .smartbasket-page-container,
        .smartbasket-page-container {
          width: 100% !important;
          max-width: 1440px !important;
          margin-inline: auto !important;
          box-sizing: border-box !important;
        }
      `
    } else {
      styleTag.innerHTML = `
        html, body {
          overflow-x: hidden;
        }

        main.smartbasket-main {
          margin-left: ${sidebarWidth} !important;
          padding-left: 0 !important;
          padding-top: 80px !important;
          width: calc(100% - ${sidebarWidth}) !important;
          min-height: 100vh !important;
          box-sizing: border-box !important;
          transition: margin-left 320ms cubic-bezier(.22,1,.36,1),
                      width 320ms cubic-bezier(.22,1,.36,1) !important;
        }

        main.smartbasket-main > .smartbasket-page-container,
        .smartbasket-page-container {
          width: 100% !important;
          max-width: 1440px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          box-sizing: border-box !important;
        }

        @media (max-width: 767px) {
          main.smartbasket-main {
            margin-left: 0 !important;
            width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .smartbasket-page-container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          main.smartbasket-main {
            transition: none !important;
          }
        }
      `
    }

    return () => {
      document.getElementById(styleId)?.remove()
    }
  }, [sidebarVisible, isPublicRoute])

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
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // SEARCH FIX: fetch groceries for the customer and safely handle API responses.
  
  // Load groceries for navbar search suggestions
  useEffect(() => {
    if (isPublicRoute || !isCustomer) {
      setAllGroceries([]);
      return;
    }

    const controller = new AbortController();

    async function fetchGroceries() {
      setGroceriesLoading(true);

      try {
        const response = await fetch('/api/groceries', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Groceries API failed: ${response.status}`);
        }

        const data = await response.json();

        // Support different API response formats
        const payload =
          data?.items ??
          data?.groceries ??
          data?.products ??
          data?.groceryList ??
          data?.data?.items ??
          data?.data?.groceries ??
          data?.data ??
          data;

        const rawItems = Array.isArray(payload) ? payload : [];

        // Support both "name" and "title" fields
        const normalizedItems: IGroceryItem[] = rawItems
          .filter(
            (item: any) =>
              item &&
              typeof item._id === 'string' &&
              (typeof item.name === 'string' ||
                typeof item.title === 'string')
          )
          .map((item: any) => ({
            _id: item._id,
            name: item.name || item.title || '',
            title: item.title || item.name || '',
            category: item.category || '',
            price: item.price,
            image: item.image || item.images?.[0] || '',
            images: item.images || [],
          }));

        setAllGroceries(normalizedItems);
        console.log(
          'Navbar search products:',
          normalizedItems.length
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Navbar search error:', error);
          setAllGroceries([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setGroceriesLoading(false);
        }
      }
    }

    void fetchGroceries();

    return () => controller.abort();
  }, [isPublicRoute, isCustomer]);

  // SEARCH FIX: match product name, title and category without case sensitivity.


  // Match suggestions while the user types
  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matched = allGroceries.filter((item) => {
      const name = (item.name || item.title || '').trim().toLowerCase();
      const category = (item.category || '').trim().toLowerCase();

      return (
        name.startsWith(query) ||
        name.includes(query) ||
        category.startsWith(query) ||
        category.includes(query)
      );
    });

    setSuggestions(matched.slice(0, 8));
    setShowSuggestions(true);
  }, [search, allGroceries]);



  const toggleSidebar = () => {
    setSidebarVisible(prev => {
      const next = !prev
      localStorage.setItem('sidebar_visible', String(next))
      return next
    })
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

    const query = search.trim()
    if (query) router.push(`/?q=${encodeURIComponent(query)}`)
  }

  const handleSelectSuggestion = (itemName: string) => {
    setSearch(itemName)
    setShowSuggestions(false)
    router.push(`/?q=${encodeURIComponent(itemName)}`)
  }

  const isActiveRoute = (path: string) =>
    path === '/'
      ? pathname === '/'
      : pathname === path || pathname.startsWith(`${path}/`)

  if (isPublicRoute || (!user._id && !user.email && !user.role)) return null

  const linkClass = (path: string) =>
    `flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 ${
      isActiveRoute(path)
        ? 'bg-[#e8f5e9] font-bold text-[#00c853]'
        : 'text-slate-600 hover:bg-emerald-50 hover:text-[#00c853]'
    }`

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between bg-[#00c853] px-6 text-white shadow-md">
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
                onChange={e => {
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
                  suggestions.map(item => {
                 const displayName = item.name || item.title || 'Product'
const displayImage = item.image

                    return (
                      <button
                        key={item._id}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(displayName)}
                        className="flex w-full items-center gap-3 rounded-lg border-b border-slate-100 p-2 text-left transition-colors last:border-0 hover:bg-emerald-50"
                      >
                        {displayImage ? (
                          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                            <Image
                              src={displayImage}
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

        <div className="flex items-center gap-4">
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
              onClick={() => setOpenProfileDropdown(prev => !prev)}
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
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="text-xs font-medium capitalize text-[#00c853]">
                    {user.role}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setOpenProfileDropdown(false)
                    setShowProfileModal(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                >
                  <User className="h-4 w-4" /> Profile
                </button>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {sidebarVisible ? (
        <aside className="fixed bottom-0 left-0 top-16 z-40 flex w-60 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-sm transition-transform duration-300 ease-in-out">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Close sidebar"
            aria-label="Close sidebar"
            className="absolute right-2 top-2 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:rotate-90 hover:bg-red-50 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 flex flex-shrink-0 items-center gap-3 rounded-xl bg-slate-50 p-2 pr-10">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#e8f5e9] font-bold text-[#00c853]">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-slate-800">{user.name}</p>
              <p className="truncate text-[10px] capitalize text-slate-400">{user.role}</p>
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
                <Link href="/user/my-orders" className={linkClass('/user/my-orders')}>
                  <Package className="h-5 w-5 flex-shrink-0" />
                  <span>My Orders</span>
                </Link>
                <Link href="/user/order-tracking" className={linkClass('/user/order-tracking')}>
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  <span>Track Order</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/admin/view-grocery" className={linkClass('/admin/view-grocery')}>
                  <Boxes className="h-5 w-5" />
                  <span>View Grocery</span>
                </Link>
                <Link href="/admin/manage-orders" className={linkClass('/admin/manage-orders')}>
                  <ClipboardCheck className="h-5 w-5" />
                  <span>Manage Orders</span>
                </Link>
                <Link href="/admin/users" className={linkClass('/admin/users')}>
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </Link>
              </>
            )}

            {isShopkeeper && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/admin/add-grocery" className={linkClass('/admin/add-grocery')}>
                  <PlusCircle className="h-5 w-5" />
                  <span>Add Grocery</span>
                </Link>
                <Link href="/admin/view-grocery" className={linkClass('/admin/view-grocery')}>
                  <Boxes className="h-5 w-5" />
                  <span>View Grocery</span>
                </Link>
              </>
            )}

            {isDelivery && (
              <>
                <Link href="/" className={linkClass('/')}>
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/delivery/my-deliveries" className={linkClass('/delivery/my-deliveries')}>
                  <Package className="h-5 w-5" />
                  <span>My Deliveries</span>
                </Link>
                <Link href="/delivery/order-tracking" className={linkClass('/delivery/order-tracking')}>
                  <MapPin className="h-5 w-5" />
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
          </div>

          <div className="flex-shrink-0 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={toggleSidebar}
          title="Open sidebar"
          aria-label="Open sidebar"
          className="fixed left-0 top-[76px] z-50 flex h-9 w-9 items-center justify-center rounded-r-xl border border-l-0 border-slate-200 bg-white text-slate-500 shadow-md transition-all duration-200 hover:w-11 hover:bg-emerald-50 hover:text-[#00c853]"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {showProfileModal && (
        <ProfileModal user={user as any} onClose={() => setShowProfileModal(false)} />
      )}

      <style jsx global>{`
        html, body { overflow-x: hidden; }
        aside::-webkit-scrollbar { width: 5px; }
        aside::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 999px; }
        aside::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 767px) {
          .smartbasket-page-container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </>
  )
}
