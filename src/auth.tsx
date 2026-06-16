import NextAuth from "next-auth"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import connectDb from "../lib/db"
import UserModel from "../models/user.model"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"

interface TokenWithUser extends JWT {
    id?: string
    email?: string
    name?: string
    role?: string
}

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
                const user = await UserModel.findOne({ email })
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
    asyn signIn({user, account}){
        if(account?.provider=="google"){
            await connectDb()
            let dbUser=await User.findOne({email:user.email}
                if(!dbUser){
                    dbUser=await User.create({
                        name:user.name,
                           email:user.email,
                           image:user.image

                    })
                }
        }
user.id=dbUser._idtoString()
user.role=dbUser.role }
return true


    },
        jwt(params: { token: JWT; user?: unknown }) {
            const { token, user } = params
            const typedToken = token as TokenWithUser
            if (user && typeof user !== "string") {
                const typedUser = user as {
                    id?: string
                    email?: string | null
                    name?: string | null
                    role?: string
                }
                typedToken.id = typedUser.id ?? ''
                typedToken.email = typedUser.email ?? ''
                typedToken.name = typedUser.name ?? ''
                typedToken.role = typedUser.role ?? ''
            }
            return typedToken
        },
        session(params: { session: Session; token: JWT }) {
            const { session, token } = params
            const typedToken = token as TokenWithUser
            if (session.user) {
                session.user.id = typedToken.id ?? ''
                session.user.role = typedToken.role ?? ''
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
        maxAge: 10 * 24 * 60 * 60, // 10 days in seconds
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)
//connectDb()
//email check
//password match