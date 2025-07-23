import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserData extends User {
  // Extend Supabase User type if needed
}

/**
 * Get the current user data from Supabase
 */
export const getCurrentUser = async (): Promise<UserData | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return user as UserData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Get user ID for database operations
 */
export const getUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id || null;
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    
    // Clean up any remaining auth-related data from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.includes('userData') || key.includes('anonymousGroups')) {
        localStorage.removeItem(key);
      }
    });

    // Clean up session storage too
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.includes('redirect_to') || key.includes('auth_context')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

/**
 * Clear current user data (legacy function for compatibility)
 * @deprecated Use signOut() instead
 */
export const clearCurrentUser = async (): Promise<void> => {
  await signOut();
};

/**
 * Set user data (legacy function - not needed with Supabase)
 * @deprecated Supabase handles user data automatically
 */
export const setCurrentUser = (userData: any): void => {
  console.warn('setCurrentUser is deprecated - Supabase handles user data automatically');
}; 