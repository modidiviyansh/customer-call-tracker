export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateIndianMobile = (mobile) => {
  // Indian mobile number validation
  // Should start with +91 or 91 or 0, followed by 10 digits
  // First digit after country code should be 6-9
  const cleanMobile = mobile.replace(/\s+/g, '').replace(/-/g, '');

  // Check for +91 prefix
  if (cleanMobile.startsWith('+91')) {
    const number = cleanMobile.substring(3);
    return /^\d{10}$/.test(number) && /^[6-9]/.test(number);
  }

  // Check for 91 prefix
  if (cleanMobile.startsWith('91')) {
    const number = cleanMobile.substring(2);
    return /^\d{10}$/.test(number) && /^[6-9]/.test(number);
  }

  // Check for 0 prefix (landline style)
  if (cleanMobile.startsWith('0')) {
    const number = cleanMobile.substring(1);
    return /^\d{10}$/.test(number) && /^[6-9]/.test(number);
  }

  // Direct 10-digit number
  if (/^\d{10}$/.test(cleanMobile)) {
    return /^[6-9]/.test(cleanMobile);
  }

  return false;
};

export const validateIndianPIN = (pin) => {
  // Indian PIN code validation (6 digits)
  return /^\d{6}$/.test(pin);
};

export const formatIndianMobile = (mobile) => {
  const cleanMobile = mobile.replace(/\D/g, '');

  // If it's 10 digits, add +91 prefix
  if (cleanMobile.length === 10) {
    return `+91${cleanMobile}`;
  }

  // If it starts with 91 and has 12 digits total, format as +91
  if (cleanMobile.startsWith('91') && cleanMobile.length === 12) {
    return `+91${cleanMobile.substring(2)}`;
  }

  // Return as is if already properly formatted
  if (cleanMobile.startsWith('+91') && cleanMobile.length === 13) {
    return mobile;
  }

  return mobile;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.toString().length <= maxLength;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  };
};