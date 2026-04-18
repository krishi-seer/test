"use client";
import React, { useState, useEffect } from "react";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SideMenu from "@/components/SideMenu";
import Link from "next/link";
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

// Icon Components
function IconHome({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>; }
function IconShield({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
function IconCloud({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>; }
function IconChat({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>; }
function IconBuilding({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>; }
function IconSun({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function IconLibrary({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4z" /></svg>; }
function IconUsers({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.184-1.268-.5-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.184-1.268.5-1.857m0 0a5.002 5.002 0 009 0m-9 0a5.002 5.002 0 00-9 0m9 0a5.002 5.002 0 009 0" /></svg>; }
function IconFlask({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.363-.448c-.53-.1-.995.322-1.214.832l-.243.543a1 1 0 01-1.631-.825l.31-1.715a1 1 0 00-.454-.945l-1.42-1.065a1 1 0 01.22-1.843l2.354.447a1 1 0 00.995-.322l.243-.543a1 1 0 011.631.825l-.31 1.715a1 1 0 00.454.945z" /></svg>; }
function IconUser({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function IconScanner({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m-3.322-.053l.33.945m7.34-.945l-.328.945M4 12h1m14 0h1m-1.053 3.322l-.945-.33m-11.945.33l.945-.33M4 19h16M4 5h16M7 8h10M7 12h10M7 16h10" /></svg>; }
function IconPhone({size=24}) { return <svg className={`w-${size/4} h-${size/4}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>; }

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <IconHome /> },
    { href: '/advisory', label: 'Advisory', icon: <IconShield /> },
    { href: '/irrigation', label: 'Irrigation', icon: <IconCloud /> },
    { href: '/chatbot', label: 'AI Chat', icon: <IconChat />, isNew: true },
    { href: '/fertilizer', label: 'Fertilizer', icon: <IconBuilding /> },
    { href: '/weather', label: 'Weather', icon: <IconSun /> },
    { href: '/schemes', label: 'Govt. Schemes', icon: <IconLibrary /> },
    { href: '/features/document-extractor', label: 'Doc Scanner', icon: <IconScanner />, isNew: true },
    { href: '/community', label: 'Community', icon: <IconUsers /> },
    { href: '/research', label: 'Research', icon: <IconFlask /> },
    { href: '/profile', label: 'Profile', icon: <IconUser /> },
    { href: '/contact', label: 'Contact Us', icon: <IconPhone /> },
];


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
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Krishi-Seer - Loading...</title>
        </head>
        <body className="font-sans bg-gray-50">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Krishi-Seer - AI-Powered Agricultural Assistant</title>
        <meta name="description" content="AI-powered platform for farmers to predict yields, monitor soil health, and access market intelligence" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} font-sans bg-gray-100 text-gray-800`}>
        <Providers>
          <div className="flex h-screen">
            <SideMenu 
              isOpen={sideMenuOpen} 
              onClose={() => setSideMenuOpen(false)} 
              menuItems={menuItems}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80 px-4 sm:px-6 py-3 sticky top-0 z-30">
                <div className="flex justify-between items-center">
                  {/* Hamburger Menu Button */}
                  <button
                    onClick={() => setSideMenuOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors lg:hidden"
                    aria-label="Open menu"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  {/* This div is for spacing on desktop, so the language switcher doesn't jump to the left */}
                  <div className="hidden lg:block w-8"></div>

                  <div className="flex items-center space-x-4">
                    <LanguageSwitcher />
                    <Link href="/profile" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                       <IconUser size={24} />
                    </Link>
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-8">
                {children}
              </main>
            </div>
          </div>
          
          {/* Bottom Navigation for Mobile */}
          <nav className="bg-white/90 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)] fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 lg:hidden">
            <div className="flex justify-around items-center h-16">
              <BottomNavLink href="/dashboard" label="Home" icon={<IconHome />} />
              <BottomNavLink href="/advisory" label="Advisory" icon={<IconShield />} />
              <BottomNavLink href="/chatbot" label="AI Chat" icon={<IconChat />} isNew />
              <BottomNavLink href="/features/document-extractor" label="Scanner" icon={<IconScanner />} isNew />
              <BottomNavLink href="/profile" label="Profile" icon={<IconUser />} />
            </div>
          </nav>
        </Providers>
      </body>
    </html>
  );
}

const BottomNavLink = ({ href, label, icon, isNew = false }: { href: string; label: string; icon: React.ReactNode; isNew?: boolean }) => (
  <Link href={href} className="flex flex-col items-center text-gray-600 hover:text-green-600 transition-colors group w-16">
    <div className="p-2 rounded-xl group-hover:bg-green-50 transition-colors relative">
      {icon}
      {isNew && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>}
    </div>
    <span className="text-xs mt-1 font-medium truncate">{label}</span>
  </Link>
);