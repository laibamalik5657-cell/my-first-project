
'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { ChevronDown, CreditCard, MapPin, Package, Phone, Truck, XCircle } from 'lucide-react'
import ManagementDialog from './ManagementDialog'
import type { CustomerOrder, OrderStatus } from '@/types/customer-order'

const statuses = {
  pending: { label: 'Preparing', color: 'border-amber-200 bg-amber-50 text-amber-800' },
  'out for delivery': { label: 'On the way', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  delivered: { label: 'Delivered', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'border-slate-200 bg-slate-100 text-slate-600' },
}

const money = (amount: string | number = 0) =>
  Number(amount).toLocaleString('en-PK', { maximumFractionDigits: 2 })

export default function UserOrderCard({
  order,
  onStatusChange,
}: {
  order: CustomerOrder
  onStatusChange: (status: OrderStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const detailsId = useId()

  const status = statuses[order.status] ?? {
    label: order.status,
    color: 'border-gray-200 bg-gray-50 text-gray-600',
  }

  const date = order.createdAt ? new Date(order.createdAt) : null

  const dateLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Date unavailable'

  async function cancel() {
    if (busy) return

    setBusy(true)
    setError('')

    try {
      const { data } = await axios.post(`/api/user/order/${order._id}/cancel`)
      onStatusChange(data.status)
      setConfirmCancel(false)
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Could not cancel your order.'
          : 'Could not cancel your order.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all hover:shadow-xl">
      <header className="space-y-2 px-5 pt-5">
        <h2 className="font-semibold text-gray-800">
          Order <span className="text-green-700">#{order._id.slice(-6)}</span>
        </h2>
        <p className="text-xs text-gray-500">Placed on {dateLabel}</p>
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </header>

      <div className="space-y-4 p-5">
        {order.status === 'cancelled' && (
          <p className="flex items-center gap-2 text-xs text-gray-600">
            <XCircle size={16} /> This order was cancelled.
          </p>
        )}

        <div className="space-y-3 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <CreditCard size={16} className="shrink-0 text-green-600" />
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'}
            <span className="text-xs text-gray-400">
              · {order.isPaid ? 'Paid' : order.status === 'cancelled' ? 'Cancelled' : 'Unpaid'}
            </span>
          </p>

          <p className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-green-600" />
            <span title={order.address.fullAddress} className="truncate">
              {order.address.fullAddress}
            </span>
          </p>
        </div>

        <footer className="mx-5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 py-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <Truck size={15} className="text-green-600" />
            Delivery: {order.status}
          </span>

          <span>
            Total:{' '}
            <strong className="text-green-700">
              Rs. {money(order.totalAmount)}
            </strong>
          </span>
        </footer>

        {confirmCancel && (
          <ManagementDialog
            title="Cancel this order?"
            busy={busy}
            onClose={() => setConfirmCancel(false)}
          >
            <p className="text-sm leading-6 text-slate-600">
              Your order can be cancelled while it is still being prepared. Once
              dispatched, it cannot be cancelled.
            </p>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={busy}
                onClick={() => setConfirmCancel(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
              >
                Keep order
              </button>

              <button
                disabled={busy}
                onClick={cancel}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Cancelling…' : 'Cancel order'}
              </button>
            </div>
          </ManagementDialog>
        )}
      </div>
    </article>
  )
}
