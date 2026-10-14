
'use client'

import React from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa6'

function Footer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-linear-to-r from-green-600 to-green-700 text-white mt-20"
    >
      <div className="w-[90%] md:w-[80%] mx-auto py-10 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-green-500/40">
        <div>
          <h2 className="text-2xl font-bold mb-3">SmartBasket</h2>

          <p className="text-sm text-green-100 leading-relaxed">
            Your one-stop online grocery store delivering freshness to your doorstep.
            Shop smart, eat fresh, and save more every day!
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Quick Links</h2>

          <ul className="space-y-2 text-green-100 text-sm">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/user/cart" className="transition hover:text-white">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/my-orders" className="transition hover:text-white">
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Contact Us</h3>

          <ul className="space-y-3 text-green-100 text-sm">
            <li className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0" />
              <span>Rawalpindi, Pakistan</span>
            </li>

            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0" />
              <span>Customer Support</span>
            </li>

            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0" />
              <a
                href="mailto:support@smartbasket.in"
                className="transition hover:text-white"
              >
                support@smartbasket.in
              </a>
            </li>

            <li className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-white">Website Timings</p>
                <p>Monday – Sunday</p>
                <p>8:00 AM – 10:00 PM</p>
              </div>
            </li>
          </ul>

          <div className="flex gap-4 mt-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition hover:text-white"
            >
              <FaFacebook size={20} />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition hover:text-white"
            >
              <FaInstagram size={20} />
            </a>

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="transition hover:text-white"
            >
              <FaTwitter size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-sm text-green-100 bg-green-800/40">
        © {new Date().getFullYear()}{' '}
        <span className="font-semibold">SmartBasket</span>. All rights reserved.
      </div>
    </motion.div>
  )
}

export default Footer
