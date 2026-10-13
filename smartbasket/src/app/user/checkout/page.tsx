'use client'

import React, { useState, useEffect } from 'react'
import CustomerPageHeader from '@/components/CustomerPageHeader'
import Link from 'next/link'
import { CreditCard, Loader2, LocateFixed, MapPin, Truck, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { clearCart } from '@/redux/cartSlice'
import axios from 'axios'
import dynamic from 'next/dynamic'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-emerald-50 text-xs font-medium text-emerald-700 animate-pulse">
      Loading interactive map...
    </div>
  )
});

const DEFAULT_POSITION: [number, number] = [33.6844, 73.0479] // Islamabad

// Valid Pakistani SIM Operator Codes:
// Jazz/Warid: 0300-0309, 0320-0329
// Zong: 0310-0318
// Ufone: 0330-0337
// Telenor: 0340-0349
// SCOM: 0355
const PAK_SIM_REGEX = /^(030[0-9]|031[0-8]|032[0-9]|033[0-7]|034[0-9]|0355)\d{7}$/

// Strict validation helper for Pakistani Mobile Numbers
const isValidPakMobile = (mobileNumber: string): { isValid: boolean; error: string } => {
  if (!mobileNumber.startsWith("03")) {
    return { isValid: false, error: "Pakistani mobile number must start with 03" }
  }

  if (mobileNumber.length < 11) {
    return { isValid: false, error: "Mobile number must be exactly 11 digits" }
  }

  if (mobileNumber.length === 11) {
    // 1. Check valid SIM operator network prefixes
    if (!PAK_SIM_REGEX.test(mobileNumber)) {
      return { isValid: false, error: "Invalid Pakistani SIM network prefix" }
    }

    // 2. Reject repetitive digits after "03" (e.g. 03333333333, 03000000000)
    const subscriberPart = mobileNumber.slice(2)
    if (/^(\d)\1{8}$/.test(subscriberPart)) {
      return { isValid: false, error: "Invalid mobile number. Repeated digits are not allowed." }
    }

    // 3. Reject entire repetitive string (e.g. 03333333333)
    if (/^(\d)\1{10}$/.test(mobileNumber)) {
      return { isValid: false, error: "Invalid mobile number entered." }
    }

    // 4. Reject simple sequential numbers (e.g. 03123456789)
    if (mobileNumber === "03123456789" || subscriberPart === "123456789") {
      return { isValid: false, error: "Please enter a valid personal mobile number." }
    }
  }

  return { isValid: true, error: "" }
}

function Checkout() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { userData } = useSelector((state: RootState) => state.user)
  const { subTotal, deliveryFee, finalTotal, cartData } = useSelector((state: RootState) => state.cart)

  const [addressDraft, setAddress] = useState({
    fullName: undefined as string | undefined,
    mobile: undefined as string | undefined,
    city: "",
    state: "",
    pincode: "",
    fullAddress: "",
  })

  const address = {
    ...addressDraft,
    fullName: addressDraft.fullName ?? userData?.name ?? '',
    mobile: addressDraft.mobile ?? userData?.mobile ?? '',
  }

  const [mobileError, setMobileError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<{ label: string; x: number; y: number }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION)
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod")
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState("")

  // Online payment proof states
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState("")
  const [proofMessage, setProofMessage] = useState("")

  // Cleanup object URLs to prevent memory leak
  useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview)
      }
    }
  }, [proofPreview])

  // Get current position on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
        },
        (err) => {
          console.warn(`Location error (${err.code}): ${err.message}`);
          setPosition((prev) => prev ?? DEFAULT_POSITION);
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
      );
    }
  }, []);

  // Handle Mobile Input Change with Strict Pakistani SIM & Repetitive Guard
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "")

    if (rawVal.length <= 11) {
      setAddress((prev) => ({
        ...prev,
        mobile: rawVal,
      }))

      if (rawVal.length === 0) {
        setMobileError("")
        return
      }

      const { isValid, error } = isValidPakMobile(rawVal)
      if (!isValid) {
        setMobileError(error)
      } else {
        setMobileError("")
      }
    }
  }

  // Handle Search Query Submission
  const handleSearchQuery = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setLocationError("")
    try {
      const { OpenStreetMapProvider } = await import("leaflet-geosearch")
      const provider = new OpenStreetMapProvider()
      const results = await provider.search({ query: searchQuery });
      if (results.length > 0) {
        setPosition([results[0].y, results[0].x])
        setShowSuggestions(false)
      } else {
        setLocationError(`No location found for "${searchQuery}". Try another area or move the map pin.`)
      }
    } catch (error) {
      console.error("Search error:", error)
      setLocationError("Could not search locations. Please move the map pin or try again.")
    } finally {
      setSearchLoading(false)
    }
  }

  // Debounced live suggestions
  useEffect(() => {
    const query = searchQuery.trim()
    let cancelled = false
    const timer = setTimeout(async () => {
      if (query.length < 3) {
        setSuggestions([])
        return
      }
      try {
        const { OpenStreetMapProvider } = await import("leaflet-geosearch")
        const provider = new OpenStreetMapProvider()
        const results = await provider.search({ query })
        if (cancelled) return
        setSuggestions(results.slice(0, 5).map(r => ({ label: r.label, x: r.x, y: r.y })))
        setShowSuggestions(true)
      } catch (error) {
        if (!cancelled) console.error("Suggestion error:", error)
      }
    }, 350)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [searchQuery])

  const handleSelectSuggestion = (suggestion: { label: string; x: number; y: number }) => {
    setPosition([suggestion.y, suggestion.x])
    setSearchQuery(suggestion.label)
    setSuggestions([])
    setShowSuggestions(false)
    setLocationError("")
  }

  // Reverse geocoding on position change
  useEffect(() => {
    if (!position) return
    let cancelled = false
    const fetchAddress = async () => {
      try {
        const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
        if (cancelled) return
        if (result.data?.address) {
          setAddress(prev => ({
            ...prev,
            city: result.data.address.city || result.data.address.town || result.data.address.village || prev.city,
            state: result.data.address.state || prev.state,
            pincode: result.data.address.postcode || prev.pincode,
            fullAddress: result.data.display_name || prev.fullAddress,
          }))
        }
      } catch (error) {
        if (!cancelled) console.error("Reverse geocode failed:", error)
      }
    }
    fetchAddress()
    return () => { cancelled = true }
  }, [position]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
        },
        (err) => {
          console.error('Location error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }
  }

  const placeOrder = async (paymentMethod: "cod" | "online", paymentProof?: string) => {
    setOrderError("")
    if (!position) {
      setOrderError("Please select your location on the map.")
      return
    }

    // Strict Mobile Number Verification Check
    const mobileCheck = isValidPakMobile(address.mobile || "")
    if (!address.mobile || !mobileCheck.isValid) {
      const errorMsg = mobileCheck.error || "Please enter a valid 11-digit Pakistani mobile number starting with 03"
      setOrderError(errorMsg)
      setMobileError(errorMsg)
      return
    }

    const missing = (["fullName", "mobile", "fullAddress", "city", "state", "pincode"] as const)
      .filter((key) => !address[key]?.trim())
    if (missing.length > 0) {
      setOrderError(`Please fill in: ${missing.join(", ")}`)
      return
    }

    setOrderLoading(true)
    try {
      await axios.post("/api/user/order", {
        userId: userData?._id,
        items: cartData.map(item => ({
          grocery: item._id,
          name: item.name,
          price: item.price,
          unit: item.unit,
          image: item.image,
          quantity: item.quantity
        })),
        paymentMethod,
        paymentProof,
        address: {
          fullName: address.fullName,
          mobile: address.mobile,
          city: address.city,
          state: address.state,
          fullAddress: address.fullAddress,
          pincode: address.pincode,
          latitude: position[0],
          longitude: position[1]
        },
      })

      dispatch(clearCart())
      router.push("/user/order-success")
    } catch (error: any) {
      console.error(error)
      setOrderError(error?.response?.data?.message || error?.response?.data?.error || "Could not place order. Please try again.")
    } finally {
      setOrderLoading(false)
    }
  }

  const handleProofChange = (file: File | null) => {
    setProofFile(file)
    setProofMessage("")
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofPreview(file ? URL.createObjectURL(file) : "")
  }

  const handleOnlineOrder = async () => {
    if (!proofFile) {
      setProofMessage("Please upload a screenshot of your transaction.")
      return
    }
    setOrderError("")
    setProofMessage("")
    setOrderLoading(true)
    try {
      const formData = new FormData()
      formData.append("image", proofFile)
      const { data } = await axios.post("/api/user/order/payment-proof", formData)
      await placeOrder("online", data.url)
    } catch (error: any) {
      console.error(error)
      setProofMessage(error?.response?.data?.message || "Could not upload the screenshot. Please try again.")
      setOrderLoading(false)
    }
  }

  return (
    <main className="w-full min-h-[calc(100vh-64px)] p-4 md:p-6 bg-slate-50">
      {/* Dark Header Matching Main Navbar Theme */}
      <div className="max-w-7xl mx-auto">
        <CustomerPageHeader
          title="Checkout"
          subtitle="One last step before your groceries are on their way."
          backHref="/user/cart"
          backLabel="Back to basket"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {/* Progress Tracker */}
        <nav aria-label="Checkout Progress" className="mb-8">
          <ol className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <li className="flex items-center gap-2 text-[#058f53] font-bold">
              <Link href="/user/cart" className="hover:underline">01 Basket</Link>
            </li>
            <li className="h-2 w-2 rounded-full bg-[#058f53]" />
            <li className="flex items-center gap-2 text-[#058f53] font-bold">
              <span>02 Checkout</span>
            </li>
            <li className="h-2 w-2 rounded-full bg-slate-300" />
            <li className="text-slate-400">03 Confirmation</li>
          </ol>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Main Delivery Form Section */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
            <div className="mb-6 flex items-center gap-3.5">
              <span className="rounded-xl bg-[#058f53] p-3 text-white shadow-xs">
                <MapPin size={22} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Where should we deliver?</h2>
                <p className="mt-0.5 text-xs text-slate-500">Enter your address details and verify your map location.</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <label className="block text-xs font-semibold text-slate-700">
                Full Name <span className="text-rose-500">*</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={address.fullName}
                  onChange={e => setAddress(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Recipient name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-800 transition focus:border-[#058f53] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#058f53]/20"
                />
              </label>

              {/* Pakistani Mobile Number */}
              <label className="block text-xs font-semibold text-slate-700">
                Mobile Number (Pakistan) <span className="text-rose-500">*</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={address.mobile}
                  onChange={handleMobileChange}
                  placeholder="03XXXXXXXXX"
                  maxLength={11}
                  className={`mt-1.5 w-full rounded-xl border ${mobileError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-[#058f53] focus:ring-[#058f53]/20'} bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-800 transition focus:bg-white focus:outline-none focus:ring-2`}
                />
                {mobileError && <span className="mt-1 block text-[11px] text-rose-500 font-normal">{mobileError}</span>}
              </label>

              {/* City */}
              <label className="block text-xs font-semibold text-slate-700">
                City <span className="text-rose-500">*</span>
                <input
                  type="text"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={e => setAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g. Islamabad"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-800 transition focus:border-[#058f53] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#058f53]/20"
                />
              </label>

              {/* Province / Region */}
              <label className="block text-xs font-semibold text-slate-700">
                Province / Region <span className="text-rose-500">*</span>
                <input
                  type="text"
                  autoComplete="address-level1"
                  value={address.state}
                  onChange={e => setAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="e.g. Punjab"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-800 transition focus:border-[#058f53] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#058f53]/20"
                />
              </label>

              {/* Postal Code */}
              <label className="block text-xs font-semibold text-slate-700">
                Postal Code <span className="text-rose-500">*</span>
                <input
                  type="text"
                  autoComplete="postal-code"
                  value={address.pincode}
                  onChange={e => setAddress(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="e.g. 44000"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-800 transition focus:border-[#058f53] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#058f53]/20"
                />
              </label>

              {/* Full Address */}
              <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                Street Address & Landmarks <span className="text-rose-500">*</span>
                <textarea
                  autoComplete="street-address"
                  rows={2}
                  value={address.fullAddress}
                  onChange={e => setAddress(prev => ({ ...prev, fullAddress: e.target.value }))}
                  placeholder="House/Apartment #, Street, Near landmark..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-800 transition focus:border-[#058f53] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#058f53]/20"
                />
              </label>
            </div>

            {/* Map Search & Pin Area */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <label htmlFor="location-search" className="text-xs font-semibold text-slate-700">
                Search & Pin Location
              </label>
              
              <div className="relative mt-2">
                <form
                  onSubmit={e => { e.preventDefault(); void handleSearchQuery() }}
                  className="flex gap-2"
                >
                  <input
                    id="location-search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search area, sector or landmark"
                    autoComplete="off"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#058f53] focus:ring-2 focus:ring-[#058f53]/20"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="rounded-xl bg-[#058f53] px-5 text-sm font-semibold text-white transition-all hover:bg-[#047745] hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
                  >
                    {searchLoading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                  </button>
                </form>

                {/* Suggestions List Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white text-sm shadow-xl transition-all">
                    {suggestions.map((suggestion, i) => (
                      <li key={`${suggestion.label}-${i}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="block w-full truncate px-4 py-2.5 text-left text-slate-700 transition hover:bg-emerald-50 hover:text-[#058f53]"
                        >
                          {suggestion.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Map Canvas */}
              <div className="relative isolate mt-4 h-72 overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 shadow-inner">
                {position ? (
                  <CheckOutMap position={position} setPosition={setPosition} />
                ) : (
                  <p role="status" className="flex h-full items-center justify-center text-sm text-slate-500">
                    Finding location...
                  </p>
                )}
                <button
                  type="button"
                  aria-label="Use my current location"
                  onClick={handleCurrentLocation}
                  className="absolute bottom-4 right-4 z-10 rounded-xl bg-white p-3 text-[#058f53] shadow-md transition-all hover:bg-emerald-50 hover:scale-105 active:scale-95 border border-slate-200"
                >
                  <LocateFixed size={20} />
                </button>
              </div>

              {locationError && (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                  <AlertCircle size={14} /> {locationError}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">Drag map marker precisely to your building doorstep.</p>
            </div>
          </section>

          {/* Right Summary Sidebar */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md lg:sticky lg:top-8">
            <h2 className="text-lg font-bold text-slate-900">Payment & Summary</h2>
            <p className="mt-0.5 text-xs text-slate-500">Choose your preferred payment option.</p>

            {/* Payment Options */}
            <div className="mt-5 space-y-3">
              {[
                { value: 'cod', label: 'Cash on Delivery', detail: 'Pay cash when your order arrives', icon: Truck },
                { value: 'online', label: 'Easypaisa / Bank', detail: 'Transfer online & upload receipt', icon: CreditCard },
              ].map(({ value, label, detail, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={paymentMethod === value}
                  onClick={() => {
                    setPaymentMethod(value as "cod" | "online");
                    setOrderError('');
                    setProofMessage('');
                  }}
                  className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all duration-200 ${
                    paymentMethod === value
                      ? 'border-[#058f53] bg-emerald-50/70 shadow-xs ring-1 ring-[#058f53]/30'
                      : 'border-slate-200 hover:border-[#058f53]/50 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={`shrink-0 ${paymentMethod === value ? 'text-[#058f53]' : 'text-slate-400'}`} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
                  </span>
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                      paymentMethod === value ? 'border-[#058f53] bg-[#058f53]' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              ))}
            </div>

            {/* Screenshot Upload for Online Transfer */}
            {paymentMethod === 'online' && (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all">
                <label className="block text-xs font-semibold text-slate-700">
                  Transaction Screenshot <span className="text-rose-500">*</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => handleProofChange(e.target.files?.[0] ?? null)}
                    className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#058f53] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#047745] file:transition-all"
                  />
                </label>
                {proofPreview && (
                  <div className="relative mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                    <img src={proofPreview} alt="Transaction receipt preview" className="max-h-40 w-full object-contain rounded" />
                  </div>
                )}
                {proofMessage && (
                  <p role="status" className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {proofMessage}
                  </p>
                )}
              </div>
            )}

            {/* Bill Summary */}
            <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal</dt>
                <dd className="font-medium text-slate-800">Rs. {subTotal.toLocaleString('en-PK')}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Delivery Fee</dt>
                <dd className="font-medium text-slate-800">
                  {deliveryFee === 0 ? <span className="text-[#058f53] font-bold">Free</span> : `Rs. ${deliveryFee.toLocaleString('en-PK')}`}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-bold text-slate-900">
                <dt>Total Amount</dt>
                <dd className="text-[#058f53]">Rs. {finalTotal.toLocaleString('en-PK')}</dd>
              </div>
            </dl>

            {/* Order Action Button */}
            <button
              type="button"
              disabled={orderLoading || !cartData.length}
              onClick={() => {
                if (paymentMethod === 'cod') void placeOrder("cod");
                else void handleOnlineOrder();
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#058f53] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#047745] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {orderLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : paymentMethod === 'cod' ? (
                'Place Order'
              ) : (
                'Pay & Place Order'
              )}
            </button>

            {orderError && (
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 border border-rose-100">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{orderError}</span>
              </div>
            )}

            {!cartData.length && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Your basket is empty.{' '}
                <Link href="/" className="font-semibold text-[#058f53] hover:underline">
                  Add groceries
                </Link>
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default Checkout