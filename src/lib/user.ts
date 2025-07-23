export interface UserData {
  email: string;
  password: string;
  joinedAt: string;
}

/**
 * Get the current user data from localStorage
 */
export const getCurrentUser = (): UserData | null => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Set user data in localStorage
 */
export const setCurrentUser = (userData: UserData): void => {
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

/**
 * Remove user data from localStorage (logout)
 */
export const clearCurrentUser = (): void => {
  try {
    localStorage.removeItem('userData');
    localStorage.removeItem('pendingGroupEmail');
    localStorage.removeItem('anonymousGroupsEmail');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Check if user is authenticated (has provided email)
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * Generate a deterministic UUID based on email for database operations
 */
export const getUserId = (): string | null => {
  const user = getCurrentUser();
  if (!user) return null;
  
  // Create a deterministic UUID v4-like string based on email
  // This ensures the same email always generates the same ID
  const hash = Array.from(user.email)
    .reduce((hash, char) => Math.imul(31, hash) + char.charCodeAt(0) | 0, 0);
  
  // Convert to positive number and pad with zeros
  const positiveHash = Math.abs(hash).toString().padStart(10, '0');
  
  // Create a UUID v4 format (8-4-4-4-12 characters)
  const uuid = [
    positiveHash.substring(0, 8),
    positiveHash.substring(8, 12).padEnd(4, '0'),
    '4' + positiveHash.substring(12, 15).padEnd(3, '0'), // Version 4
    ('8' + positiveHash.substring(15, 18).padEnd(3, '0')).substring(0, 4), // Variant bits
    (positiveHash + positiveHash).substring(0, 12) // Ensure 12 chars
  ].join('-');
  
  return uuid;
}; 