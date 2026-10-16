
import type { Metadata } from 'next'
import './globals.css'

import Provider from '@/Provider'
import StoreProvider from '@/redux/StoreProvider'
import InitUser from '@/InitUser'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'SmartBasket',
  description: 'Grocery delivery app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen w-full overflow-x-hidden bg-slate-50 antialiased">
        <Provider>
          <StoreProvider>
            <InitUser />
            <Nav />

            <main className="smartbasket-main box-border min-h-screen w-full">
              <div className="smartbasket-page-container mx-auto box-border min-h-screen w-full max-w-screen-2xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </StoreProvider>
        </Provider>
      </body>
    </html>
  )
}
