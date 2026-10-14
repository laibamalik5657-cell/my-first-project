
'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
    Bike,
    User,
    ArrowRight,
    Loader2,
    Store,
} from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

function EditRoleMobile({
    assignedRole = 'user',
}: {
    assignedRole?: string
}) {
    const router = useRouter()
    const { update } = useSession()

    // Admin already exists or not
    const [adminExists, setAdminExists] = useState(false)

    // Check database when page opens
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await axios.get('/api/user/check-admin')
                setAdminExists(res.data.adminExists)
            } catch (error) {
                console.log(error)
            }
        }

        void checkAdmin()
    }, [])

    // Normal roles
    const roles = [
        {
            id: 'user',
            label: 'Customer',
            icon: User,
        },
        {
            id: 'deliveryBoy',
            label: 'Delivery Boy',
            icon: Bike,
        },
        {
            id: 'shopkeeper',
            label: 'Shopkeeper',
            icon: Store,
        },
    ]

    const [selectedRole, setSelectedRole] = useState(
        assignedRole === 'user' ? '' : assignedRole
    )

    const [mobile, setMobile] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleEdit = async () => {
        if (!selectedRole || !validMobile || loading) return

        setLoading(true)
        setError('')

        try {
            await axios.post('/api/user/edit-role-mobile', {
                role: selectedRole,
                mobile,
            })

            await update({ role: selectedRole })

            router.push('/')
            router.refresh()
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    'Could not save your details. Please try again.'
                )
            } else {
                setError(
                    'Could not save your details. Please try again.'
                )
            }
        } finally {
            setLoading(false)
        }
    }

    const validMobile = /^\d{10,15}$/.test(mobile)

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-6">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-8 text-center text-3xl font-extrabold text-green-700 md:text-4xl"
            >
                {assignedRole === 'user'
                    ? 'Select Your Role'
                    : 'Complete Your Profile'}
            </motion.h1>

            {assignedRole === 'user' && (
                <div className="mt-8 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => {
                        const Icon = role.icon
                        const isSelected = selectedRole === role.id

                        return (
                            <motion.button
                                type="button"
                                aria-pressed={isSelected}
                                key={role.id}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => setSelectedRole(role.id)}
                                className={`flex h-44 w-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                                    isSelected
                                        ? 'border-green-600 bg-green-100 shadow-lg'
                                        : 'border-gray-300 bg-white hover:border-green-400'
                                }`}
                            >
                                <Icon
                                    size={40}
                                    className={
                                        isSelected
                                            ? 'text-green-700'
                                            : 'text-gray-600'
                                    }
                                />

                                <span className="mt-3 text-lg font-semibold text-gray-800">
                                    {role.label}
                                </span>
                            </motion.button>
                        )
                    })}
                </div>
            )}

            {/* MOBILE */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-10 flex flex-col items-center"
            >
                <label
                    htmlFor="mobile"
                    className="mb-2 font-medium text-gray-700"
                >
                    Enter Your Mobile Number
                </label>

                <input
                    type="tel"
                    id="mobile"
                    value={mobile}
                    className="w-64 rounded-xl border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 md:w-80"
                    placeholder="eg. 03001234567"
                    onChange={(e) => setMobile(e.target.value)}
                />
            </motion.div>

            {/* BUTTON */}
            <motion.button
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                disabled={!(selectedRole && validMobile) || loading}
                className={`mt-20 inline-flex w-[200px] items-center justify-center gap-2 rounded-2xl px-8 py-3 font-semibold shadow-md ${
                    selectedRole && validMobile && !loading
                        ? 'cursor-pointer bg-green-600 text-white hover:bg-green-700'
                        : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
                onClick={() => void handleEdit()}
            >
                {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <>
                        Go to Home
                        <ArrowRight size={20} />
                    </>
                )}
            </motion.button>

            {error && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
}

export default EditRoleMobile
