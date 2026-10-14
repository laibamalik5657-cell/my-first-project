
"use client"

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import React, { Suspense, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import { MIN_PASSWORD_LENGTH, validatePassword } from "@/lib/password"

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const strengthError = validatePassword(password)
    if (strengthError) {
      setError(strengthError)
      return
    }

    if (password !== confirm) {
      setError("The two passwords do not match")
      return
    }

    setLoading(true)
    setError("")

    try {
      await axios.post("/api/auth/reset-password", {
        token,
        password,
      })
      setDone(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: unknown) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Could not reset your password. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <LockKeyhole className="h-7 w-7 text-red-500" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-slate-800">
          Invalid Reset Link
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This reset link is missing its token. Please request a new one.
        </p>

        <Link
          href="/forgot-password"
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Request a New Link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-green-700">
          Password Updated!
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your password has been changed successfully. Taking you to the login page…
        </p>

        <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7"
    >
      <div>
        <label
          htmlFor="new-password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          New Password
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError("")
            }}
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#eaf1ff] py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
          />

          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-green-700"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="confirm-password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Confirm New Password
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setError("")
            }}
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#eaf1ff] py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
          />

          <button
            type="button"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-green-700"
          >
            {showConfirm ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {confirm.length > 0 && (
          <p
            className={`mt-2 flex items-center gap-1 text-xs ${
              password === confirm ? "text-green-700" : "text-slate-500"
            }`}
          >
            {password === confirm && (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {password === confirm
              ? "Passwords match"
              : "Make sure both passwords match"}
          </p>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Password Requirements
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              At least {MIN_PASSWORD_LENGTH} characters, including a letter and a number.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!password || !confirm || loading}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            Set New Password
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Link
          href="/login"
          className="flex min-h-10 items-center justify-center gap-2 text-sm font-medium text-slate-600 transition hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    </motion.form>
  )
}

function ResetPassword() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 py-10 text-slate-900">
      <Link
        href="/"
        aria-label="SmartBasket home"
        className="mb-8 inline-flex items-center gap-2.5 rounded-lg text-xl font-bold tracking-tight text-green-700 outline-none focus-visible:ring-2 focus-visible:ring-green-600"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
          <Leaf className="h-6 w-6 text-green-600" />
        </span>
        SmartBasket
      </Link>

      <div className="mb-8 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
            <LockKeyhole className="h-7 w-7 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-green-700">
          Reset Password
        </h1>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-slate-600">
          Choose a new password for your account
          <Leaf className="h-4 w-4 text-green-500" />
        </p>
      </div>

      <Suspense
        fallback={
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        }
      >
        <ResetPasswordForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-slate-500">
        Fresh Groceries, Better Living
      </p>
    </main>
  )
}

export default ResetPassword
