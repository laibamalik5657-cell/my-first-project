'use client'

import React from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  ShoppingBasket,
  Truck,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react'

function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-12 bg-linear-to-r from-green-600 to-green-700 text-white"
    >
      <div className="mx-auto grid w-[92%] max-w-7xl grid-cols-1 gap-9 border-b border-green-500/40 py-10 sm:grid-cols-2 lg:grid-cols-4">

        <div>
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <ShoppingBasket size={26} />
            </span>
            <span className="text-2xl font-bold">SmartBasket</span>
          </Link>

          <p className="text-sm leading-6 text-green-100">
            Your everyday grocery partner. Shop for your daily essentials
            and enjoy a convenient grocery delivery experience.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>

          <ul className="space-y-3 text-sm text-green-100">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/user/cart" className="transition hover:text-white">
                My Cart
              </Link>
            </li>
            <li>
              <Link href="/user/my-orders" className="transition hover:text-white">
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Our Services</h2>

          <ul className="space-y-4 text-sm text-green-100">
            <li className="flex items-start gap-3">
              <ShoppingBasket size={19} className="mt-0.5 shrink-0 text-green-200" />
              <div>
                <p className="font-medium text-white">Online Grocery Shopping</p>
                <p className="mt-1 text-xs leading-5">
                  Browse and order everyday grocery essentials.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <Truck size={19} className="mt-0.5 shrink-0 text-green-200" />
              <div>
                <p className="font-medium text-white">Order Tracking</p>
                <p className="mt-1 text-xs leading-5">
                  Follow your delivery progress.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <ShieldCheck size={19} className="mt-0.5 shrink-0 text-green-200" />
              <div>
                <p className="font-medium text-white">OTP Delivery Confirmation</p>
                <p className="mt-1 text-xs leading-5">
                  Confirm delivery through a verification code.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Contact Us</h2>

          <ul className="space-y-4 text-sm text-green-100">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-green-200" />
              <span>Rawalpindi, Pakistan</span>
            </li>

            <li className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-green-200" />
              <div>
                <p className="font-medium text-white">Phone Number</p>
                <a href="tel:+923001234567" className="transition hover:text-white">
                  +92 3400551781
                </a>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <MessageCircle size={18} className="mt-0.5 shrink-0 text-green-200" />
              <div>
                <p className="font-medium text-white">WhatsApp Support</p>
                <a
                  href="https://wa.me/923165447546"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  +92 3165447546
                </a>
              </div>
            </li>

            
            <li className="flex items-start gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-green-200" />
              <div>
                <p className="font-medium text-white">Website Timings</p>
                <p>Monday – Sunday</p>
                <p>8:00 AM – 10:00 PM</p>
              </div>
            </li>
          </ul>
        </div>

      </div>

      <div className="bg-green-800/40 py-4 text-center text-sm text-green-100">
        © {new Date().getFullYear()}{' '}
        <span className="font-semibold">SmartBasket</span>. All rights reserved.
      </div>
    </motion.footer>
  )
}

export default Footer