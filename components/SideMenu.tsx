"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { t } = useTranslation();

  const menuItems = [
    { href: "/", icon: "🏠", label: "home" },
    { href: "/dashboard", icon: "📊", label: "dashboard" },
    { href: "/advisory", icon: "🌱", label: "get_advisory" },
    { href: "/irrigation", icon: "💧", label: "irrigation_title", isNew: true },
    { href: "/fertilizer", icon: "🧪", label: "fertilizer_title", isNew: true },
    { href: "/weather", icon: "🌤️", label: "check_weather" },
    { href: "/chatbot", icon: "🤖", label: "ai_chatbot" },
    { href: "/voice", icon: "🎤", label: "voice_assistant" },
    { href: "/schemes", icon: "📋", label: "govt_schemes" },
    { href: "/community", icon: "👥", label: "community" },
    { href: "/research", icon: "📚", label: "research_title", isNew: true },
    { href: "/contact", icon: "📞", label: "contact" },
    { href: "/profile", icon: "👤", label: "profile" },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
        onClick={onClose}
      />
      
      {/* Side Menu */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-lg shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-white/20 overflow-y-auto
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Krishi-Seer
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={onClose}
              className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200 group relative"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                {item.isNew ? item.label : t(item.label)}
              </span>
              {item.isNew && (
                <span className="absolute right-3 top-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Krishi-Seer</p>
            <p className="text-xs mt-1">Agricultural Intelligence Platform</p>
          </div>
        </div>
      </div>
    </>
  );
}