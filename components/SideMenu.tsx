"use client";
import Link from 'next/link';
import { useState } from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: { href: string; label: string; icon: React.ReactNode; isNew?: boolean }[];
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, menuItems }) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Side Menu */}
      <aside className={`
        fixed top-0 left-0 h-full w-full max-w-xs bg-white/95 backdrop-blur-lg shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-gray-200/80
        flex flex-col
        sm:max-w-sm 
        lg:translate-x-0 lg:sticky lg:w-72 lg:z-30 lg:shadow-none lg:bg-white/80
      `}>
        {/* Header */}
        <div className="p-5 border-b border-gray-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
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
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all lg:hidden"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={onClose}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200 group relative w-full text-gray-700"
            >
              <span className="text-xl text-gray-500 group-hover:text-green-500 group-hover:scale-110 transition-all">
                {item.icon}
              </span>
              <span className="font-medium group-hover:text-green-600 transition-colors truncate">
                {item.label}
              </span>
              {item.isNew && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/80">
          <div className="text-center text-xs text-gray-500">
            <p>© 2025 Krishi-Seer. All Rights Reserved.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideMenu;