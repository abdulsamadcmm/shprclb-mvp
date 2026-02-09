import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout";
import { Sidebar } from "@/components/layout";
import { CartProvider } from "@/contexts/cart-context";

export const metadata: Metadata = {
  title: "Shprclb - Warehouse E-commerce",
  description: "E-commerce platform with warehouse-specific pricing",
};

function SidebarFallback() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-8 bg-muted/50 rounded animate-pulse" />
      <div className="h-8 bg-muted/50 rounded animate-pulse" />
      <div className="h-8 bg-muted/50 rounded animate-pulse" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Fontshare for faster font loading */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.fontshare.com" crossOrigin="anonymous" />
        {/* Load Satoshi font from Fontshare */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased min-h-screen">
        <CartProvider>
          <Header />
          <div className="flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 border-r bg-sidebar min-h-[calc(100vh-4rem)] sticky top-16">
              <Suspense fallback={<SidebarFallback />}>
                <Sidebar />
              </Suspense>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-[calc(100vh-4rem)]">{children}</main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
