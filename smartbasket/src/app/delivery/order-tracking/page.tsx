
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import {
  MapPin,
  Package,
  RefreshCw,
  Truck,
  ArrowUpRight,
  Clock,
} from 'lucide-react'

type Delivery = {
  _id: string
  status: 'pending' | 'out for delivery' | 'delivered' | 'cancelled'
  address: {
    fullName: string
    fullAddress: string
  }
  createdAt: string
  items: {
    name: string
    quantity: number
    unit: string
  }[]
}

type Result = {
  deliveries: Delivery[]
  total: number
  hasMore: boolean
}

export default function DeliveryOrderTrackingPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDeliveries() {
      setLoading(true)

      try {
        const { data } = await axios.get<Result>(
          '/api/delivery/my-deliveries',
          {
            params: { status: 'active', page: 1 },
            signal: controller.signal,
          }
        )

        setDeliveries(
          (data.deliveries ?? []).filter(
            order =>
              order.status === 'pending' ||
              order.status === 'out for delivery'
          )
        )
        setError('')
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            axios.isAxiosError(err)
              ? err.response?.data?.message || 'Could not load active deliveries.'
              : 'Could not load active deliveries.'
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadDeliveries()

    return () => controller.abort()
  }, [revision])

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <Truck size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Order Tracking
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View your assigned orders and open their tracking pages.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-600">
              Active deliveries: <strong>{deliveries.length}</strong>
            </p>

            <button
              type="button"
              onClick={() => setRevision(value => value + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => setRevision(value => value + 1)}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading active orders...
          </div>
        ) : !error && deliveries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Package size={42} className="mx-auto text-green-600" />
            <h2 className="mt-4 text-lg font-bold text-gray-800">
              No Active Orders
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Your assigned pending and in-progress deliveries will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {deliveries.map(order => (
              <article
                key={order._id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Order ID
                    </p>
                    <h2 className="mt-1 font-bold text-gray-900">
                      #{order._id.slice(-6).toUpperCase()}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      order.status === 'out for delivery'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.status === 'out for delivery'
                      ? 'In Progress'
                      : 'Assigned'}
                  </span>
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <div className="rounded-lg bg-green-50 p-2 text-green-700">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">
                      {order.address?.fullName || 'Customer'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      {order.address?.fullAddress || 'Address unavailable'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Package size={16} />
                  {order.items?.length ?? 0} product types
                  <span className="text-gray-300">•</span>
                  <Clock size={16} />
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-PK')
                    : 'Date unavailable'}
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <Link
                    href={`/user/track-order/${order._id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    <MapPin size={17} />
                    Track This Order
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
