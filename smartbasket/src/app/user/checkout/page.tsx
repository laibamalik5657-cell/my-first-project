'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CreditCard, Loader2, LocateFixed, MapPin, Truck, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/redux/store'
import { clearCart } from '@/redux/cartSlice'
import axios from 'axios'
import dynamic from 'next/dynamic'

const CheckOutMap = dynamic(() => import('@/components/CheckoutMap'), { ssr: false })

const DEFAULT_POSITION: [number, number] = [33.6844, 73.0479]

const EASYPAISA_NUMBER = '03XX-XXXXXXX'
const EASYPAISA_ACCOUNT_NAME = 'SmartBasket'

function Checkout() {
    const router = useRouter()
    const dispatch = useDispatch<AppDispatch>()

    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, finalTotal, cartData } = useSelector((state: RootState) => state.cart)

    const [addressDraft, setAddress] = useState({
        fullName: undefined as string | undefined,
        mobile: undefined as string | undefined,
        city: '',
        state: '',
        pincode: '',
        fullAddress: '',
    })

    const address = {
        ...addressDraft,
        fullName: addressDraft.fullName ?? userData?.name ?? '',
        mobile: addressDraft.mobile ?? userData?.mobile ?? '',
    }

    const [locationError, setLocationError] = useState('')
    const [searchLoading, setSearchLoading] = useState('false')
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState<{ label: string; x: number; y: number }[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION)

    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
    const [orderLoading, setOrderLoading] = useState(false)
    const [orderError, setOrderError] = useState('')

    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState('')
    const [proofMessage, setProofMessage] = useState('')

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude])
                },
                () => {
                    setPosition(DEFAULT_POSITION)
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 10000,
                }
            )
        }
    }, [])

    const handleSearchQuery = async () => {
        if (!searchQuery.trim()) return

        setSearchLoading('true')
        setLocationError('')

        try {
            const { OpenStreetMapProvider } = await import('leaflet-geosearch')
            const provider = new OpenStreetMapProvider()
            const results = await provider.search({ query: searchQuery })

            if (results.length > 0) {
                setPosition([results[0].y, results[0].x])
                setShowSuggestions(false)
            } else {
                setLocationError(`No location found for "${searchQuery}". Try another area.`)
            }
        } catch {
            setLocationError('Could not search location. Please try again.')
        } finally {
            setSearchLoading('false')
        }
    }

    useEffect(() => {
        const query = searchQuery.trim()
        let cancelled = false

        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setSuggestions([])
                return
            }

            try {
                const { OpenStreetMapProvider } = await import('leaflet-geosearch')
                const provider = new OpenStreetMapProvider()
                const results = await provider.search({ query })

                if (cancelled) return

                setSuggestions(
                    results.slice(0, 5).map((result) => ({
                        label: result.label,
                        x: result.x,
                        y: result.y,
                    }))
                )

                setShowSuggestions(true)
            } catch {
                if (!cancelled) setSuggestions([])
            }
        }, 350)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [searchQuery])

    const handleSelectSuggestion = (suggestion: { label: string; x: number; y: number }) => {
        setPosition([suggestion.y, suggestion.x])
        setSearchQuery(suggestion.label)
        setSuggestions([])
        setShowSuggestions(false)
        setLocationError('')
    }

    const placeOrder = async (method: 'cod' | 'online', paymentProof?: string) => {
        setOrderError('')

        if (!position) {
            setOrderError('Please select your location on the map.')
            return
        }

        const missing = (
            ['fullName', 'mobile', 'fullAddress', 'city', 'state', 'pincode'] as const
        ).filter((key) => !address[key]?.trim())

        if (missing.length > 0) {
            setOrderError(`Please fill in: ${missing.join(', ')}`)
            return
        }

        setOrderLoading(true)

        try {
            await axios.post('/api/user/order', {
                userId: userData?._id,
                items: cartData.map((item) => ({
                    grocery: item._id,
                    name: item.name,
                    price: item.price,
                    unit: item.unit,
                    image: item.image,
                    quantity: item.quantity,
                })),
                paymentMethod: method,
                paymentProof,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latitude: position[0],
                    longitude: position[1],
                },
            })

            dispatch(clearCart())
            router.push('/user/order-success')
        } catch (error: any) {
            setOrderError(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                'Could not place order. Please try again.'
            )
        } finally {
            setOrderLoading(false)
        }
    }

    const handleCod = () => {
        void placeOrder('cod')
    }

    const handleProofChange = (file: File | null) => {
        setProofFile(file)
        setProofMessage('')

        setProofPreview((previous) => {
            if (previous) URL.revokeObjectURL(previous)
            return file ? URL.createObjectURL(file) : ''
        })
    }

    const handleOnlineOrder = async () => {
        if (!proofFile) {
            setProofMessage('Please upload a screenshot of your transaction.')
            return
        }

        setOrderError('')
        setProofMessage('')
        setOrderLoading(true)

        try {
            const formData = new FormData()
            formData.append('image', proofFile)

            const { data } = await axios.post(
                '/api/user/order/payment-proof',
                formData
            )

            await placeOrder('online', data.url)
        } catch (error: any) {
            setProofMessage(
                error?.response?.data?.message ||
                'Could not upload the screenshot. Please try again.'
            )
            setOrderLoading(false)
        }
    }

    useEffect(() => {
        if (!position) return

        let cancelled = false

        const fetchAddress = async () => {
            try {
                const result = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`
                )

                if (cancelled) return

                setAddress((previous) => ({
                    ...previous,
                    city:
                        result.data.address.city ||
                        result.data.address.town ||
                        result.data.address.village ||
                        previous.city,
                    state: result.data.address.state || previous.state,
                    pincode: result.data.address.postcode || previous.pincode,
                    fullAddress: result.data.display_name || previous.fullAddress,
                }))
            } catch {}
        }

        void fetchAddress()

        return () => {
            cancelled = true
        }
    }, [position])

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition([pos.coords.latitude, pos.coords.longitude])
            },
            () => {},
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000,
            }
        )
    }

    return (
        <main className="min-h-screen bg-linear-to-b from-green-50 via-white to-green-50 pb-20">
            <div className="mx-auto w-[95%] max-w-6xl pt-8 sm:w-[90%]">
                <div className="relative flex items-center justify-center">
                    <Link
                        href="/user/cart"
                        className="absolute left-0 flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
                    >
                        <ArrowLeft size={20} />
                        <span className="hidden sm:inline">Back to cart</span>
                    </Link>

                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-green-700 sm:text-4xl">
                            Checkout
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Complete your order and get your groceries delivered.
                        </p>
                    </div>
                </div>

                <div className="mx-auto mt-8 flex max-w-4xl items-center justify-center gap-3 text-xs font-semibold sm:text-sm">
                    <Link href="/user/cart" className="text-green-700">
                        01 Basket
                    </Link>

                    <span className="h-px w-10 bg-gray-300" />

                    <span className="text-green-700">
                        02 Checkout
                    </span>

                    <span className="h-px w-10 bg-gray-300" />

                    <span className="text-gray-400">
                        03 Confirmation
                    </span>
                </div>

                <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <section className="rounded-2xl border border-green-100 bg-white p-5 shadow-md sm:p-7">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-green-100 p-3 text-green-700">
                                <MapPin size={22} />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    
                                    Delivery Address
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Enter your address and confirm your location.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                {
                                    key: 'fullName',
                                    label: 'Full name',
                                    placeholder: 'Recipient name',
                                },
                                {
                                    key: 'mobile',
                                    label: 'Mobile number',
                                    placeholder: '03XXXXXXXXX',
                                },
                                {
                                    key: 'city',
                                    label: 'City',
                                    placeholder: 'City',
                                },
                                {
                                    key: 'state',
                                    label: 'Province / region',
                                    placeholder: 'Province',
                                },
                                {
                                    key: 'pincode',
                                    label: 'Postal code',
                                    placeholder: 'Postal code',
                                },
                            ].map((field) => (
                                <label
                                    key={field.key}
                                    className="block text-xs font-semibold text-gray-600"
                                >
                                    {field.label}

                                    <input
                                        type={field.key === 'mobile' ? 'tel' : 'text'}
                                        value={address[field.key as keyof typeof address]}
                                        onChange={(event) =>
                                            setAddress((previous) => ({
                                                ...previous,
                                                [field.key]: event.target.value,
                                            }))
                                        }
                                        placeholder={field.placeholder}
                                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                                    />
                                </label>
                            ))}

                            <label className="block text-xs font-semibold text-gray-600 sm:col-span-2">
                                Street address

                                <textarea
                                    rows={3}
                                    value={address.fullAddress}
                                    onChange={(event) =>
                                        setAddress((previous) => ({
                                            ...previous,
                                            fullAddress: event.target.value,
                                        }))
                                    }
                                    placeholder="House, street and nearby landmark"
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                                />
                            </label>
                        </div>

                        <div className="mt-7 border-t border-gray-100 pt-6">
                            <label className="text-xs font-semibold text-gray-600">
                                Find your location
                            </label>

                            <div className="relative mt-2">
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault()
                                        void handleSearchQuery()
                                    }}
                                    className="flex gap-2"
                                >
                                    <input
                                        value={searchQuery}
                                        onChange={(event) =>
                                            setSearchQuery(event.target.value)
                                        }
                                        onFocus={() => {
                                            if (suggestions.length) {
                                                setShowSuggestions(true)
                                            }
                                        }}
                                        onBlur={() =>
                                            setTimeout(
                                                () => setShowSuggestions(false),
                                                150
                                            )
                                        }
                                        placeholder="Search city or area"
                                        autoComplete="off"
                                        className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                                    />

                                    <button
                                        type="submit"
                                        disabled={searchLoading === 'true'}
                                        className="rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {searchLoading === 'true' ? (
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            'Search'
                                        )}
                                    </button>
                                </form>

                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white text-sm shadow-xl">
                                        {suggestions.map((suggestion, index) => (
                                            <li key={`${suggestion.label}-${index}`}>
                                                <button
                                                    type="button"
                                                    onMouseDown={(event) =>
                                                        event.preventDefault()
                                                    }
                                                    onClick={() =>
                                                        handleSelectSuggestion(
                                                            suggestion
                                                        )
                                                    }
                                                    className="block w-full truncate px-4 py-3 text-left text-gray-700 hover:bg-green-50"
                                                >
                                                    {suggestion.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="relative isolate mt-4 h-72 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-inner">
                                <CheckOutMap
                                    position={position}
                                    setPosition={setPosition}
                                />

                                <button
                                    type="button"
                                    onClick={handleCurrentLocation}
                                    className="absolute bottom-4 right-4 z-10 rounded-xl bg-white p-3 text-green-700 shadow-lg transition hover:bg-green-50"
                                    aria-label="Use my current location"
                                >
                                    <LocateFixed size={20} />
                                </button>
                            </div>

                            {locationError && (
                                <p className="mt-2 text-xs text-amber-700">
                                    {locationError}
                                </p>
                            )}

                            <p className="mt-2 text-xs text-gray-500">
                                Drag the pin to your exact delivery location.
                            </p>
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-green-100 bg-white p-6 shadow-lg lg:sticky lg:top-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            Payment & Summary
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Choose your preferred payment method.
                        </p>

                        <div className="mt-5 space-y-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentMethod('cod')
                                    setOrderError('')
                                    setProofMessage('')
                                }}
                                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                    paymentMethod === 'cod'
                                        ? 'border-green-600 bg-green-50'
                                        : 'border-gray-200 hover:bg-green-50'
                                }`}
                            >
                                <Truck
                                    size={21}
                                    className="shrink-0 text-green-700"
                                />

                                <span className="flex-1">
                                    <span className="block text-sm font-bold text-gray-800">
                                        Cash on delivery
                                    </span>

                                    <span className="mt-1 block text-xs text-gray-500">
                                        Pay when your groceries arrive
                                    </span>
                                </span>

                                <span
                                    className={`h-4 w-4 rounded-full border ${
                                        paymentMethod === 'cod'
                                            ? 'border-[5px] border-green-600'
                                            : 'border-gray-300'
                                    }`}
                                />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentMethod('online')
                                    setOrderError('')
                                    setProofMessage('')
                                }}
                                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                    paymentMethod === 'online'
                                        ? 'border-green-600 bg-green-50'
                                        : 'border-gray-200 hover:bg-green-50'
                                }`}
                            >
                                <CreditCard
                                    size={21}
                                    className="shrink-0 text-green-700"
                                />

                                <span className="flex-1">
                                    <span className="block text-sm font-bold text-gray-800">
                                        Easypaisa
                                    </span>

                                    <span className="mt-1 block text-xs text-gray-500">
                                        Transfer payment and upload proof
                                    </span>
                                </span>

                                <span
                                    className={`h-4 w-4 rounded-full border ${
                                        paymentMethod === 'online'
                                            ? 'border-[5px] border-green-600'
                                            : 'border-gray-300'
                                    }`}
                                />
                            </button>
                        </div>

                        {paymentMethod === 'online' && (
                            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4">
                                <div className="rounded-xl bg-white p-4 shadow-sm">
                                    <p className="text-xs font-semibold text-gray-500">
                                        Transfer payment to
                                    </p>

                                    <div className="mt-3">
                                        <p className="text-xs text-gray-500">
                                            Easypaisa Number
                                        </p>

                                        <p className="mt-1 text-lg font-bold tracking-wide text-green-700">
                                            {EASYPAISA_NUMBER}
                                        </p>
                                    </div>

                                    <div className="mt-3">
                                        <p className="text-xs text-gray-500">
                                            Account Name
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-gray-800">
                                            {EASYPAISA_ACCOUNT_NAME}
                                        </p>
                                    </div>

                                    <div className="mt-3 rounded-xl bg-green-50 p-3">
                                        <p className="text-xs text-gray-500">
                                            Amount to transfer
                                        </p>

                                        <p className="mt-1 text-xl font-bold text-green-700">
                                            Rs. {finalTotal.toLocaleString('en-PK')}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-gray-600">
                                    Transfer the exact amount to the Easypaisa
                                    number above and upload the transaction
                                    screenshot below.
                                </p>

                                <label className="mt-4 block text-xs font-semibold text-gray-600">
                                    Transaction screenshot

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) =>
                                            handleProofChange(
                                                event.target.files?.[0] ?? null
                                            )
                                        }
                                        className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700"
                                    />
                                </label>

                                {proofPreview && (
                                    <img
                                        src={proofPreview}
                                        alt="Transaction screenshot preview"
                                        className="mt-4 max-h-48 w-full rounded-xl border border-gray-200 object-contain bg-white p-2"
                                    />
                                )}

                                {proofMessage && (
                                    <p className="mt-3 text-xs leading-5 text-red-600">
                                        {proofMessage}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mt-6 border-t border-gray-100 pt-5">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-800">
                                    Rs. {subTotal.toLocaleString('en-PK')}
                                </span>
                            </div>

                            <div className="mt-3 flex justify-between text-sm text-gray-500">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-gray-800">
                                    {deliveryFee === 0
                                        ? 'Free'
                                        : `Rs. ${deliveryFee.toLocaleString(
                                              'en-PK'
                                          )}`}
                                </span>
                            </div>

                            <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-xl font-bold text-gray-800">
                                <span>Total</span>

                                <span className="text-green-700">
                                    Rs. {finalTotal.toLocaleString('en-PK')}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={orderLoading || !cartData.length}
                            onClick={() => {
                                if (paymentMethod === 'cod') {
                                    void handleCod()
                                } else {
                                    void handleOnlineOrder()
                                }
                            }}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {orderLoading ? (
                                <>
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Processing...
                                </>
                            ) : paymentMethod === 'cod' ? (
                                'Place Order'
                            ) : (
                                'Pay & Place Order'
                            )}
                        </button>

                        {orderError && (
                            <p className="mt-3 text-sm text-red-600">
                                {orderError}
                            </p>
                        )}

                        {!cartData.length && (
                            <p className="mt-3 text-center text-xs text-gray-500">
                                Your basket is empty.{' '}
                                <Link
                                    href="/"
                                    className="font-semibold text-green-700"
                                >
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