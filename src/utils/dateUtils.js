import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = new Date(date);
    }
    
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatDateTime = (date, formatString = 'MMM dd, yyyy HH:mm') => {
  return formatDate(date, formatString);
};

export const formatTime = (date, formatString = 'HH:mm') => {
  return formatDate(date, formatString);
};

export const formatDateLocal = (date) => {
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = new Date(date);
    }
    
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    
    return format(dateObj, 'dd MMM yy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatDateTimeLocal = (date) => {
  try {
    let dateObj;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = new Date(date);
    }
    
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    
    return format(dateObj, 'dd MMM yy HH:mm');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date';
  }
};

export const getRelativeTime = (date) => {
  try {
    const now = new Date();
    const dateObj = new Date(date);
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Unknown time';
  }
};