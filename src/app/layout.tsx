import type { Metadata } from "next";
import "./globals.css";
import Provider from '@/Provider';



export const metadata: Metadata = {
  title: "SmartBasket",
  description: "grocery shopping app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-full min-h-screen bg-linear-to-b from-green-100 to-white"
       
   >
    <Provider> 
        {children}
    </Provider>
      </body>
    </html>
  );
}
