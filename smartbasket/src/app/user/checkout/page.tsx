'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    CreditCard,
    Loader2,
    LocateFixed,
    MapPin,
    Truck,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/redux/store'
import { clearCart } from '@/redux/cartSlice'

const CheckOutMap = dynamic(
    () => import('@/components/CheckoutMap'),
    { ssr: false }
)

const DEFAULT_POSITION: [number, number] = [33.6844, 73.0479]

// Replace these placeholders with your actual Easypaisa details.
const EASYPAISA_NUMBER = '03XX-XXXXXXX'
const EASYPAISA_ACCOUNT_NAME = 'SmartBasket'

type Address = {
    fullName: string
    mobile: string
    city: string
    state: string
    pincode: string
    fullAddress: string
}

type Suggestion = {
    label: string
    x: number
    y: number
}

type PaymentMethod = 'cod' | 'online'


function isValidPakMobile(value: string): {
    isValid: boolean
    error: string
} {
    const mobile = value.replace(/\D/g, '')

    if (!mobile) {
        return {
            isValid: false,
            error: 'Please enter your mobile number.',
        }
    }

    if (!/^03\d{9}$/.test(mobile)) {
        return {
            isValid: false,
            error: 'Enter a valid 11-digit Pakistani mobile number starting with 03.',
        }
    }

    // Reject numbers containing only one repeated digit.
    if (/^(\d)\1{10}$/.test(mobile)) {
        return {
            isValid: false,
            error: 'Repeated-digit mobile numbers are not allowed.',
        }
    }

    // Reject sequential digits such as 01234567890 or 98765432100.
    if (/^(?:0123456789|1234567890|2345678901|3456789012|4567890123|5678901234|6789012345|7890123456|8901234567|9012345678)\d?$/.test(mobile) ||
        /^(?:9876543210|8765432109|7654321098|6543210987|5432109876|4321098765|3210987654|2109876543|1098765432|0987654321)\d?$/.test(mobile)) {
        return {
            isValid: false,
            error: 'Sequential fake mobile numbers are not allowed.',
        }
    }

    // Reject common test or repeated patterns after the 03 prefix.
    const subscriber = mobile.slice(2)

    if (
        /^(\d)\1{8}$/.test(subscriber) ||
        /^(?:123456789|234567890|345678901|456789012|567890123|678901234|789012345|890123456|901234567)$/.test(subscriber)
    ) {
        return {
            isValid: false,
            error: 'Please enter a genuine Pakistani mobile number.',
        }
    }

    return { isValid: true, error: '' }
}


export default function Checkout() {
    const router = useRouter()
    const dispatch = useDispatch<AppDispatch>()

    const { userData } = useSelector(
        (state: RootState) => state.user
    )

    const { subTotal, deliveryFee, finalTotal, cartData } =
        useSelector((state: RootState) => state.cart)

    const [addressDraft, setAddress] = useState({
        fullName: undefined as string | undefined,
        mobile: undefined as string | undefined,
        city: '',
        state: '',
        pincode: '',
        fullAddress: '',
    })

    const address: Address = {
        fullName: addressDraft.fullName ?? userData?.name ?? '',
        mobile: addressDraft.mobile ?? userData?.mobile ?? '',
        city: addressDraft.city,
        state: addressDraft.state,
        pincode: addressDraft.pincode,
        fullAddress: addressDraft.fullAddress,
    }

    const [mobileError, setMobileError] = useState('')
    const [locationError, setLocationError] = useState('')
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [position, setPosition] =
        useState<[number, number]>(DEFAULT_POSITION)

    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>('cod')

    const [orderLoading, setOrderLoading] = useState(false)
    const [orderError, setOrderError] = useState('')

    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState('')
    const [proofMessage, setProofMessage] = useState('')
    
useEffect(() => {
    const savedDraft = sessionStorage.getItem(
        'smartbasket_checkout_draft'
    )

    if (!savedDraft) return

    try {
        const draft = JSON.parse(savedDraft)

        if (draft.addressDraft) {
            setAddress((previous) => ({
                ...previous,
                ...draft.addressDraft,
            }))
        }

        if (draft.paymentMethod) {
            setPaymentMethod(draft.paymentMethod)
        }

        if (
            Array.isArray(draft.position) &&
            draft.position.length === 2
        ) {
            setPosition(draft.position)
        }

        if (typeof draft.searchQuery === 'string') {
            setSearchQuery(draft.searchQuery)
        }
    } catch {
        sessionStorage.removeItem(
            'smartbasket_checkout_draft'
        )
    }
}, [])


    // Clean up the screenshot preview URL.
    useEffect(() => {
        return () => {
            if (proofPreview) {
                URL.revokeObjectURL(proofPreview)
            }
        }
    }, [proofPreview])

    // Get the customer's current location.
    useEffect(() => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition([
                    pos.coords.latitude,
                    pos.coords.longitude,
                ])
            },
            () => {
                setPosition(DEFAULT_POSITION)
            },
            {
                enableHighAccuracy: true,
                maximumAge: 60000,
                timeout: 10000,
            }
        )
    }, [])

    // Pakistani mobile number validation.
    const handleMobileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const mobile = event.target.value.replace(/\D/g, '')

        if (mobile.length > 11) return

        setAddress((previous) => ({
            ...previous,
            mobile,
        }))

        if (!mobile) {
            setMobileError('')
            return
        }

        const validation = isValidPakMobile(mobile)
        setMobileError(
            validation.isValid ? '' : validation.error
        )
    }

    // Search a location.
    const handleSearchQuery = async () => {
        const query = searchQuery.trim()

        if (!query) {
            setLocationError('Please enter a city or area.')
            return
        }

        setSearchLoading(true)
        setLocationError('')

        try {
            const { OpenStreetMapProvider } =
                await import('leaflet-geosearch')

            const provider = new OpenStreetMapProvider()
            const results = await provider.search({ query })

            if (results.length > 0) {
                setPosition([results[0].y, results[0].x])
                setShowSuggestions(false)
                setSuggestions([])
            } else {
                setLocationError(
                    `No location found for "${query}". Try another area.`
                )
            }
        } catch {
            setLocationError(
                'Could not search the location. Please try again.'
            )
        } finally {
            setSearchLoading(false)
        }
    }

    // Debounced address suggestions.
    useEffect(() => {
        const query = searchQuery.trim()
        let cancelled = false

        if (query.length < 3) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const timer = setTimeout(async () => {
            try {
                const { OpenStreetMapProvider } =
                    await import('leaflet-geosearch')

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

                setShowSuggestions(results.length > 0)
            } catch {
                if (!cancelled) {
                    setSuggestions([])
                    setShowSuggestions(false)
                }
            }
        }, 350)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [searchQuery])

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        setPosition([suggestion.y, suggestion.x])
        setSearchQuery(suggestion.label)
        setSuggestions([])
        setShowSuggestions(false)
        setLocationError('')
    }

    // Reverse geocoding: fill address from the map position.
    useEffect(() => {
        let cancelled = false

        const fetchAddress = async () => {
            try {
                const { data } = await axios.get(
                    'https://nominatim.openstreetmap.org/reverse',
                    {
                        params: {
                            lat: position[0],
                            lon: position[1],
                            format: 'json',
                        },
                    }
                )

                if (cancelled || !data?.address) return

                const result = data.address

                setAddress((previous) => ({
                    ...previous,
                    city:
                        result.city ||
                        result.town ||
                        result.village ||
                        result.municipality ||
                        previous.city,
                    state: result.state || previous.state,
                    pincode: result.postcode || previous.pincode,
                    fullAddress:
                        data.display_name || previous.fullAddress,
                }))
            } catch {
                // Keep manually entered address details if lookup fails.
            }
        }

        void fetchAddress()

        return () => {
            cancelled = true
        }
    }, [position])

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError(
                'Geolocation is not supported by this browser.'
            )
            return
        }

        setLocationError('')

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition([
                    pos.coords.latitude,
                    pos.coords.longitude,
                ])
            },
            () => {
                setLocationError(
                    'Could not access your location. Allow location permission or search your area.'
                )
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000,
            }
        )
    }

    // Validate checkout details before uploading proof or placing an order.
    const validateCheckout = useCallback((): boolean => {
        setOrderError('')

        const mobileValidation = isValidPakMobile(address.mobile)

        if (!mobileValidation.isValid) {
            setMobileError(mobileValidation.error)
            setOrderError(mobileValidation.error)
            return false
        }

        setMobileError('')

        const missing = (
            [
                'fullName',
                'mobile',
                'fullAddress',
                'city',
                'state',
                'pincode',
            ] as const
        ).filter((key) => !address[key].trim())

        if (missing.length > 0) {
            setOrderError(
                `Please fill in: ${missing.join(', ')}`
            )
            return false
        }

        if (!cartData.length) {
            setOrderError('Your basket is empty.')
            return false
        }

        return true
    }, [address, cartData.length])

const requireCustomerLogin = (): boolean => {
    if (userData?._id) {
        return true
    }

    // Checkout details temporarily save karo.
    sessionStorage.setItem(
        'smartbasket_checkout_draft',
        JSON.stringify({
            addressDraft,
            paymentMethod,
            position,
            searchQuery,
        })
    )

    // Login ke baad checkout par wapas aana hai.
    router.push(
        '/login?callbackUrl=%2Fuser%2Fcheckout'
    )

    return false
}

    // Place the order.
    const placeOrder = async (
        method: PaymentMethod,
        paymentProof?: string
    ) => {
        if (!validateCheckout()) return

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

          sessionStorage.removeItem(
    'smartbasket_checkout_draft'
)

dispatch(clearCart())
router.push('/user/order-success')
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setOrderError(
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    'Could not place order. Please try again.'
                )
            } else {
                setOrderError(
                    'An unexpected error occurred. Please try again.'
                )
            }
        } finally {
            setOrderLoading(false)
        }
    }

    // Screenshot selection and validation.
    const handleProofChange = (file: File | null) => {
        setProofFile(null)
        setProofMessage('')

        if (!file) {
            setProofPreview('')
            return
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ]

        if (!allowedTypes.includes(file.type)) {
            setProofPreview('')
            setProofMessage(
                'Please upload a JPG, PNG or WEBP image.'
            )
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setProofPreview('')
            setProofMessage(
                'Screenshot must be 5 MB or smaller.'
            )
            return
        }

        setProofFile(file)
        setProofPreview(URL.createObjectURL(file))
    }

    // Upload proof, then place the online-payment order.
    const handleOnlineOrder = async () => {
        if (!validateCheckout()) return

        if (!proofFile) {
            setProofMessage(
                'Please upload a screenshot of your transaction.'
            )
            return
        }

        setOrderLoading(true)
        setOrderError('')
        setProofMessage('')

        try {
            const formData = new FormData()
            formData.append('image', proofFile)

            const { data } = await axios.post(
                '/api/user/order/payment-proof',
                formData
            )

            if (!data?.url) {
                throw new Error('Payment proof URL was not returned.')
            }

            await placeOrder('online', data.url)
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setProofMessage(
                    error.response?.data?.message ||
                    'Could not upload the screenshot. Please try again.'
                )
            } else {
                setProofMessage(
                    'Could not complete online payment. Please try again.'
                )
            }
        } finally {
            setOrderLoading(false)
        }
    }

    const updateAddress = (
        key: keyof Address,
        value: string
    ) => {
        setAddress((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

  
const handleSubmit = (
    event: FormEvent<HTMLFormElement>
) => {
    event.preventDefault()

    if (orderLoading) return

    // Guest user ko login par bhejo.
    if (!requireCustomerLogin()) return

    if (paymentMethod === 'cod') {
        void placeOrder('cod')
    } else {
        void handleOnlineOrder()
    }
}


    return (
        <main className="min-h-screen bg-[#f0fdf4] to-green-50 pb-20">
            <div className="mx-auto w-[95%] max-w-6xl pt-8 sm:w-[90%]">
                <div className="relative flex items-center justify-center">
                    <Link
                        href="/user/cart"
                        className="absolute left-0 flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
                    >
                        <ArrowLeft size={20} />
                        <span className="hidden sm:inline">
                            Back to cart
                        </span>
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

                <nav
                    aria-label="Checkout progress"
                    className="mx-auto mt-8 flex max-w-4xl items-center justify-center gap-3 text-xs font-semibold sm:text-sm"
                >
                    <Link href="/user/cart" className="text-green-700">
                        01 Basket
                    </Link>
                    <span className="h-px w-10 bg-gray-300" />
                    <span className="text-green-700">02 Checkout</span>
                    <span className="h-px w-10 bg-gray-300" />
                    <span className="text-gray-400">03 Confirmation</span>
                </nav>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]"
                >
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
                            <label className="text-xs font-semibold text-gray-600">
                                Full name *
                                <input
                                    autoComplete="name"
                                    value={address.fullName}
                                    onChange={(e) =>
                                        updateAddress('fullName', e.target.value)
                                    }
                                    placeholder="Recipient name"
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-normal text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                                />
                            </label>

                            <label className="text-xs font-semibold text-gray-600">
                                Pakistani mobile number *
                                <input
                                    type="tel"
                                    autoComplete="tel"
                                    inputMode="numeric"
                                    maxLength={11}
                                    value={address.mobile}
                                    onChange={handleMobileChange}
                                    placeholder="03XXXXXXXXX"
                                    aria-invalid={Boolean(mobileError)}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-normal text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                                />
                                {mobileError && (
                                    <span className="mt-1 block text-xs text-red-600">
                                        {mobileError}
                                    </span>
                                )}
                            </label>

                            {(
                                [
                                    ['city', 'City', 'e.g. Islamabad'],
                                    ['state', 'Province / region', 'e.g. Punjab'],
                                    ['pincode', 'Postal code', 'e.g. 44000'],
                                ] as const
                            ).map(([key, label, placeholder]) => (
                                <label
                                    key={key}
                                    className="text-xs font-semibold text-gray-600"
                                >
                                    {label} *
                                    <input
                                        value={address[key]}
                                        onChange={(e) =>
                                            updateAddress(key, e.target.value)
                                        }
                                        placeholder={placeholder}
                                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-normal text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                                    />
                                </label>
                            ))}

                            <label className="text-xs font-semibold text-gray-600 sm:col-span-2">
                                Street address and landmarks *
                                <textarea
                                    rows={3}
                                    autoComplete="street-address"
                                    value={address.fullAddress}
                                    onChange={(e) =>
                                        updateAddress('fullAddress', e.target.value)
                                    }
                                    placeholder="House, street and nearby landmark"
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-normal text-gray-800 outline-none focus:border-green-500 focus:bg-white"
                                />
                            </label>
                        </div>

                        <div className="mt-7 border-t border-gray-100 pt-6">
                            <label
                                htmlFor="location-search"
                                className="text-xs font-semibold text-gray-600"
                            >
                                Find your location
                            </label>

                            <div className="relative mt-2">
                                <div className="flex gap-2">
                                    <input
                                        id="location-search"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        onFocus={() => {
                                            if (suggestions.length) {
                                                setShowSuggestions(true)
                                            }
                                        }}
                                        onBlur={() => {
                                            setTimeout(
                                                () => setShowSuggestions(false),
                                                200
                                            )
                                        }}
                                        placeholder="Search city or area"
                                        autoComplete="off"
                                        className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                                    />

                                    <button
                                        type="button"
                                        disabled={searchLoading}
                                        onClick={() => void handleSearchQuery()}
                                        className="rounded-xl bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {searchLoading ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            'Search'
                                        )}
                                    </button>
                                </div>

                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white text-sm shadow-xl">
                                        {suggestions.map((suggestion, index) => (
                                            <li key={`${suggestion.label}-${index}`}>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    onClick={() =>
                                                        handleSelectSuggestion(suggestion)
                                                    }
                                                    className="w-full truncate px-4 py-3 text-left text-gray-700 hover:bg-green-50"
                                                >
                                                    {suggestion.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="relative isolate mt-4 h-72 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                                <CheckOutMap
                                    position={position}
                                    setPosition={setPosition}
                                />
                                <button
                                    type="button"
                                    aria-label="Use my current location"
                                    onClick={handleCurrentLocation}
                                    className="absolute bottom-4 right-4 z-10 rounded-xl bg-white p-3 text-green-700 shadow-lg hover:bg-green-50"
                                >
                                    <LocateFixed size={20} />
                                </button>
                            </div>

                            {locationError && (
                                <p
                                    role="alert"
                                    className="mt-2 text-xs text-amber-700"
                                >
                                    {locationError}
                                </p>
                            )}

                            <p className="mt-2 text-xs text-gray-500">
                                Drag the map pin to your exact delivery location.
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
                            {(
                                [
                                    {
                                        value: 'cod',
                                        label: 'Cash on delivery',
                                        detail: 'Pay when your groceries arrive',
                                        Icon: Truck,
                                    },
                                    {
                                        value: 'online',
                                        label: 'Easypaisa',
                                        detail: 'Transfer payment and upload proof',
                                        Icon: CreditCard,
                                    },
                                ] as const
                            ).map(({ value, label, detail, Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={paymentMethod === value}
                                    onClick={() => {
                                        setPaymentMethod(value)
                                        setOrderError('')
                                        setProofMessage('')
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                                        paymentMethod === value
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-200 hover:bg-green-50'
                                    }`}
                                >
                                    <Icon
                                        size={21}
                                        className="shrink-0 text-green-700"
                                    />
                                    <span className="flex-1">
                                        <span className="block text-sm font-bold text-gray-800">
                                            {label}
                                        </span>
                                        <span className="mt-1 block text-xs text-gray-500">
                                            {detail}
                                        </span>
                                    </span>
                                    <span
                                        className={`h-4 w-4 rounded-full border ${
                                            paymentMethod === value
                                                ? 'border-[5px] border-green-600'
                                                : 'border-gray-300'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'online' && (
                            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4">
                                <div className="rounded-xl bg-white p-4">
                                    <p className="text-xs text-gray-500">
                                        Easypaisa number
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-green-700">
                                        {EASYPAISA_NUMBER}
                                    </p>

                                    <p className="mt-3 text-xs text-gray-500">
                                        Account name
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {EASYPAISA_ACCOUNT_NAME}
                                    </p>

                                    <p className="mt-3 text-xs text-gray-500">
                                        Amount to transfer
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-green-700">
                                        Rs. {finalTotal.toLocaleString('en-PK')}
                                    </p>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-gray-600">
                                    Transfer the exact amount and upload your transaction screenshot.
                                </p>

                                <label className="mt-4 block text-xs font-semibold text-gray-600">
                                    Transaction screenshot *
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) =>
                                            handleProofChange(
                                                e.target.files?.[0] ?? null
                                            )
                                        }
                                        className="mt-2 block w-full text-sm text-gray-600"
                                    />
                                    <span className="mt-1 block font-normal text-gray-500">
                                        JPG, PNG or WEBP; maximum 5 MB.
                                    </span>
                                </label>

                                {proofPreview && (
                                    <img
                                        src={proofPreview}
                                        alt="Transaction screenshot preview"
                                        className="mt-4 max-h-48 w-full rounded-xl border border-gray-200 bg-white p-2 object-contain"
                                    />
                                )}

                                {proofMessage && (
                                    <p
                                        role="alert"
                                        className="mt-3 flex items-start gap-1 text-xs text-red-600"
                                    >
                                        <AlertCircle size={15} />
                                        {proofMessage}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-800">
                                    Rs. {subTotal.toLocaleString('en-PK')}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Delivery fee</span>
                                <span className="font-semibold text-gray-800">
                                    {deliveryFee === 0
                                        ? 'Free'
                                        : `Rs. ${deliveryFee.toLocaleString('en-PK')}`}
                                </span>
                            </div>

                            <div className="flex justify-between border-t border-gray-100 pt-4 text-xl font-bold text-gray-800">
                                <span>Total</span>
                                <span className="text-green-700">
                                    Rs. {finalTotal.toLocaleString('en-PK')}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={orderLoading || !cartData.length}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <p
                                role="alert"
                                className="mt-3 flex items-start gap-2 text-sm text-red-600"
                            >
                                <AlertCircle
                                    size={17}
                                    className="shrink-0"
                                />
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
                </form>
            </div>
        </main>
    )
}