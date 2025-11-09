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
  const baseClasses = 'font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] touch-manipulation';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 focus:ring-purple-500 shadow-luxury-button hover:shadow-luxury-lg hover:scale-105',
    secondary: 'bg-white/80 backdrop-blur-lg shadow-xl text-gray-700 border border-white/20 hover:bg-white/90 hover:shadow-luxury-lg hover:scale-105 focus:ring-gray-500',
    outline: 'border-2 border-transparent bg-gradient-to-r from-[#FFD700] to-[#09c6f9] text-gray-700 hover:shadow-luxury-lg hover:scale-105 focus:ring-purple-500 relative overflow-hidden',
    luxury: 'bg-gradient-to-r from-[#FFD700] to-[#09c6f9] text-white shadow-gradient hover:shadow-luxury-lg hover:scale-105 focus:ring-purple-500',
    'luxury-outline': 'border-2 border-gradient-to-r from-[#FFD700] to-[#09c6f9] text-gray-700 bg-white/80 backdrop-blur-lg hover:shadow-luxury-lg hover:scale-105 focus:ring-purple-500'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;