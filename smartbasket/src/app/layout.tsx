import type { Metadata } from 'next';

import './globals.css';

import Provider from '@/Provider';
import StoreProvider from '@/redux/StoreProvider';
import InitUser from '@/InitUser';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'SmartBasket',
  description: 'Grocery delivery app',
};

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/select-role',
  '/unauthorized',
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * IMPORTANT:
   * Layout itself cannot directly use usePathname().
   *
   * Nav component handles the pathname check internally.
   * Therefore public pages won't show the sidebar/header navigation.
   */

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen w-full bg-slate-50 antialiased">
        <Provider>
          <StoreProvider>
            <InitUser />

            <Nav />

            <main className="smartbasket-main min-h-screen w-full">
              <div className="smartbasket-page-container mx-auto min-h-screen w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </StoreProvider>
        </Provider>
      </body>
    </html>
  );
}