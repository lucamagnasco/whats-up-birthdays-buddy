import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a birthday date string (YYYY-MM-DD) to a Date object without timezone conversion
 * This prevents the date from shifting by one day due to timezone differences
 */
export function parseBirthdayDate(birthdayString: string): Date {
  const [year, month, day] = birthdayString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Format a birthday date string for display
 */
export function formatBirthdayDate(birthdayString: string, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  const date = parseBirthdayDate(birthdayString);
  return date.toLocaleDateString(locale, options);
}
