import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const Accordion = ({ 
  title, 
  children, 
  defaultExpanded = false, 
  icon: Icon,
  className = '',
  titleClassName = '',
  contentClassName = '',
  showArrow = true,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={toggleExpanded}
        disabled={disabled}
        className={`
          w-full px-4 py-3 flex items-center justify-between text-left transition-all duration-200
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'hover:bg-slate-50 cursor-pointer active:bg-slate-100'
          }
          ${titleClassName}
        `}
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="w-5 h-5 text-slate-600 flex-shrink-0" />}
          <span className="font-medium text-slate-800">{title}</span>
        </div>
        
        {showArrow && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </motion.div>
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 ${contentClassName}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accordion;