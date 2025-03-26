/**
 * Utility functions for the DriveNow application
 */

/**
 * Format a price with currency symbol
 * @param price - The price to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Format a date to a human-readable string
 * @param date - Date to format
 * @param format - Format style ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric'
  };

  if (format === 'long') {
    options.weekday = 'long';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Calculate the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export const daysBetween = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Set hours to beginning of day for accurate calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Truncate a text to a specified length and append ellipsis
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, length: number = 100): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Generate a random ID
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 */
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Debounce a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns Boolean indicating if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Format a distance in miles or kilometers
 * @param distance - Distance value
 * @param unit - Unit of measurement ('mi' or 'km')
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number, unit: 'mi' | 'km' = 'mi'): string => {
  return `${distance.toLocaleString()} ${unit}`;
};

/**
 * Format a phone number to a standard format
 * @param phone - Phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  
  return phone;
};

/**
 * Capitalize the first letter of each word in a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Group an array of objects by a specific key
 * @param array - Array to group
 * @param key - Key to group by
 * @returns Object with grouped items
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Calculate the rental price for a car
 * @param dailyRate - Daily rental rate
 * @param days - Number of rental days
 * @param options - Additional options cost
 * @returns Total rental price
 */
export const calculateRentalPrice = (dailyRate: number, days: number, options: number = 0): number => {
  let total = dailyRate * days;
  
  // Apply discount for longer rentals
  if (days >= 7) {
    total *= 0.9; // 10% discount for 7+ days
  } else if (days >= 3) {
    total *= 0.95; // 5% discount for 3-6 days
  }
  
  return total + options;
}; 