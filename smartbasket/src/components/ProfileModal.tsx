'use client'

import axios from 'axios'
import { Loader2, Lock, X, CheckCircle2, AlertCircle, Phone, User, MapPin } from 'lucide-react'
import ProfilePictureEditor from './ProfilePictureEditor'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { setUserData } from '@/redux/userSlice'
import type { AppDispatch } from '@/redux/store'
import { MIN_PASSWORD_LENGTH, validatePassword } from '@/lib/password'

interface IUser {
    _id?: string
    name: string
    email: string
    mobile?: string
    address?: string
    role: "user" | "deliveryBoy" | "admin" | "shopkeeper"
    image?: string
}

/** Pakistani Mobile Number Validator */
const validatePakistaniMobile = (mobile: string): boolean => {
    // Allows formats: 03xxxxxxxxx, +923xxxxxxxxx, or 923xxxxxxxxx
    const pkRegex = /^((\+92)|(92)|(0))3\d{9}$/
    return pkRegex.test(mobile.trim())
}

function ProfileModal({ user, onClose }: { user: IUser; onClose: () => void }) {
    const router = useRouter()
    const dispatch = useDispatch<AppDispatch>()
    const [tab, setTab] = useState<'details' | 'password'>('details')

    const [form, setForm] = useState({
        name: user?.name ?? '',
        mobile: user?.mobile ?? '',
        address: user?.address ?? '',
    })
    const [detailsState, setDetailsState] = useState({ loading: false, error: '', saved: false })

    const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
    const [pwState, setPwState] = useState({ loading: false, error: '', saved: false })

    const saveDetails = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (form.name.trim().length < 2) {
            return setDetailsState({ loading: false, error: 'Name must be at least 2 characters', saved: false })
        }
        
        // Strict Pakistani mobile validation check
        if (!validatePakistaniMobile(form.mobile)) {
            return setDetailsState({ 
                loading: false, 
                error: 'Please enter a valid Pakistani phone number (e.g., 03001234567 or +923001234567)', 
                saved: false 
            })
        }

        setDetailsState({ loading: true, error: '', saved: false })
        try {
            const result = await axios.put('/api/user/profile', form)
            dispatch(setUserData(result.data.user))
            setDetailsState({ loading: false, error: '', saved: true })
            router.refresh()
        } catch (err: any) {
            setDetailsState({
                loading: false,
                error: err?.response?.data?.message || 'Could not save your profile. Please try again.',
                saved: false,
            })
        }
    }

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        const strengthError = validatePassword(pw.newPassword)
        if (strengthError) {
            return setPwState({ loading: false, error: strengthError, saved: false })
        }
        if (pw.newPassword !== pw.confirm) {
            return setPwState({ loading: false, error: 'The two passwords do not match', saved: false })
        }

        setPwState({ loading: true, error: '', saved: false })
        try {
            await axios.post('/api/user/profile/password', {
                currentPassword: pw.currentPassword,
                newPassword: pw.newPassword,
            })
            setPw({ currentPassword: '', newPassword: '', confirm: '' })
            setPwState({ loading: false, error: '', saved: true })
        } catch (err: any) {
            setPwState({
                loading: false,
                error: err?.response?.data?.message || 'Could not change your password. Please try again.',
                saved: false,
            })
        }
    }

    const fieldClass = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all'

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-md relative border border-gray-100 max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
                {/* Close Button */}
                <button
                    aria-label="Close profile"
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative group mb-3">
                        <ProfilePictureEditor image={user.image} name={user.name} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{user?.name}</h2>
                    <p className="text-xs text-gray-500 font-medium mb-2">{user?.email}</p>
                    <span className="text-[11px] uppercase tracking-wider px-3 py-1 bg-green-50 text-green-700 ring-1 ring-green-600/20 rounded-full font-semibold">
                        {user?.role}
                    </span>
                </div>

                {/* Animated Tab Switcher */}
                <div className="flex gap-1 mb-6 bg-gray-100/80 p-1.5 rounded-2xl relative">
                    <button
                        onClick={() => setTab('details')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors relative z-10 ${
                            tab === 'details' ? 'text-green-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab === 'details' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                        )}
                        <span className="relative z-10">Details</span>
                    </button>
                    <button
                        onClick={() => setTab('password')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors relative z-10 ${
                            tab === 'password' ? 'text-green-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab === 'password' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                        )}
                        <span className="relative z-10">Password</span>
                    </button>
                </div>

                {/* Tab Contents */}
                <AnimatePresence mode="wait">
                    {tab === 'details' ? (
                        <motion.form
                            key="details"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
                            onSubmit={saveDetails}
                            className="space-y-4"
                        >
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    Name
                                </label>
                                <input
                                    className={fieldClass}
                                    placeholder="Enter full name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    Pakistani Mobile Number
                                </label>
                                <input
                                    className={fieldClass}
                                    type="tel"
                                    placeholder="03001234567 "
                                    value={form.mobile}
                                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    Address
                                </label>
                                <textarea
                                    className={fieldClass}
                                    rows={3}
                                    maxLength={300}
                                    placeholder="Enter complete delivery address"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={detailsState.loading}
                                className="w-full mt-2 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 active:scale-[0.99] disabled:bg-green-300 transition-all shadow-lg shadow-green-600/20"
                            >
                                {detailsState.loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
                            </button>

                            {detailsState.error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs border border-red-100">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{detailsState.error}</span>
                                </div>
                            )}

                            {detailsState.saved && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-xs border border-green-100">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>Profile updated successfully.</span>
                                </div>
                            )}
                        </motion.form>
                    ) : (
                        <motion.form
                            key="password"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            onSubmit={savePassword}
                            className="space-y-4"
                        >
                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Current Password</label>
                                <input
                                    type="password"
                                    className={fieldClass}
                                    value={pw.currentPassword}
                                    onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">New Password</label>
                                <input
                                    type="password"
                                    className={fieldClass}
                                    value={pw.newPassword}
                                    onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    className={fieldClass}
                                    value={pw.confirm}
                                    onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                                />
                            </div>

                            <p className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                At least {MIN_PASSWORD_LENGTH} characters, including a letter and a number.
                            </p>

                            <button
                                type="submit"
                                disabled={pwState.loading || !pw.currentPassword}
                                className="w-full mt-2 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 active:scale-[0.99] disabled:bg-green-300 transition-all shadow-lg shadow-green-600/20"
                            >
                                {pwState.loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Change Password'}
                            </button>

                            {pwState.error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs border border-red-100">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{pwState.error}</span>
                                </div>
                            )}

                            {pwState.saved && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700 text-xs border border-green-100">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>Password updated successfully.</span>
                                </div>
                            )}
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default ProfileModal