
import type { Metadata } from "next";
import "./globals.css";

import Provider from "@/Provider";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/InitUser";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "SmartBasket",
  description: "Grocery delivery app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full min-h-screen overflow-x-hidden bg-linear-to-b from-green-100 to-white antialiased">
        <Provider>
          <StoreProvider>
            <InitUser />

            <Nav />

            <main className="smartbasket-main box-border min-h-screen w-full">
              <div className="smartbasket-page-container box-border min-h-screen w-full min-w-0">
                {children}
              </div>
            </main>
          </StoreProvider>
        </Provider>
      </body>
    </html>
  );
}
