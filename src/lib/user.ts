export interface UserData {
  email: string;
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
 * Generate a simple user ID based on email for database operations
 */
export const getUserId = (): string | null => {
  const user = getCurrentUser();
  if (!user) return null;
  
  // Create a simple hash of the email for use as user ID
  return btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}; 