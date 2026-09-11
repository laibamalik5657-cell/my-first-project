'use client'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Building, CreditCard, CreditCardIcon, Import, Loader2, LocateFixed, MapPin, Navigation, Search, Truck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { Phone } from 'lucide-react'
import { Home } from 'lucide-react'
import { useEffect } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), { ssr: false });


function Checkout() {
    const router = useRouter()
    const { userData } = useSelector((state: RootState) => state.user)
    const { subTotal, deliveryFee, finalTotal, cartData } = useSelector((state: RootState) => state.cart)
    const [address, setAddress] = useState({
        fullName: "",
        mobile: "",
        city: "",
        state: "",
        pincode: "",
        fullAddress: "",
    })
    const [searchLoading, setSearchLoading] = useState("false")
    const [searchQuery, setSearchQuery] = useState("")
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod")

    // --- Easypaisa states ---
    const [epMobileNumber, setEpMobileNumber] = useState("")
    const [epEmail, setEpEmail] = useState("")
    const [epLoading, setEpLoading] = useState(false)
    const [epMessage, setEpMessage] = useState("")
    const [epSuccess, setEpSuccess] = useState(false)

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                },
                (err) => {
                    console.log('location error', err);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        }
    }, []);

    useEffect(() => {
        if (userData) {
            setAddress((prev) => ({ ...prev, fullName: userData.name || "" }))
            setAddress((prev) => ({ ...prev, mobile: userData.mobile || "" }))
        }
    }, [userData]);

  

    const handleSearchQuery = async () => {
        setSearchLoading("true")
        const {OpenStreetMapProvider}=await import("leaflet-geosearch")
        const provider = new OpenStreetMapProvider()
        const results = await provider.search({ query: searchQuery });
        if (results) {
            setSearchLoading("false")
            setPosition([results[0].y, results[0].x])
        }
    }

    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) return
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?
                lat=${position[0]}&lon=${position[1]}&format=json`)
            } catch (error) {
                console.error("Error fetching address:", error)
            }
        }
        fetchAddress()
    }, [position])

    const handleCod = async () => {
        if (!position) {
            return null
        }
        try {
            const result = await axios.post("/api/user/order", {
                userId: userData?._id,
                items: cartData.map(item => ({
                    grocery: item._id,
                    name: item.name,
                    price: item.price,
                    unit: item.unit,
                    image: item.image,
                    quantity: item.quantity
                })),
                paymentMethod: "cod",
                totalAmount: finalTotal,
                address: {
                    fullName: address.fullName,
                    mobile: address.mobile,
                    city: address.city,
                    state: address.state,
                    fullAddress: address.fullAddress,
                    pincode: address.pincode,
                    latatitude: position?.[0],
                    longitude: position[1]
                },
               
            })
            router.push("/user/order-success")
        } catch (error) {
            console.error(error)
        }
    }

    // --- Easypaisa Payment Trigger Function ---
    const handleOnlineOrder = async () => {
        if (!epMobileNumber || !epEmail) {
            setEpSuccess(false)
            setEpMessage("Error: Please enter your Easypaisa number and email.")
            return;
        }

        setEpLoading(true)
        setEpMessage("")
        setEpSuccess(false)

        try {
            const res = await fetch("/api/easypaisa/direct-pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mobileNumber: epMobileNumber,
                    email: epEmail,
                    amount: finalTotal.toString(),
                    addressDetails: address,
                    userId: userData?._id
                }),
            });

            const data = await res.json();

            if (data.success) {
                setEpSuccess(true)
                setEpMessage("Success! Please check your mobile for the PIN popup and approve the payment.")
                // Optionally redirect to success page after approval
                // router.push("/user/order-success")
            } else {
                setEpSuccess(false)
                setEpMessage(`Error: ${data.error}`)
            }
        } catch (err) {
            setEpSuccess(false)
            setEpMessage("Server error! Please try again.")
        } {
            setEpLoading(false)
        }
    }

    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) return null
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                console.log(result.data)
                setAddress(prev => ({
                    ...prev,
                    city: result.data.address.city,
                    state: result.data.address.state,
                    pincode: result.data.address.postcode,
                    fullAddress: result.data.display_name,
                }))
            } catch (error) {
                console.log(error)
            }
        }
        fetchAddress()
    }, [position]);

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                },
                (err) => {
                    console.log('location error', err);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        }
    }

    return (
        <div className='w-[92%] md:w-[80%] mx-auto py-10 relative'>
            <motion.button
                whileTap={{ scale: 0.97 }}
                className='absolute left-0 top-2 flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold'
                onClick={() => router.push("/user/cart")}
            >
                <ArrowLeft size={16} />
                <span>Back to cart</span>
            </motion.button>
            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='text-3xl md:text-4xl font-bold text-green-700 text-center mb-10'
            >
                Checkout
            </motion.h1>

            <div className='grid md:grid-cols-2 gap-8'>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100'
                >
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-4">
                        <MapPin className="text-green-700" /> Delivery Address
                    </h2>
                    <div className="space-y-4">
                        {/* Full Name */}
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.fullName}
                                onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.mobile}
                                onChange={(e) => setAddress((prev) => ({ ...prev, mobile: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50"
                            />
                        </div>

                        {/* Street Address */}
                        <div className="relative">
                            <Home className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.fullAddress}
                                placeholder='Full Address'
                                onChange={(e) => setAddress((prev) => ({ ...prev, fullAddress: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50"
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-3'></div>
                        {/* City */}
                        <div className="relative">
                            <Building className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.city}
                                placeholder='city'
                                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50"
                            />
                        </div>
                        <div className="relative">
                            <Navigation className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.state}
                                placeholder='state'
                                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50"
                            />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.pincode}
                                placeholder='pincode'
                                onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50"
                            />
                        </div>

                        <div className="flex gap-2 mt-3">
                            <input type="text" placeholder="search city or area..."
                                className="flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} />

                            <button className="bg-green-600 text-white px-5 rounded-lg hover:bg-green-700 transition-all font-medium"
                                onClick={handleSearchQuery}>{searchLoading === "true" ? <Loader2 size={16}
                                    className='animate-spin' /> : "Search"}</button>
                        </div>
                        <div className='relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner' >
                            {position &&  <CheckOutMap position={position} setPosition={setPosition}/>}
                              

                                    <motion.button
                                        whileTap={{ scale: 0.93 }}
                                        className='absolute bottom-4 right-4 bg-green-600 text-white shadow-lg rounded-full p-3
                                     hover:bg-green-700 transition-all flex items-center justify-center z-[999]'
                                        onClick={handleCurrentLocation}
                                    >
                                        <LocateFixed size={22} />
                                    </motion.button>

                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className='bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 h-fit'
                >
                    <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                        <CreditCard className='text-green-600' />
                        Payment Method
                    </h2>
                    <div className='space-y-4 mb-6'>
                        <button
                            onClick={() => setPaymentMethod("online")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "online"
                                ? "border-green-600 bg-green-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}
                        >
                            <CreditCardIcon className='text-green-700' />
                            <span className='font-medium text-gray-700'>Pay Online</span>
                        </button>

                        <button
                            onClick={() => setPaymentMethod("cod")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${paymentMethod === "cod"
                                ? "border-green-600 bg-green-50 shadow-sm"
                                : "hover:bg-gray-50"
                                }`}
                        >
                            <Truck className='text-green-700' />
                            <span className='font-medium text-gray-700'>Cash on Delivery</span>
                        </button>
                    </div>

                    {/* --- Easypaisa Inputs (shown when online is selected) --- */}
                    {paymentMethod === "online" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3 mb-6"
                        >
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Easypaisa Wallet Details</p>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 03XXXXXXXXX"
                                    value={epMobileNumber}
                                    onChange={(e) => setEpMobileNumber(e.target.value)}
                                    className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="customer@email.com"
                                    value={epEmail}
                                    onChange={(e) => setEpEmail(e.target.value)}
                                    className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white outline-none"
                                />
                            </div>
                            {epMessage && (
                                <p className={`text-xs font-medium p-2 rounded text-center ${epSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {epMessage}
                                </p>
                            )}
                        </motion.div>
                    )}

                    <div className='border-t pt-4 text-gray-700 space-y-2 text-sm sm:text-base'>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Subtotal</span>
                            <span className='font-semibold text-green-600'>Rs.{subTotal}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='font-semibold'>Delivery Fee</span>
                            <span className='font-semibold text-green-600'>Rs.{deliveryFee}</span>
                        </div>
                        <div className='flex justify-between font-bold text-lg border-t pt-3'>
                            <span>Total</span>
                            <span className='font-semibold text-green-600'>Rs.{finalTotal}</span>
                        </div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.93 }}
                        className='w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2'
                        disabled={paymentMethod === "online" && epLoading}
                        onClick={() => {
                            if (paymentMethod === "cod") {
                                handleCod()
                            } else {
                                handleOnlineOrder()
                            }
                        }}
                    >
                        {paymentMethod === "online" && epLoading ? (
                            <>
                                <Loader2 size={18} className='animate-spin' />
                                <span>Processing...</span>
                            </>
                        ) : (
                            paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"
                        )}
                    </motion.button>
                </motion.div>
            </div>
        </div>
    )
}

export default Checkout