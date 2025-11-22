// Utility functions barrel export
export { formatDate, formatDateTime, formatTime, getRelativeTime } from './dateUtils';
export { validatePhone, validateEmail, validateIndianMobile, formatIndianMobile, validateIndianPIN, validateRequired, validateMinLength, validateMaxLength } from './validation';
export {
  validateIndianMobileArray,
  validateCustomerMobileUpdate,
  formatCustomerMobiles,
  getPrimaryMobile,
  getAllMobileNumbers,
  createMobileOptions,
  extractMobileFromUrl,
  generateCallUrl,
  normalizeMobileNumber
} from './mobileValidation';
export { mockApi, debugLog } from './mockData';