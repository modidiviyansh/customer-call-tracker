import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, Phone, ChevronDown } from 'lucide-react';
import { generateCallUrl } from '../utils/mobileValidation';

const CallNowDropdown = ({ customer, onCallInitiated, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getMobileOptions = () => {
    const options = [];
    if (customer.mobile1) {
      options.push({ 
        number: customer.mobile1, 
        type: 'Primary', 
        index: 1,
        display: `${customer.mobile1} (Primary)`
      });
    }
    if (customer.mobile2) {
      options.push({ 
        number: customer.mobile2, 
        type: 'Secondary', 
        index: 2,
        display: `${customer.mobile2} (Secondary)`
      });
    }
    if (customer.mobile3) {
      options.push({ 
        number: customer.mobile3, 
        type: 'Tertiary', 
        index: 3,
        display: `${customer.mobile3} (Tertiary)`
      });
    }
    return options;
  };

  const handleCallNumber = (option) => {
    setIsOpen(false);

    // Generate call URL
    const callUrl = generateCallUrl(option.number);
    
    // Open phone dialer
    window.open(callUrl, '_self');
    
    // Callback to parent component for logging
    if (onCallInitiated) {
      onCallInitiated({
        customerId: customer.id,
        mobileNumber: option.number,
        mobileType: option.type,
        mobileIndex: option.index
      });
    }
  };

  const mobileOptions = getMobileOptions();

  // If only one number, show simple call button
  if (mobileOptions.length === 1) {
    return (
      <motion.button
        onClick={() => handleCallNumber(mobileOptions[0])}
        className={`w-full bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-full px-4 py-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 text-base font-semibold flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-[56px] touch-manipulation relative z-20 active:scale-95 ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        title={`Call ${mobileOptions[0].display}`}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <PhoneCall className="w-5 h-5" />
        </motion.div>
        <span>Call Now</span>
      </motion.button>
    );
  }

  // Multiple numbers - show dropdown
  return (
    <div className="relative w-full">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-full px-4 py-3 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 text-base font-semibold flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-[56px] touch-manipulation relative z-20 active:scale-95 ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <PhoneCall className="w-5 h-5" />
        </motion.div>
        <span>Call Now</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-30"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="p-2">
              <div className="text-xs font-medium text-slate-600 px-2 py-1">
                Select number to call:
              </div>
              {mobileOptions.map((option, index) => (
                <motion.button
                  key={option.index}
                  onClick={() => handleCallNumber(option)}
                  className="w-full text-left p-3 hover:bg-slate-50 rounded-lg transition-colors flex items-center space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "rgba(148, 163, 184, 0.1)" }}
                >
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{option.number}</p>
                    <p className="text-xs text-slate-500">{option.type} Mobile</p>
                  </div>
                  <PhoneCall className="w-4 h-4 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CallNowDropdown;