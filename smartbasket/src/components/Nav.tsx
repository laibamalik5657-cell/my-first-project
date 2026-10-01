'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { User, Users, Menu, Search, ShoppingCart, Boxes, ClipboardCheck, LogOut, Package, PlusCircle, X, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import ProfileModal from './ProfileModal';

interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  address?: string;
  role: "user" | "deliveryBoy" | "admin" | "shopkeeper";
  image?: string;
}

export default function Nav({ user: initialUser }: { user: IUser }) {
  const storedUser = useSelector((state: RootState) => state.user.userData);
  const user = storedUser?._id === initialUser._id ? { ...initialUser, ...storedUser } : initialUser;
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const { cartData } = useSelector((state: RootState) => state.cart);
  const [search, setSearch] = useState("");
  const profileDropDown = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropDown.current && !profileDropDown.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) {
      return router.push("/");
    }

    router.push(`/?q=${encodeURIComponent(query)}`);
    setSearch("");
    setSearchBarOpen(false);
  };

  const sideBar = menuOpen ? createPortal(
    <AnimatePresence>
      <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        id="mobile-navigation"
        className="fixed top-0 left-0 h-full w-[85%] sm:w-[65%] md:w-[40%] lg:w-[30%] z-[9999] bg-gradient-to-b from-green-800 via-green-900 to-green-950 backdrop-blur-xl border-r border-green-500/40 shadow-2xl flex flex-col overflow-y-auto p-6 text-white"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-extrabold text-2xl tracking-wide">
            {user.role === "admin" ? "Admin Panel" : user.role === "shopkeeper" ? "Shopkeeper Panel" : "SmartBasket"}
          </h1>
          <button 
            aria-label="Close navigation"
            className="text-3xl hover:text-red-300 transition bg-white/10 p-1.5 rounded-full"
            onClick={() => setMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card inside Sidebar */}
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl mb-6 shadow-inner border border-white/10">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-md border-green-400 relative flex-shrink-0">
            {user?.image ? (
              <Image src={user?.image} alt="user" fill className="object-cover rounded-full" />
            ) : (
              <User className="w-12 h-12 p-2 text-green-300" />
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-base font-semibold text-white truncate">{user?.name}</h2>
            <p className="text-xs text-green-200 capitalize tracking-wide">{user?.role}</p>
          </div>
        </div>

        {/* Navigation Links based on Roles */}
        <div className="flex flex-col gap-2 font-medium">
          {user?.role === "admin" && (
            <>
              <Link href="/admin/view-grocery" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all" onClick={() => setMenuOpen(false)}>
                <Boxes className="w-5 h-5 text-green-300" /> View Grocery
              </Link>
              <Link href="/admin/manage-orders" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all" onClick={() => setMenuOpen(false)}>
                <ClipboardCheck className="w-5 h-5 text-green-300" /> Manage Orders
              </Link>
              <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all" onClick={() => setMenuOpen(false)}>
                <Users className="w-5 h-5 text-green-300" /> Users
              </Link>
            </>
          )}

          {user?.role === "shopkeeper" && (
            <>
              <Link href="/admin/add-grocery" className='flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all' onClick={() => setMenuOpen(false)}>
                <PlusCircle className='w-5 h-5 text-green-300' /> Add Grocery
              </Link>
              <Link href="/admin/view-grocery" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all" onClick={() => setMenuOpen(false)}>
                <Boxes className="w-5 h-5 text-green-300" /> View Grocery
              </Link>
            </>
          )}

          {user?.role === "deliveryBoy" && (
            <Link href="/delivery/my-deliveries" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 hover:bg-white/20 transition-all">
              <Package className="w-5 h-5 text-green-300" /> My Deliveries
            </Link>
          )}

          {user?.role === "user" && (
            <>
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                <Boxes className="w-5 h-5 text-green-300" /> Home / Groceries
              </Link>
              <Link href="/user/cart" onClick={() => setMenuOpen(false)} className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-green-300" /> Cart
                </div>
                <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {cartData?.length || 0}
                </span>
              </Link>
              <Link href="/user/my-orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                <Package className="w-5 h-5 text-green-300" /> My Orders
              </Link>
            </>
          )}
        </div>

        <div className="my-6 border-t border-white/20"></div>

        {/* Profile & Settings inside Sidebar */}
        <div className="flex flex-col gap-2 font-medium">
          <button 
            onClick={() => { setMenuOpen(false); setShowProfileModal(true); }} 
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-left"
          >
            <User className="w-5 h-5 text-green-300" /> Profile
          </button>
          <button 
            onClick={() => { setMenuOpen(false); setShowSettingsModal(true); }} 
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-left"
          >
            <Settings className="w-5 h-5 text-green-300" /> Settings
          </button>
        </div>

        <button 
          onClick={async () => await signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 text-red-300 font-semibold hover:bg-red-500/20 w-full p-3 rounded-xl transition mt-auto border border-red-500/30"
        >
          <LogOut className="w-5 h-5 text-red-300" /> Logout
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <nav aria-label="Main navigation" className="w-[95%] fixed top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-700 rounded-2xl shadow-lg shadow-black/30 flex justify-between items-center h-20 px-4 md:px-8 z-50">

        {/* Left Side: Sidebar Hamburger Menu + SmartBasket Logo */}
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            aria-label="Open navigation" 
            aria-expanded={menuOpen} 
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:scale-105 transition"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            <Menu className="text-green-600 w-6 h-6" />
          </button>

          <Link href="/" className="text-white font-extrabold text-xl sm:text-2xl tracking-wide hover:scale-105 transition-transform">
            SmartBasket
          </Link>
        </div>

        {/* Center Search Bar for Users */}
        {user?.role === "user" && (
          <form className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-1/3 max-w-md shadow-md" onSubmit={handleSearch}>
            <Search className="text-gray-500 w-5 h-5 mr-3" />
            <input type="text" placeholder="Search groceries..."
              className="flex-1 outline-none text-gray-700 placeholder:text-gray-400 text-sm"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
          </form>
        )}

        {/* Desktop Quick Links */}
        {user?.role === 'deliveryBoy' && (
          <Link href="/delivery/my-deliveries" className="hidden items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all lg:flex text-sm">
            <Package size={18} /> My Deliveries
          </Link>
        )}
        
        {user?.role === "admin" && (
          <div className='hidden lg:flex items-center gap-2'>
            <Link href='/admin/view-grocery' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-3 py-2 rounded-full hover:bg-green-100 transition-all text-sm'>
              <Boxes className='w-4 h-4' /> View Grocery
            </Link>
            <Link href='/admin/manage-orders' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-3 py-2 rounded-full hover:bg-green-100 transition-all text-sm'>
              <ClipboardCheck className='w-4 h-4' /> Manage Orders
            </Link>
            <Link href='/admin/users' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-3 py-2 rounded-full hover:bg-green-100 transition-all text-sm'>
              <Users className='w-4 h-4' /> Users
            </Link>
          </div>
        )}

        {user?.role === "shopkeeper" && (
          <div className='hidden lg:flex items-center gap-2'>
            <Link href='/admin/add-grocery' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all text-sm'>
              <PlusCircle className='w-4 h-4' /> Add Grocery
            </Link>
            <Link href='/admin/view-grocery' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all text-sm'>
              <Boxes className='w-4 h-4' /> View Grocery
            </Link>
          </div>
        )}

        {/* Right Side Icons (Cart, Search toggle for mobile, Profile Dropdown) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user?.role === "user" && (
            <>
              <div 
                className="md:hidden bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition"
                onClick={() => setSearchBarOpen(prev => !prev)}
              >
                <Search className="text-green-600 w-5 h-5" />
              </div>

              <Link href="/user/cart" className="relative bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:scale-105 transition">
                <ShoppingCart className="text-green-600 w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full shadow">
                  {cartData?.length || 0}
                </span>
              </Link>
            </>
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropDown}>
            <button type="button" aria-label="Open account menu" aria-expanded={open}
              className="relative bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition overflow-hidden"
              onClick={() => setOpen(prev => !prev)}
            >
              {user?.image ? (
                <Image src={user?.image} alt="user" fill className="object-cover rounded-full" />
              ) : (
                <User className="text-green-600 w-5 h-5" />
              )}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-0 mt-3 w-56 text-slate-700 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50"
                >
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100">
                    <div className="w-10 h-10 relative rounded-full overflow-hidden flex-shrink-0">
                      {user?.image ? (
                        <Image src={user?.image} alt='user' fill className="object-cover rounded-full" />
                      ) : (
                        <User className="w-10 h-10 text-green-600 p-1" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className='text-gray-800 font-semibold truncate'>{user?.name}</div>
                      <div className='text-xs text-gray-500 capitalize'>{user?.role}</div>
                    </div>
                  </div>

                  {user?.role === "user" && (
                    <Link 
                      href="/user/my-orders" 
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded-xl text-gray-700 text-sm mt-1"
                      onClick={() => setOpen(false)}
                    >
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                  )}

                  <button onClick={() => { setOpen(false); setShowProfileModal(true); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 rounded-xl text-sm text-gray-700 font-medium">Profile</button>
                  <button onClick={() => { setOpen(false); setShowSettingsModal(true); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 rounded-xl text-sm text-gray-700 font-medium">Settings</button>
                   
                  <button 
                    onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex items-center gap-3 text-red-500 hover:bg-red-50 w-full p-2.5 rounded-lg transition text-sm mt-1 font-semibold"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {sideBar}

      {/* Mobile Search Bar overlay */}
      <AnimatePresence>
        {searchBarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-xl p-4 z-[60] md:hidden flex items-center"
          >
            <Search className='text-gray-500 w-5 h-5 mr-2' />
            <form className='grow' onSubmit={handleSearch}>
              <input type="text" className='w-full outline-none text-gray-700 text-sm' 
                placeholder='Search groceries...' value={search}
                onChange={(e)=>setSearch(e.target.value)}/>
            </form>
            <button onClick={() => setSearchBarOpen(false)}>
              <X className='text-gray-500 w-5 h-5' />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Details Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal user={user} onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative border border-gray-100 text-gray-800"
            >
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-4 text-center">Settings</h2>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Account Status</p>
                    <p className="text-xs text-gray-500">Active and Verified</p>
                  </div>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">Role</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role || "user"}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full mt-6 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition shadow-md shadow-green-200"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}