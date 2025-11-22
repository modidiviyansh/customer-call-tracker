import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] relative z-10 cursor-pointer select-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white focus:ring-purple-500 shadow-luxury-button active:scale-95',
    secondary: 'bg-white/80 backdrop-blur-lg shadow-xl text-gray-700 border border-white/20 active:scale-95 focus:ring-gray-500',
    outline: 'border-2 border-transparent bg-gradient-to-r from-[#FFD700] to-[#09c6f9] text-gray-700 active:scale-95 focus:ring-purple-500 relative overflow-hidden',
    luxury: 'bg-gradient-to-r from-[#FFD700] to-[#09c6f9] text-white shadow-gradient active:scale-95 focus:ring-purple-500',
    'luxury-outline': 'border-2 border-gradient-to-r from-[#FFD700] to-[#09c6f9] text-gray-700 bg-white/80 backdrop-blur-lg active:scale-95 focus:ring-purple-500'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <motion.button
      // Simplified animation - only scale on tap
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={classes}
      disabled={disabled}
      onClick={(e) => {
        console.log('🔘 Button clicked:', { variant, size, target: e.target });
        if (props.onClick) props.onClick(e);
      }}
      {...props}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </motion.button>
  );
};

export default Button;