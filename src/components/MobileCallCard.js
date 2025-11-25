import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneCall, 
  ChevronDown, 
  ChevronUp, 
  User, 
  History, 
  Trash2
} from 'lucide-react';

const MobileCallCard = ({
  customer,
  onCallCustomer,
  onLogCall,
  onViewProfile,
  onViewHistory,
  onDeleteCustomer,
  className = ''
}) => {
  const [showAllNumbers, setShowAllNumbers] = useState(false);

  // Get all available phone numbers
  const getPhoneNumbers = () => {
    const numbers = [];
    if (customer.mobile1) numbers.push({ number: customer.mobile1, type: 'primary', label: 'Primary' });
    if (customer.mobile2) numbers.push({ number: customer.mobile2, type: 'secondary', label: 'Secondary' });
    if (customer.mobile3) numbers.push({ number: customer.mobile3, type: 'tertiary', label: 'Tertiary' });
    return numbers;
  };

  const phoneNumbers = getPhoneNumbers();
  const primaryNumber = phoneNumbers[0];

  // Truncate name for display (only if >30 characters)
  const truncateName = (name) => {
    return name.length > 30 ? name.substring(0, 30) + '...' : name;
  };

  // Handle number selection for calling
  const handleNumberCall = (number) => {
    const customerWithNumber = { ...customer, mobile1: number };
    onCallCustomer(customerWithNumber);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        w-full bg-white rounded-2xl shadow-lg border border-white/20 
        overflow-hidden mb-4 ${className}
      `}
      style={{
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        fontFamily: 'Helvetica, Arial, sans-serif'
      }}
    >
      {/* Header Section */}
      <div className="px-5 py-4">
        <h3 
          className="text-slate-800 font-semibold"
          style={{ 
            fontSize: '15px', 
            fontWeight: '600',
            lineHeight: '1.2',
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}
          title={customer.name}
        >
          {truncateName(customer.name)}
        </h3>
      </div>

      {/* Phone Numbers Section */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Primary Number - Clickable for direct calling */}
          <motion.button
            onClick={() => handleNumberCall(primaryNumber.number)}
            className="
              bg-gradient-to-r from-blue-500 to-blue-600 text-white 
              px-4 py-2.5 rounded-full text-sm font-medium
              min-h-[44px] min-w-[44px] flex items-center gap-2
              active:scale-95 transition-transform duration-200
              shadow-sm hover:shadow-md
            "
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            whileTap={{ scale: 0.95 }}
          >
            <PhoneCall className="w-4 h-4" />
            <span>{primaryNumber.number}</span>
          </motion.button>

          {/* Additional Numbers Toggle */}
          {phoneNumbers.length > 1 && (
            <motion.button
              onClick={() => setShowAllNumbers(!showAllNumbers)}
              className="
                bg-slate-100 text-slate-600 px-3 py-2.5 rounded-full text-sm font-medium
                min-h-[44px] flex items-center gap-2
                active:scale-95 transition-transform duration-200
                hover:bg-slate-200
              "
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              whileTap={{ scale: 0.95 }}
            >
              <span>+{phoneNumbers.length - 1} more</span>
              {showAllNumbers ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </div>

        {/* Expandable Additional Numbers */}
        <AnimatePresence>
          {showAllNumbers && phoneNumbers.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-2"
            >
              {phoneNumbers.slice(1).map((phone, index) => (
                <motion.button
                  key={phone.number}
                  onClick={() => handleNumberCall(phone.number)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="
                    w-full bg-slate-50 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-medium
                    min-h-[44px] flex items-center justify-between
                    active:scale-95 transition-transform duration-200
                    hover:bg-slate-100
                  "
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{phone.number}</span>
                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                    {phone.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons Row */}
      <div className="px-5 pb-5">
        <div className="flex gap-2 justify-between">
          {/* Log Call Button - Green, takes more space */}
          <motion.button
            onClick={() => onLogCall(customer)}
            className="
              bg-gradient-to-r from-emerald-500 to-emerald-600 text-white 
              px-5 py-3 rounded-xl font-medium text-sm
              min-h-[44px] flex-1 flex items-center justify-center gap-2
              active:scale-95 transition-transform duration-200
              shadow-sm hover:shadow-md
            "
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            whileTap={{ scale: 0.95 }}
          >
            <Phone className="w-4 h-4" />
            <span>Log Call</span>
          </motion.button>

          {/* View Profile Button */}
          <motion.button
            onClick={() => onViewProfile(customer)}
            className="
              bg-slate-100 text-slate-600 
              px-3 py-3 rounded-xl font-medium text-sm
              min-h-[44px] min-w-[44px] flex items-center justify-center
              active:scale-95 transition-transform duration-200
              hover:bg-slate-200
            "
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            whileTap={{ scale: 0.95 }}
            title="View Profile"
          >
            <User className="w-4 h-4" />
          </motion.button>

          {/* View History Button */}
          <motion.button
            onClick={() => onViewHistory(customer)}
            className="
              bg-slate-100 text-slate-600 
              px-3 py-3 rounded-xl font-medium text-sm
              min-h-[44px] min-w-[44px] flex items-center justify-center
              active:scale-95 transition-transform duration-200
              hover:bg-slate-200
            "
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            whileTap={{ scale: 0.95 }}
            title="View History"
          >
            <History className="w-4 h-4" />
          </motion.button>

          {/* Delete Button - Red */}
          <motion.button
            onClick={() => onDeleteCustomer(customer.id)}
            className="
              bg-red-50 text-red-600 
              px-3 py-3 rounded-xl font-medium text-sm
              min-h-[44px] min-w-[44px] flex items-center justify-center
              active:scale-95 transition-transform duration-200
              hover:bg-red-100
            "
            style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            whileTap={{ scale: 0.95 }}
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileCallCard;