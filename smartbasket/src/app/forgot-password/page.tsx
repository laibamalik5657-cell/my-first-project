
"use client"

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Loader2,
  Mail,
  MailCheck,
} from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import axios from "axios"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const previousSent = useRef(sent)

  useEffect(() => {
    if (previousSent.current !== sent) {
      if (sent) headingRef.current?.focus()
      else emailRef.current?.focus()
      previousSent.current = sent
    }
  }, [sent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError("")

    try {
      await axios.post("/api/auth/forgot-password", {
        email: email.trim(),
      })
      setSent(true)
    } catch (err: unknown) {
      setError(
        (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Could not send the reset email. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

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

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              {sent ? (
                <MailCheck className="h-7 w-7 text-green-600" />
              ) : (
                <Mail className="h-7 w-7 text-green-600" />
              )}
            </div>
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-extrabold tracking-tight text-green-700 outline-none"
          >
            {sent ? "Check Your Inbox" : "Forgot Password?"}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {sent
              ? "Follow the link in your email to reset your password."
              : "Enter your email to receive a password reset link."}
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-green-600" />
              <p className="text-sm leading-6 text-green-900">
                If an account exists for{" "}
                <span className="break-all font-semibold">{email.trim()}</span>,
                a password reset link is on its way.
              </p>
            </div>

            <p className="mt-5 text-center text-sm leading-6 text-slate-500">
              Don’t see the email? Check your spam or junk folder.
            </p>

            <button
              type="button"
              onClick={() => {
                setSent(false)
                setError("")
              }}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Try Another Email
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7"
          >
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                disabled={loading}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "forgot-error" : undefined}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#eaf1ff] py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 disabled:opacity-60"
              />
            </div>

            {error && (
              <p
                id="forgot-error"
                role="alert"
                className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!email.trim() || loading}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mx-auto mt-6 flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <p className="mt-7 text-center text-sm text-slate-500">
          Fresh Groceries, Better Living
        </p>
      </div>
    </main>
  )
}

export default ForgotPassword
