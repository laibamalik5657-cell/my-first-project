'use client';
import CustomerPageHeader from '@/components/CustomerPageHeader';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Package, Truck } from 'lucide-react';

interface Order {
  _id: string;
  status: string;
  totalAmount?: string | number;
  items?: { name: string; quantity: number }[];
  address?: { fullName?: string; fullAddress?: string };
  createdAt?: string;
}

export default function TrackOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { data } = await axios.get('/api/user/my-orders');
        setOrders(
          Array.isArray(data)
            ? data.map((order) => ({
              ...order,
              _id: String(order._id),
            }))
            : []
        );
      } catch {
        setError('We couldn’t load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, []);

  const activeOrders = orders.filter((order) =>
    ['pending', 'processing', 'out for delivery'].includes(order.status)
  );

  const statusLabel = (status: string) =>
    status.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <main className="min-h-screen w-full bg-transparent px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
<CustomerPageHeader
  title="Track Order"
  subtitle="Real-time delivery status"
  backHref="/user/my-orders"
/>
        {/* Loading state */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm animate-in fade-in duration-300"
          >
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !activeOrders.length ? (
          <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <Package size={28} className="text-green-600" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-gray-800">
              No active orders
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              You currently have no order that can be tracked.
            </p>

            <Link
              href="/user/my-orders"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeOrders.map((order, index) => (
              <article
                key={order._id}
                style={{ animationDelay: `${index * 80}ms` }}
                className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-100 hover:shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both"
              >
                {/* Order header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-xl bg-green-50 p-2.5 text-green-600 transition-all duration-300 group-hover:bg-green-100 group-hover:scale-105">
                      {order.status === 'out for delivery' ? (
                        <Truck size={21} />
                      ) : (
                        <MapPin size={21} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-400">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <h2 className="mt-1 text-sm font-semibold capitalize text-gray-800">
                        {statusLabel(order.status)}
                      </h2>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-green-700 transition-colors duration-300 group-hover:bg-green-100">
                    {statusLabel(order.status)}
                  </span>
                </div>

                {/* Customer and address */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm font-semibold text-gray-800">
                    {order.address?.fullName || 'Customer'}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    {order.address?.fullAddress ||
                      'Delivery address available on tracking page'}
                  </p>

                  {order.items?.length ? (
                    <p className="mt-2 text-xs text-gray-400">
                      {order.items.length} product types
                    </p>
                  ) : null}
                </div>

                {/* Tracking button */}
                <Link
                  href={`/user/track-order/${order._id}`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                  <MapPin size={16} />
                  Track Order
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}