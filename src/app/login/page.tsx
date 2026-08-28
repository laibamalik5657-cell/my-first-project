"use client"
import { EyeIcon, EyeOff, Leaf, Loader2, Lock, LogIn as LogInIcon, Mail } from 'lucide-react'
import React, { FormEvent, useState } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import googleImage from '../../assets/google.png'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function LogIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [error, setError] = useState('')
  const session = useSession()
  console.log(session)

  const handleLogin = async (e:FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      router.push("/login")

      if (result?.error) {
        setError('Login failed. Please check your credentials.')
      } else {
        setError('')
        router.push('/')
      }

      console.log('login request', { email, password })
    } catch (err) {
      console.error(err)
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const formValidation = email !== '' && password !== ''

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-white relative">
      <motion.h1
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-green-700 mb-2"
      >
        Welcome Back
      </motion.h1>

      <p className="text-gray-800 mb-8 flex items-center gap-1">
        Login to SmartBasket <Leaf className="w-5 h-5 text-green-500" />
      </p>

      <motion.form
        onSubmit={handleLogin}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Your Email"
            className="w-full pr-4 py-3 pl-10 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Your Password"
            className="w-full pr-4 py-3 pl-10 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          {showPassword ? (
            <EyeOff
              className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <EyeIcon
              className="absolute right-3 top-3.5 w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300" onClick={()=>signIn("google")}
          disabled={!formValidation || loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Login'}
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-gray-300" />
          <span className="relative bg-white px-3 text-sm font-medium text-gray-400">OR</span>
        </div>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      
      <div className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-100"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <Image src={googleImage} width={20} height={20} alt="Google" />
          Continue with Google
        </div>
        </motion.form>
      <p className="cursor-pointer mt-6 text-gray-600 text-sm flex items-center gap-1" onClick={() => router.push('/register')}>
        Do not have an account?
        <LogInIcon className="w-4 h-4" />
        <span className="text-green-600">Sign Up</span>
      </p>
    </div>
  )
}

export default LogIn