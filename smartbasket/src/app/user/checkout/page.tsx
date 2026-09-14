'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Building, CreditCard, CreditCardIcon, Loader2, LocateFixed, MapPin, Navigation, Search, Truck, User, Phone, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'

const CheckOutMap = dynamic(() => import("@/components/CheckoutMap"), { ssr: false });

function Checkout() {
    const router = useRouter()
    const { data: session } = useSession()
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
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Easypaisa states
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
            setAddress((prev) => ({ 
                ...prev, 
                fullName: userData.name || prev.fullName,
                mobile: userData.mobile || prev.mobile 
            }))
        } else if (session?.user) {
            setAddress((prev) => ({ 
                ...prev, 
                fullName: session.user?.name || prev.fullName,
            }))
        }
    }, [userData, session]);

    const handleSearchQuery = async () => {
        if (!searchQuery) return;
        setSearchLoading("true")
        try {
            const { OpenStreetMapProvider } = await import("leaflet-geosearch")
            const provider = new OpenStreetMapProvider()
            const results = await provider.search({ query: searchQuery });
            if (results && results.length > 0) {
                setPosition([results[0].y, results[0].x])
            }
        } catch (err) {
            console.error("Search error:", err)
        } finally {
            setSearchLoading("false")
        }
    }

    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) return
            try {
                const result = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${position[0]}&lon=${position[1]}&format=json`)
                if (result.data && result.data.address) {
                    setAddress(prev => ({
                        ...prev,
                        city: result.data.address.city || result.data.address.town || result.data.address.village || prev.city || "Rawalpindi",
                        state: result.data.address.state || prev.state || "Punjab",
                        pincode: result.data.address.postcode || prev.pincode || "46000",
                        fullAddress: result.data.display_name || prev.fullAddress || "Selected Location Address",
                    }))
                }
            } catch (error) {
                console.error("Error fetching address:", error)
            }
        }
        fetchAddress()
    }, [position])

    const handleCod = async () => {
        if (!position) {
            alert("Please select location on map or allow GPS location first!");
            return;
        }

        let userId = userData?._id || (session?.user as any)?.id || (session?.user as any)?._id;

        if (!userId) {
            try {
                const sessionRes = await axios.get("/api/auth/session");
                userId = sessionRes.data?.user?.id || sessionRes.data?.user?._id;
            } catch (err) {
                console.error("Session fetch error:", err);
            }
        }

        if (!userId) {
            alert("User session not found. Please log in again!");
            return;
        }

        if (!cartData || cartData.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                user: userId,
                items: cartData.map((item: any) => ({
                    grocery: item.grocery || item._id,
                    name: item.name || "Grocery Item",
                    price: String(item.price || 0),
                    unit: item.unit || "1 kg",
                    image: item.image || "",
                    quantity: Number(item.quantity) || 1
                })),
                paymentMethod: "cod",
                totalAmount: String(finalTotal),
                address: {
                    fullName: address.fullName || userData?.name || session?.user?.name || "Customer",
                    mobile: address.mobile || userData?.mobile || "03000000000",
                    city: address.city || "Rawalpindi",
                    state: address.state || "Punjab",
                    pincode: address.pincode || "46000",
                    fullAddress: address.fullAddress || "Full Address Provided",
                    latitude: position[0],
                    longitude: position[1]
                }
            };

            console.log("SENDING PAYLOAD TO API:", payload);

            const result = await axios.post("/api/user/order", payload);

            if (result.status === 200 || result.status === 201) {
                router.push("/user/order-success");
            }
        } catch (error: any) {
            console.error("API ERROR DETAILED:", error?.response?.data);
            alert(error?.response?.data?.message || "Something went wrong while placing order!");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    amount: String(finalTotal),
                    addressDetails: address,
                    userId: userData?._id || (session?.user as any)?.id
                }),
            });

            const data = await res.json();

            if (data.success) {
                setEpSuccess(true)
                setEpMessage("Success! Please check your mobile for the PIN popup and approve the payment.")
                router.push("/user/order-success")
            } else {
                setEpSuccess(false)
                setEpMessage(`Error: ${data.error}`)
            }
        } catch (err) {
            setEpSuccess(false)
            setEpMessage("Server error! Please try again.")
        } finally {
            setEpLoading(false)
        }
    }

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

    const handlePlaceOrder = () => {
        if (paymentMethod === "cod") {
            handleCod()
        } else {
            handleOnlineOrder()
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
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.fullName}
                                onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.mobile}
                                onChange={(e) => setAddress((prev) => ({ ...prev, mobile: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Mobile Number"
                            />
                        </div>

                        <div className="relative">
                            <Home className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.fullAddress}
                                placeholder='Full Address'
                                onChange={(e) => setAddress((prev) => ({ ...prev, fullAddress: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="relative">
                            <Building className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.city}
                                placeholder='City'
                                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="relative">
                            <Navigation className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.state}
                                placeholder='State'
                                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-green-600" size={18} />
                            <input
                                type="text"
                                value={address.pincode}
                                placeholder='Pincode'
                                onChange={(e) => setAddress((prev) => ({ ...prev, pincode: e.target.value }))}
                                className="pl-10 w-full border rounded-lg p-3 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="flex gap-2 mt-3">
                            <input 
                                type="text" 
                                placeholder="Search city or area..."
                                className="flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                            <button 
                                type="button"
                                className="bg-green-600 text-white px-5 rounded-lg hover:bg-green-700 transition-all font-medium flex items-center justify-center"
                                onClick={handleSearchQuery}
                            >
                                {searchLoading === "true" ? <Loader2 size={16} className='animate-spin' /> : "Search"}
                            </button>
                        </div>

                        <div className='relative mt-6 h-[330px] rounded-xl overflow-hidden border border-gray-200 shadow-inner'>
                            {position && <CheckOutMap position={position} setPosition={setPosition}/>}
                            
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.93 }}
                                className='absolute bottom-4 right-4 bg-green-600 text-white shadow-lg rounded-full p-3 hover:bg-green-700 transition-all flex items-center justify-center z-10'
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
                            type="button"
                            onClick={() => setPaymentMethod("online")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${
                                paymentMethod === "online" ? "border-green-600 bg-green-50 shadow-sm" : "hover:bg-gray-50"
                            }`}
                        >
                            <CreditCardIcon className='text-green-700' />
                            <span className='font-medium text-gray-700'>Pay Online</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPaymentMethod("cod")}
                            className={`flex items-center gap-3 w-full border rounded-lg p-3 transition-all ${
                                paymentMethod === "cod" ? "border-green-600 bg-green-50 shadow-sm" : "hover:bg-gray-50"
                            }`}
                        >
                            <Truck className='text-green-700' />
                            <span className='font-medium text-gray-700'>Cash on Delivery</span>
                        </button>
                    </div>

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
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        className='w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer'
                        disabled={isSubmitting || (paymentMethod === "online" && epLoading)}
                        onClick={handlePlaceOrder}
                    >
                        {isSubmitting || (paymentMethod === "online" && epLoading) ? (
                            <>
                                <Loader2 size={18} className='animate-spin' />
                                <span>Processing Order...</span>
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

export default Checkout;
