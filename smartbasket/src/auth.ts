import NextAuth from "next-auth"
import type { Session } from "next-auth"
import  type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import connectDb from "./lib/db"
import User from "./models/user.model"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"


interface TokenWithUser extends JWT {
    id?: string
    email?: string
    name?: string
    role?: string}
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        await connectDb()
        const email = credentials?.email
        const password = credentials?.password as string
        const user = await User.findOne({ email })
        if (!user) {
          throw new Error("user does not exist")
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          throw new Error("incorrect password")
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
   Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "select_account",
    },
  },
})
  ],
  callbacks: {
    // token ke ander user ka data dalta hai
    async signIn({ user, account }) {
        if (account?.provider == "google") {
            await connectDb()
            let dbUser = await User.findOne({ email: user.email })
            if (!dbUser) {
                dbUser = await User.create({
                    name: user.name,
                    email: user.email,
                    image: user.image
                })
            }

            user.id = dbUser._id.toString()
            user.role = dbUser.role
        }
        return true
    },
   const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        await connectDb()
        const email = credentials?.email
        const password = credentials?.password as string
        const user = await User.findOne({ email })
        if (!user) {
          throw new Error("No user found with this email")
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          throw new Error("Invalid password")
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }: { user: any; account?: any }) {
      if (account?.provider === "google") {
        await connectDb()
        let dbUser = await User.findOne({ email: user.email })
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
          })
        }
        user.id = dbUser._id.toString()
        user.role = dbUser.role
      }
      return true
    },
    // Location 1 Fix: jwt function callbacks ke andar aa gaya
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 10 * 24 * 60 * 60, // Location 3 Fix: *1000 removed
  },
  secret: process.env.AUTH_SECRET,
)}