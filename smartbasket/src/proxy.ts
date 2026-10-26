import { NextRequest, NextResponse } from "next/server"
import { auth } from "./auth"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/.well-known/")) {
    return NextResponse.next()
  }

  // 1. Allow public routes without authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/api/auth",
  ]

  if (
    publicRoutes.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.next()
  }

  // 2. Routes guests can access
  const guestAllowedRoutes = [
    "/",
    "/user/cart",
    "/user/checkout",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/api/auth",
  ]

  const isGuestAllowed = guestAllowedRoutes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  const session = await auth()

  if (!session && !isGuestAllowed) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${req.nextUrl.search}`
    )
    return NextResponse.redirect(loginUrl)
  }

  const role = session?.user?.role

  // 3. Customer-only routes
  if (
    session &&
    pathname.startsWith("/user") &&
    role !== "user"
  ) {
    return NextResponse.redirect(
      new URL("/unauthorized", req.url)
    )
  }

  // 4. Delivery Boy-only routes
  if (
    session &&
    pathname.startsWith("/delivery") &&
    role !== "deliveryBoy"
  ) {
    return NextResponse.redirect(
      new URL("/unauthorized", req.url)
    )
  }

  // 5. Admin and Shopkeeper grocery permissions
  const catalogPages = [
    "/admin/add-grocery",
    "/admin/view-grocery",
  ]

  if (pathname.startsWith("/admin")) {
    const isCatalogPage = catalogPages.some(
      (path) => pathname === path || pathname === `${path}/`
    )

    const isAddPage =
      pathname === "/admin/add-grocery" ||
      pathname === "/admin/add-grocery/"

    const allowed =
      (role === "admin" && !isAddPage) ||
      (isCatalogPage && role === "shopkeeper")

    if (!allowed) {
      return NextResponse.redirect(
        new URL("/unauthorized", req.url)
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}