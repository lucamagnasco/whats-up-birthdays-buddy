export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
}

export class ErrorHandler {
  private static errorMap: Record<string, AppError> = {
    // Authentication errors
    'auth/user-not-found': {
      code: 'auth/user-not-found',
      message: 'User not found',
      userMessage: 'No account found with this email. Please check your email or create a new account.',
      action: 'Try signing up instead',
      severity: 'error'
    },
    'auth/wrong-password': {
      code: 'auth/wrong-password',
      message: 'Wrong password',
      userMessage: 'Incorrect password. Please try again or reset your password.',
      action: 'Reset password',
      severity: 'error'
    },
    'auth/email-already-in-use': {
      code: 'auth/email-already-in-use',
      message: 'Email already in use',
      userMessage: 'An account with this email already exists. Please try signing in instead.',
      action: 'Sign in',
      severity: 'error'
    },
    'auth/weak-password': {
      code: 'auth/weak-password',
      message: 'Weak password',
      userMessage: 'Password must be at least 6 characters long.',
      action: 'Use a stronger password',
      severity: 'error'
    },
    'auth/invalid-email': {
      code: 'auth/invalid-email',
      message: 'Invalid email',
      userMessage: 'Please enter a valid email address.',
      action: 'Check your email format',
      severity: 'error'
    },

    // Group errors
    'group/not-found': {
      code: 'group/not-found',
      message: 'Group not found',
      userMessage: 'This group no longer exists or the invite link is invalid.',
      action: 'Check the invite link',
      severity: 'error'
    },
    'group/already-member': {
      code: 'group/already-member',
      message: 'Already a member',
      userMessage: 'You are already a member of this group.',
      action: 'Go to your groups',
      severity: 'warning'
    },
    'group/invalid-invite': {
      code: 'group/invalid-invite',
      message: 'Invalid invite code',
      userMessage: 'The invite code is invalid or has expired.',
      action: 'Request a new invite',
      severity: 'error'
    },

    // Network errors
    'network/offline': {
      code: 'network/offline',
      message: 'Network offline',
      userMessage: 'You appear to be offline. Please check your internet connection.',
      action: 'Check connection',
      severity: 'error'
    },
    'network/timeout': {
      code: 'network/timeout',
      message: 'Request timeout',
      userMessage: 'The request took too long. Please try again.',
      action: 'Try again',
      severity: 'error'
    },

    // Validation errors
    'validation/required': {
      code: 'validation/required',
      message: 'Required field missing',
      userMessage: 'Please fill in all required fields.',
      action: 'Complete the form',
      severity: 'error'
    },
    'validation/invalid-phone': {
      code: 'validation/invalid-phone',
      message: 'Invalid phone number',
      userMessage: 'Please enter a valid phone number.',
      action: 'Check phone number format',
      severity: 'error'
    },
    'validation/invalid-birthday': {
      code: 'validation/invalid-birthday',
      message: 'Invalid birthday',
      userMessage: 'Please enter a valid birthday.',
      action: 'Check date format',
      severity: 'error'
    }
  };

  static handleError(error: any): AppError {
    // Check if it's a known error
    const errorCode = error?.code || error?.message || 'unknown';
    const knownError = this.errorMap[errorCode];
    
    if (knownError) {
      return knownError;
    }

    // Handle Supabase errors
    if (error?.message) {
      if (error.message.includes('Password should be at least 6 characters')) {
        return this.errorMap['auth/weak-password'];
      }
      if (error.message.includes('User already registered')) {
        return this.errorMap['auth/email-already-in-use'];
      }
      if (error.message.includes('Invalid login credentials')) {
        return this.errorMap['auth/wrong-password'];
      }
      if (error.message.includes('Unable to send email')) {
        return {
          code: 'email/send-failed',
          message: error.message,
          userMessage: 'Unable to send confirmation email. Please check your email address or try again later.',
          action: 'Try again',
          severity: 'error'
        };
      }
    }

    // Default error
    return {
      code: 'unknown',
      message: error?.message || 'Unknown error',
      userMessage: 'Something went wrong. Please try again.',
      action: 'Try again',
      severity: 'error'
    };
  }

  static getErrorMessage(error: any): string {
    return this.handleError(error).userMessage;
  }

  static getErrorAction(error: any): string | undefined {
    return this.handleError(error).action;
  }

  static getErrorSeverity(error: any): 'error' | 'warning' | 'info' {
    return this.handleError(error).severity;
  }
} 