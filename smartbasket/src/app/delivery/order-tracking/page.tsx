"use client"

import { getSocket } from '@/lib/socket'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import dynamic from 'next/dynamic'
import { Loader, MapPin, Truck, ShieldCheck } from 'lucide-react'

// Correct component import paths using `@/components/...`
// Agar aapke components src/components ya components folder me hain:
import DeliveryChat from '@/components/DeliveryChat' 
// ya agar components same delivery module me hain, toh path ko folder structure k mutabiq adjust karein:
// import DeliveryChat from '../DeliveryChat'

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[340px] sm:h-[440px] rounded-xl bg-gray-100 animate-pulse" />,
})


interface Ilocation {
  latitude: number
  longitude: number
}

export default function TrackOrderPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { userData } = useSelector((state: RootState) => state.user)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  
  // OTP States
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [sendOtpLoading, setSendOtpLoading] = useState(false)
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false)
  const [otp, setOtp] = useState("")

  // Location States
  const [userLocation, setUserLocation] = useState<Ilocation>({ latitude: 0, longitude: 0 })
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<Ilocation>({ latitude: 0, longitude: 0 })

  // 1. Live Location Tracking Setup
  useEffect(() => {
    const socket = getSocket()
    if (!userData?._id || !navigator.geolocation) return

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setDeliveryBoyLocation({ latitude: lat, longitude: lon })
        socket.emit("update-location", {
          userId: userData?._id,
          latitude: lat,
          longitude: lon,
        })
      },
      (err) => console.warn(`Geolocation error (${err.code}): ${err.message}`),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [userData?._id])

  // 2. Fetch Active Order
  const fetchCurrentOrder = async () => {
    try {
      const result = await axios.get("/api/delivery/current-order")
      if (result.data.active && result.data.assignment?.order) {
        setActiveOrder(result.data.assignment)
        setUserLocation({
          latitude: result.data.assignment.order.address.latitude,
          longitude: result.data.assignment.order.address.longitude,
        })
      } else {
        setActiveOrder(null)
      }
    } catch (err) {
      console.error(err)
      setError("Could not load your order tracking details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 3. Socket Listener for Location Updates
  useEffect(():any => {
    const socket = getSocket()
    socket.on("update-deliveryboy-location", ({ userId, location }) => {
      if (String(userId) !== String(userData?._id) || !Array.isArray(location?.coordinates)) return
      setDeliveryBoyLocation({
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
      })
    })

    return () => socket.off("update-deliveryboy-location")
  }, [userData?._id])

  useEffect(() => {
    fetchCurrentOrder()
  }, [userData?._id])

  // 4. Send OTP Action
  const sendOtp = async () => {
    setSendOtpLoading(true)
    setOtpError("")
    try {
      await axios.post("/api/delivery/otp/send", { orderId: activeOrder.order._id })
      setShowOtpBox(true)
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || "Could not send OTP. Please try again.")
    } finally {
      setSendOtpLoading(false)
    }
  }

  // 5. Verify OTP Action
  const verifyOtp = async () => {
    setVerifyOtpLoading(true)
    setOtpError("")
    try {
      await axios.post("/api/delivery/otp/verify", {
        orderId: activeOrder.order._id,
        otp,
      })
      setActiveOrder(null)
      await fetchCurrentOrder()
      window.location.reload()
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || "Could not verify OTP. Please try again.")
    } finally {
      setVerifyOtpLoading(false)
    }
  }

  // --- Render Views ---

  if (loading || error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          {error ? (
            <>
              <p role="alert" className="text-sm text-red-700">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-green-700">
                Try again
              </button>
            </>
          ) : (
            <p role="status" className="text-sm text-gray-500">Loading order tracking…</p>
          )}
        </div>
      </main>
    )
  }

  if (!activeOrder) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-green-50 px-4 pb-12 pt-28">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800">No Active Delivery To Track 🚚</h1>
          <p className="mb-5 text-sm text-gray-500">You don't have an active order in progress right now.</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm font-semibold text-green-700 hover:underline">
            Refresh page
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 px-4 pb-12 pt-28 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div>
            <h1 className="text-2xl font-bold text-green-700">Track Order</h1>
            <p className="mt-1 text-sm text-gray-500">
              Order #{String(activeOrder.order._id).slice(-6)}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
            <Truck size={16} /> In progress
          </span>
        </header>

        {/* Content Section */}
        <div className="flex flex-col gap-6">
          
          {/* Live Map & Delivery Details */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 text-sm font-semibold text-gray-800">
              <MapPin size={18} className="text-green-600" /> Delivery route
            </div>
            <LiveMap userLocation={userLocation} deliveryBoyLocation={deliveryBoyLocation} />
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Deliver to</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{activeOrder.order.address?.fullName}</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">{activeOrder.order.address?.fullAddress}</p>
            </div>
          </section>

          {/* Quick Replies & Chat Section */}
          <DeliveryChat orderId={activeOrder.order._id} deliveryBoyId={userData?._id?.toString() ?? ''} />

          {/* OTP & Complete Delivery Section */}
          <section className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-md sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-green-50 p-2.5 text-green-700">
                <ShieldCheck size={22} />
              </span>
              <div>
                <h2 className="font-semibold text-gray-800">Complete delivery</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Confirm the handoff with the customer’s delivery code.
                </p>
              </div>
            </div>

            {otpError && (
              <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {otpError}
              </p>
            )}

            {!activeOrder.order.deliveryOtpVerification && !showOtpBox && (
              <button
                disabled={sendOtpLoading}
                onClick={sendOtp}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {sendOtpLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Sending code…
                  </>
                ) : (
                  'Mark as delivered'
                )}
              </button>
            )}

            {showOtpBox && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (/^\d{4}$/.test(otp) && !verifyOtpLoading) void verifyOtp()
                }}
                className="space-y-3"
              >
                <label htmlFor="delivery-otp" className="block text-sm font-medium text-gray-700">
                  Customer’s 4-digit code
                </label>
                <input
                  id="delivery-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center text-xl tracking-[0.5em] text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
                <button
                  type="submit"
                  disabled={verifyOtpLoading || !/^\d{4}$/.test(otp)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {verifyOtpLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Verifying…
                    </>
                  ) : (
                    'Verify & complete delivery'
                  )}
                </button>
              </form>
            )}

            {activeOrder.order.deliveryOtpVerification && (
              <p className="rounded-xl bg-green-50 p-4 text-center text-sm font-semibold text-green-700">
                Delivery completed!
              </p>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}