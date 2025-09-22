"use client";
import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SideMenu from "@/components/SideMenu";
import { useState, useEffect } from "react";

const inter = Inter({ 
  subsets: ["latin"], 
  display: "swap",
  variable: "--font-inter"
});
const nunito = Nunito({
  subsets: ["latin"],
  display: "swap", 
  weight: ["400", "600", "700"],
  variable: "--font-nunito"
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <html lang="or" suppressHydrationWarning className="scroll-smooth">
        <head>
          <title>Krishi-Seer - AI-Powered Agricultural Assistant</title>
          <meta name="description" content="AI-powered platform for farmers to predict yields, monitor soil health, and access market intelligence" />
        </head>
        <body className="font-sans bg-gray-50 text-gray-800">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="or" suppressHydrationWarning className="scroll-smooth">
      <head>
        <title>Krishi-Seer - AI-Powered Agricultural Assistant</title>
        <meta name="description" content="AI-powered platform for farmers to predict yields, monitor soil health, and access market intelligence" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} font-sans bg-gray-50 text-gray-800`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            {/* Enhanced Header */}
            <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 px-4 py-3 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {/* Hamburger Menu Button */}
                  <button
                    onClick={() => setSideMenuOpen(true)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  <a href="/" className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Krishi-Seer
                    </span>
                  </a>
                </div>
                
                <div className="flex items-center space-x-4">
                  <LanguageSwitcher />
                  
                  {/* Desktop Menu Button */}
                  <button
                    onClick={() => setSideMenuOpen(true)}
                    className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span className="font-medium">Menu</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Side Menu */}
            <SideMenu 
              isOpen={sideMenuOpen} 
              onClose={() => setSideMenuOpen(false)} 
            />

            <main className="flex-grow pb-20">
              {children}
            </main>

            {/* Enhanced Bottom Navigation */}
            <nav className="bg-white/90 backdrop-blur-lg shadow-2xl fixed bottom-0 left-0 right-0 z-40 border-t border-white/20">
              <div className="flex justify-around items-center h-16 px-2">
                <a href="/dashboard" className="flex flex-col items-center text-green-600 hover:text-green-700 transition-colors group">
                  <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1 font-medium">Dashboard</span>
                </a>
                
                <a href="/advisory" className="flex flex-col items-center text-gray-500 hover:text-green-600 transition-colors group">
                  <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1 font-medium">Advisory</span>
                </a>
                
                <a href="/irrigation" className="flex flex-col items-center text-gray-500 hover:text-green-600 transition-colors group">
                  <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1 font-medium">Irrigation</span>
                </a>
                
                <a href="/chatbot" className="flex flex-col items-center text-gray-500 hover:text-green-600 transition-colors group">
                  <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs mt-1 font-medium">AI Chat</span>
                </a>
                
                <a href="/fertilizer" className="flex flex-col items-center text-gray-500 hover:text-green-600 transition-colors group">
                  <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-xs mt-1 font-medium">Fertilizer</span>
                </a>
                
                <a href="/profile" className="flex flex-col items-center text-gray-500 hover:text-green-600 transition-colors group">
                  <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1 font-medium">Profile</span>
                </a>
              </div>
            </nav>
          </div>
        </Providers>
      </body>
    </html>
  );
}