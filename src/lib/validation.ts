export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validator {
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errors.push('Email is required');
    } else if (!emailPattern.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    } else if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone) {
      errors.push('Phone number is required');
    } else {
      // Remove all non-digit characters for validation
      const digitsOnly = phone.replace(/\D/g, '');
      
      if (digitsOnly.length < 10) {
        errors.push('Phone number must have at least 10 digits');
      } else if (digitsOnly.length > 15) {
        errors.push('Phone number is too long');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateBirthday(birthday: string): ValidationResult {
    const errors: string[] = [];
    
    if (!birthday) {
      errors.push('Birthday is required');
    } else {
      const date = new Date(birthday);
      const today = new Date();
      const minDate = new Date('1900-01-01');
      
      if (isNaN(date.getTime())) {
        errors.push('Please enter a valid date');
      } else if (date > today) {
        errors.push('Birthday cannot be in the future');
      } else if (date < minDate) {
        errors.push('Birthday cannot be before 1900');
      } else {
        // Check if person is over 120 years old
        const age = today.getFullYear() - date.getFullYear();
        if (age > 120) {
          errors.push('Please check your birthday - you appear to be over 120 years old');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('Name is required');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (name.trim().length > 50) {
      errors.push('Name must be less than 50 characters');
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(name.trim())) {
      errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateGroupName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('Group name is required');
    } else if (name.trim().length < 3) {
      errors.push('Group name must be at least 3 characters long');
    } else if (name.trim().length > 100) {
      errors.push('Group name must be less than 100 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateInviteCode(code: string): ValidationResult {
    const errors: string[] = [];
    
    if (!code) {
      errors.push('Invite code is required');
    } else if (code.length < 6) {
      errors.push('Invite code must be at least 6 characters');
    } else if (code.length > 20) {
      errors.push('Invite code is too long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult {
    const errors: string[] = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value) {
        // Min length validation
        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters long`);
        }
        
        // Max length validation
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
          errors.push(`${field} must be less than ${rule.maxLength} characters`);
        }
        
        // Pattern validation
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
        
        // Custom validation
        if (rule.custom) {
          const customResult = rule.custom(value);
          if (typeof customResult === 'string') {
            errors.push(customResult);
          } else if (!customResult) {
            errors.push(`${field} is invalid`);
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
    }
    
    return phone;
  }
} 