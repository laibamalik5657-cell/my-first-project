'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { 
  User, 
  Menu, 
  Search, 
  ShoppingCart, 
  Boxes, 
  ClipboardCheck, 
  LogOut, 
  Package, 
  PlusCircle,
  X
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import mongoose from 'mongoose';

interface IUser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  role: "user" | "deliveryBoy" | "admin";
  image?: string;
}

export default function Nav({ user }: { user: IUser }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);

  const { cartData } = useSelector((state: RootState) => state.cart);

  const profileDropDown = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropDown.current && 
          !profileDropDown.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sideBar = menuOpen ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100 }}
        transition={{ type: "spring", stiffness: 100, damping: 14 }}
        className="fixed top-0 left-0 h-full w-[75%] sm:w-[60%] z-[9999] 
          bg-gradient-to-b from-green-800/90 via-green-900/90 to-green-900/90 
          backdrop-blur-xl border-r border-green-400 
          shadow-[0_0_50px_-10px_rgba(0,255,100,0.3)] 
          flex flex-col p-6 text-white"
      >
        <div className="flex justify-between items-center mb-2">
          <h1 className="font-extrabold text-2xl tracking-wide">Admin Panel</h1>
          <button 
            className="text-3xl hover:text-red-400 transition" 
            onClick={() => setMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 mt-3 bg-white/10 rounded-xl mb-6 transition-all hover:bg-white/15 shadow-inner">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg border-green-400/60 relative">
            {user?.image ? (
              <Image src={user?.image} alt="user" fill className="object-cover rounded-full" />
            ) : (
              <User className="w-12 h-12 p-2 text-green-300" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
            <p className="text-xs text-green-200 capitalize tracking-wide">{user?.role}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 font-medium mt-6">
          {user?.role === "admin" && (
            <>
              <Link href="/admin/add-grocery" className='flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all'>
                <PlusCircle className='w-5 h-5' /> Add Grocery
              </Link>
              <Link href="/admin/view-grocery" className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all">
                <Boxes className="w-5 h-5" /> View Grocery
              </Link>
              <Link href="/admin/manage-orders" className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 hover:pl-4 transition-all">
                <ClipboardCheck className="w-5 h-5" /> Manage Orders
              </Link>
            </>
          )}
        </div>

        <div className="my-5 border-t border-white/20"></div>

        {user?.role === "user" && (
          <Link href="/user/cart" className='relative bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-md hover:scale-105 transition'>
            <ShoppingCart className='text-green-600 w-6 h-6' />
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 flex items-center justify-center rounded-full font-semibold shadow'>{cartData?.length || 0}</span>
          </Link>
        )}

        <button 
          onClick={async () => await signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 text-red-300 font-semibold hover:bg-red-500/20 w-full p-3 rounded-lg transition mt-auto"
        >
          <LogOut className="w-5 h-5 text-red-300" /> Logout
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <div className="w-[95%] fixed top-4 left-1/2 -translate-x-1/2 
        bg-gradient-to-r from-green-500 to-green-700 rounded-2xl shadow-lg 
        shadow-black/30 flex justify-between items-center h-20 px-4 md:px-8 z-50">

        <Link href="/" className="text-white font-extrabold text-2xl sm:text-3xl tracking-wide hover:scale-105 transition-transform">
          SmartBasket
        </Link>

        {user?.role === "user" && (
          <form className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-1/2 max-w-lg shadow-md">
            <Search className="text-gray-500 w-5 h-5 mr-3" />
            <input
              type="text"
              placeholder="Search groceries..."
              className="flex-1 outline-none text-gray-700 placeholder:text-gray-400"
            />
          </form>
        )}

        {/* Desktop Admin Links */}
        {user?.role === "admin" && (
          <div className='hidden md:flex items-center gap-4'>
            <Link href='/admin/add-grocery' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all'>
              <PlusCircle className='w-5 h-5' /> Add Grocery
            </Link>
            <Link href='/admin/view-grocery' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all'>
              <Boxes className='w-5 h-5' /> View Grocery
            </Link>
            <Link href='/admin/manage-orders' className='flex items-center gap-2 bg-white text-green-700 font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-all'>
              <ClipboardCheck className='w-5 h-5' /> Manage Orders
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3 md:gap-6">
          {user?.role === "user" && (
            <>
              <div 
                className="md:hidden bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition"
                onClick={() => setSearchBarOpen(prev => !prev)}
              >
                <Search className="text-green-600 w-6 h-6" />
              </div>

              <Link href="/cart" className="relative bg-white rounded-full w-11 h-11 flex items-center justify-center shadow-md hover:scale-105 transition">
                <ShoppingCart className="text-green-600 w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full shadow">
                  {cartData?.length || 0}
                </span>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <div 
            className="md:hidden bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            <Menu className="text-green-600 w-6 h-6" />
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropDown}>
            <div 
              className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition overflow-hidden"
              onClick={() => setOpen(prev => !prev)}
            >
              {user?.image ? (
                <Image src={user?.image} alt="user" fill className="object-cover rounded-full" />
              ) : (
                <User className="text-green-600 w-6 h-6" />
              )}
            </div>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50"
                >
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100">
                    <div className="w-10 h-10 relative rounded-full overflow-hidden">
                      {user?.image ? (
                        <Image src={user?.image} alt='user' fill className="object-cover rounded-full" />
                      ) : (
                        <User className="w-10 h-10 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className='text-gray-800 font-semibold'>{user?.name}</div>
                      <div className='text-xs text-gray-500 capitalize'>{user?.role}</div>
                    </div>
                  </div>

                  {user?.role === "user" && (
                    <Link 
                      href="/user/my-orders" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-xl text-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      <Package className="w-5 h-5" /> My Orders
                    </Link>
                  )}

                  <button onClick={() => setOpen(false)} className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-xl">Profile</button>
                  <button onClick={() => setOpen(false)} className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-xl">Settings</button>

                  <button 
                    onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex items-center gap-3 text-red-400 hover:text-red-500 w-full p-3 rounded-lg hover:bg-red-50 transition"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {sideBar}

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {searchBarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-xl p-4 z-[60] md:hidden"
          >
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-3">
              <Search className="text-gray-500 w-5 h-5 mr-3" />
              <input
                type="text"
                placeholder="Search groceries..."
                className="flex-1 bg-transparent outline-none text-gray-700"
                autoFocus
              />
              <button 
                onClick={() => setSearchBarOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}