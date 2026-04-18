import React from 'react';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'outline' | 'ghost';
}

export default function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center";
  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 shadow-md",
    outline: "border-2 border-green-600 text-green-700 hover:bg-green-50",
    ghost: "text-gray-600 hover:bg-gray-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props} 
    >
      {children}
    </button>
  );
}
