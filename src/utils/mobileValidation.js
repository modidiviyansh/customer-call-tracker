/**
 * VALIDATION: Multi-Mobile Number Validation Rules
 *
 * Enhanced validation utilities for handling up to 3 mobile numbers per customer
 */

import { validateIndianMobile, formatIndianMobile } from './validation';

export const validateIndianMobileArray = (mobiles) => {
  // Remove empty/null/undefined values
  const validMobiles = mobiles.filter(mobile => mobile && mobile.toString().trim().length > 0);
  
  if (validMobiles.length === 0) {
    return { isValid: false, error: 'At least one mobile number is required' };
  }
  
  if (validMobiles.length > 3) {
    return { isValid: false, error: 'Maximum 3 mobile numbers allowed per customer' };
  }
  
  // Check each mobile number
  const errors = [];
  validMobiles.forEach((mobile, index) => {
    const mobileIndex = index + 1;
    if (!validateIndianMobile(mobile)) {
      errors.push(`Mobile ${mobileIndex}: Invalid format`);
    }
  });
  
  // Check for duplicates
  const duplicates = [];
  for (let i = 0; i < validMobiles.length; i++) {
    for (let j = i + 1; j < validMobiles.length; j++) {
      if (formatIndianMobile(validMobiles[i]) === formatIndianMobile(validMobiles[j])) {
        duplicates.push(`Mobile ${i + 1} and ${j + 1} are the same`);
      }
    }
  }
  
  const allErrors = [...errors, ...duplicates];
  return {
    isValid: allErrors.length === 0,
    error: allErrors.length > 0 ? allErrors.join('; ') : null
  };
};

export const validateCustomerMobileUpdate = (customerId, mobile1, mobile2, mobile3, existingCustomers = []) => {
  const mobiles = [mobile1, mobile2, mobile3].filter(mobile => mobile && mobile.trim().length > 0);
  
  // Check total count
  if (mobiles.length === 0) {
    return { isValid: false, error: 'At least one mobile number is required' };
  }
  
  if (mobiles.length > 3) {
    return { isValid: false, error: 'Maximum 3 mobile numbers allowed' };
  }
  
  // Check format and duplicates within new mobiles
  const formatValidation = validateIndianMobileArray(mobiles);
  if (!formatValidation.isValid) {
    return formatValidation;
  }
  
  // Check for duplicates with existing customers (excluding current customer)
  const conflicts = [];
  existingCustomers.forEach(existing => {
    if (existing.id !== customerId) {
      const existingMobiles = [existing.mobile1, existing.mobile2, existing.mobile3].filter(m => m);
      mobiles.forEach(newMobile => {
        if (existingMobiles.some(existingMobile => formatIndianMobile(newMobile) === formatIndianMobile(existingMobile))) {
          conflicts.push(`Mobile number ${newMobile} is already used by ${existing.name}`);
        }
      });
    }
  });
  
  if (conflicts.length > 0) {
    return { isValid: false, error: conflicts.join('; ') };
  }
  
  return { isValid: true, error: null };
};

export const formatCustomerMobiles = (customer) => {
  const mobiles = [];
  if (customer.mobile1) mobiles.push({ number: customer.mobile1, type: 'Primary', index: 1 });
  if (customer.mobile2) mobiles.push({ number: customer.mobile2, type: 'Secondary', index: 2 });
  if (customer.mobile3) mobiles.push({ number: customer.mobile3, type: 'Tertiary', index: 3 });
  return mobiles;
};

export const getPrimaryMobile = (customer) => {
  return customer.mobile1 || null;
};

export const getAllMobileNumbers = (customer) => {
  return [customer.mobile1, customer.mobile2, customer.mobile3].filter(mobile => mobile && mobile.trim().length > 0);
};

export const createMobileOptions = (customer) => {
  const options = [];
  if (customer.mobile1) {
    options.push({ 
      value: customer.mobile1, 
      label: `${customer.mobile1} (Primary)`,
      type: 'Primary'
    });
  }
  if (customer.mobile2) {
    options.push({ 
      value: customer.mobile2, 
      label: `${customer.mobile2} (Secondary)`,
      type: 'Secondary'
    });
  }
  if (customer.mobile3) {
    options.push({ 
      value: customer.mobile3, 
      label: `${customer.mobile3} (Tertiary)`,
      type: 'Tertiary'
    });
  }
  return options;
};

export const extractMobileFromUrl = (phoneNumber) => {
  // Extract clean mobile number from tel: URL
  return phoneNumber.replace('tel:', '');
};

export const generateCallUrl = (mobileNumber) => {
  return `tel:${formatIndianMobile(mobileNumber)}`;
};

export const normalizeMobileNumber = (mobile) => {
  // Clean and standardize mobile number format
  return mobile ? formatIndianMobile(mobile.toString().trim()) : '';
};