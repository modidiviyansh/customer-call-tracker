import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { validateIndianMobile, formatIndianMobile } from '../utils/validation';

const MobileNumberManager = ({ 
  customer, 
  onUpdate, 
  onDelete, 
  existingCustomers = [], 
  disabled = false 
}) => {
  const [editingNumber, setEditingNumber] = useState(null);
  const [newNumber, setNewNumber] = useState('');
  const [addingNumber, setAddingNumber] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Helper function to create composite key (name + mobile combination)
  const createCompositeKey = (name, mobile) => {
    if (!name || !mobile) return null;
    
    // Clean and normalize the name - keep alphanumeric characters only
    const cleanName = name.toLowerCase()
      .replace(/[^\w]/g, '') // Remove special characters
      .replace(/\s+/g, '');   // Remove all whitespace
    
    const namePrefix = cleanName.slice(0, 5).padEnd(5, 'x');
    
    // Extract mobile digits
    const mobileDigits = mobile.replace(/\D/g, '');
    if (mobileDigits.length !== 10) return null;
    const mobileSuffix = mobileDigits.slice(-5);
    
    return `${namePrefix}-${mobileSuffix}`;
  };

  const getMobileNumbers = () => {
    return [
      { value: customer.mobile1, type: 'Primary', index: 1 },
      { value: customer.mobile2, type: 'Secondary', index: 2 },
      { value: customer.mobile3, type: 'Tertiary', index: 3 }
    ].filter(item => item.value && item.value.trim().length > 0);
  };

  const getAvailableSlot = () => {
    if (!customer.mobile1) return 1;
    if (!customer.mobile2) return 2;
    if (!customer.mobile3) return 3;
    return null;
  };

  const handleAddNumber = () => {
    if (!newNumber.trim()) {
      setValidationError('Mobile number is required');
      return;
    }

    if (!validateIndianMobile(newNumber)) {
      setValidationError('Please enter a valid Indian mobile number');
      return;
    }

    // Check for duplicates using composite key (name + mobile combination)
    const newCompositeKey = createCompositeKey(customer.name, newNumber);
    if (newCompositeKey) {
      const duplicates = existingCustomers.filter(existing => {
        if (existing.id === customer.id) return false;
        
        const existingCompositeKeys = [
          createCompositeKey(existing.name, existing.mobile1),
          createCompositeKey(existing.name, existing.mobile2),
          createCompositeKey(existing.name, existing.mobile3)
        ].filter(key => key !== null);

        return existingCompositeKeys.includes(newCompositeKey);
      });

      if (duplicates.length > 0) {
        setValidationError(`Customer ${customer.name} with this mobile number already exists`);
        return;
      }
    }

    const slotIndex = getAvailableSlot();
    if (!slotIndex) {
      setValidationError('Maximum 3 mobile numbers allowed');
      return;
    }

    const updatedCustomer = {
      ...customer,
      [`mobile${slotIndex}`]: formatIndianMobile(newNumber)
    };

    onUpdate(updatedCustomer);
    setNewNumber('');
    setAddingNumber(false);
    setValidationError('');
  };

  const handleEditNumber = (index, newValue) => {
    if (!newValue.trim()) {
      setValidationError('Mobile number is required');
      return;
    }

    if (!validateIndianMobile(newValue)) {
      setValidationError('Please enter a valid Indian mobile number');
      return;
    }

    // Check for duplicates using composite key (name + mobile combination)
    const newCompositeKey = createCompositeKey(customer.name, newValue);
    if (newCompositeKey) {
      const duplicates = existingCustomers.filter(existing => {
        if (existing.id === customer.id) return false;
        
        const existingCompositeKeys = [
          createCompositeKey(existing.name, existing.mobile1),
          createCompositeKey(existing.name, existing.mobile2),
          createCompositeKey(existing.name, existing.mobile3)
        ].filter(key => key !== null);

        return existingCompositeKeys.includes(newCompositeKey);
      });

      if (duplicates.length > 0) {
        setValidationError(`Customer ${customer.name} with this mobile number already exists`);
        return;
      }
    }

    // Check if editing Primary number (cannot be empty)
    if (index === 1 && !newValue.trim()) {
      setValidationError('Primary mobile number cannot be empty');
      return;
    }

    const updatedCustomer = {
      ...customer,
      [`mobile${index}`]: index === 1 ? formatIndianMobile(newValue) : (newValue.trim() ? formatIndianMobile(newValue) : null)
    };

    onUpdate(updatedCustomer);
    setEditingNumber(null);
    setValidationError('');
  };

  const handleDeleteNumber = (index) => {
    // Cannot delete primary number
    if (index === 1) {
      setValidationError('Cannot delete primary mobile number');
      return;
    }

    const updatedCustomer = {
      ...customer,
      [`mobile${index}`]: null
    };

    onUpdate(updatedCustomer);
  };

  const mobileNumbers = getMobileNumbers();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Mobile Numbers</h3>
        {!disabled && getAvailableSlot() && (
          <motion.button
            onClick={() => setAddingNumber(true)}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Number</span>
          </motion.button>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{validationError}</p>
        </div>
      )}

      {/* Mobile Numbers List */}
      <div className="space-y-3">
        {mobileNumbers.map((mobile, index) => (
          <motion.div
            key={index}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{mobile.value}</p>
                <p className="text-sm text-slate-500">{mobile.type} Mobile</p>
              </div>
            </div>

            {!disabled && (
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => setEditingNumber(index)}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Edit number"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                </motion.button>
                {mobile.index > 1 && (
                  <motion.button
                    onClick={() => handleDeleteNumber(mobile.index)}
                    className="p-2 hover:bg-white rounded-full transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Delete number"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Add Number Form */}
        {addingNumber && (
          <motion.div
            className="p-4 bg-blue-50 rounded-lg border border-blue-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Mobile Number
                </label>
                <input
                  type="tel"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="Enter 10-digit mobile number (e.g., 9876543210)"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter number with or without +91 prefix
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <motion.button
                  onClick={() => {
                    setAddingNumber(false);
                    setNewNumber('');
                    setValidationError('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAddNumber}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check className="w-4 h-4" />
                  <span>Add</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Edit Number Form */}
        {editingNumber !== null && (
          <motion.div
            className="p-4 bg-amber-50 rounded-lg border border-amber-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Edit Mobile Number {mobileNumbers[editingNumber]?.type}
                </label>
                <input
                  type="tel"
                  value={mobileNumbers[editingNumber]?.value || ''}
                  onChange={(e) => {
                    const updatedNumbers = [...mobileNumbers];
                    updatedNumbers[editingNumber] = {
                      ...updatedNumbers[editingNumber],
                      value: e.target.value
                    };
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <motion.button
                  onClick={() => {
                    setEditingNumber(null);
                    setValidationError('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => handleEditNumber(
                    mobileNumbers[editingNumber].index, 
                    mobileNumbers[editingNumber].value
                  )}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check className="w-4 h-4" />
                  <span>Update</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          {mobileNumbers.length} of 3 mobile numbers configured
        </p>
      </div>
    </div>
  );
};

export default MobileNumberManager;