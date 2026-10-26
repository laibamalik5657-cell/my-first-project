
import Link from 'next/link'
import {
  ShoppingBasket,
  Truck,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  Leaf,
  Clock,
} from 'lucide-react'

const features = [
  {
    icon: ShoppingBasket,
    title: 'Easy Grocery Shopping',
    description:
      'Browse grocery products, explore daily essentials and add your favourite items to your cart.',
  },
  {
    icon: Truck,
    title: 'Delivery Tracking',
    description:
      'Stay updated about your order and follow its delivery progress.',
  },
  {
    icon: MessageCircle,
    title: 'Rider Communication',
    description:
      'Communicate with your delivery rider through the available chat feature.',
  },
  {
    icon: ShieldCheck,
    title: 'OTP Delivery Confirmation',
    description:
      'Help verify your order delivery through an order confirmation code.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-green-100 via-green-50 to-white px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-6xl">

        <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-green-600 to-green-700 px-6 py-12 text-white shadow-lg sm:px-10 md:py-16 lg:px-14">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/10" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
              <Leaf size={17} />
              Freshness at Your Doorstep
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              About SmartBasket
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-green-50 sm:text-lg sm:leading-8">
              Your everyday grocery partner. We make grocery shopping
              convenient with easy online ordering and a delivery experience
              designed around your daily needs.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-green-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50"
            >
              Start Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Leaf size={25} />
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              Who We Are
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              SmartBasket is a grocery delivery platform that helps customers
              browse products, place orders and manage their grocery shopping
              online. Our goal is to make everyday essentials easier to order.
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <ShoppingBasket size={25} />
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              Our Mission
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Our mission is to provide a simple and reliable grocery shopping
              experience through convenient ordering, delivery updates and
              communication between customers and delivery riders.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-7 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-green-700">
              Why SmartBasket?
            </span>

            <h2 className="mt-2 text-3xl font-extrabold  text-green-700 sm:text-4xl">
              Everything You Need
            </h2>

            <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-600">
              Explore the features that make your grocery shopping easier
              and help you stay informed about your orders.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-800">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-10 flex flex-col gap-5 rounded-2xl border border-green-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Clock size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Grocery Shopping Made Convenient
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Browse available products and place your order whenever
                the service is available.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Explore Groceries
            <ArrowRight size={18} />
          </Link>
        </section>

      </div>
    </main>
  )
}
