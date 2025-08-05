import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Gift, ArrowLeft, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/LoadingStates";
import { Validator } from "@/lib/validation";
import { ErrorHandler } from "@/lib/errorHandler";

interface FormErrors {
  emailOrPhone?: string;
  password?: string;
}

interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Medium' | 'Strong';
  color: 'red' | 'yellow' | 'green';
}

const Auth = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [activeTab, setActiveTab] = useState<string>('signin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const flow = searchParams.get('flow') || 'signin';
  const context = searchParams.get('context');

  // Initialize active tab based on flow parameter
  useEffect(() => {
    setActiveTab(flow);
  }, [flow]);

  // Cleanup effect to handle edge cases
  useEffect(() => {
    // Cleanup function to handle component unmount or navigation
    const handleBeforeUnload = () => {
      // Don't clear everything on unload, just log for debugging
      console.log('Auth component unmounting');
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Smart back navigation - goes to dashboard if authenticated, landing page if not
  const handleBackNavigation = () => {
    if (currentUser && !isAnonymous) {
      navigate("/groups");
    } else {
      navigate("/");
    }
  };

  // Password strength calculator
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return {
      score,
      label: score < 2 ? 'Weak' : score < 4 ? 'Medium' : 'Strong',
      color: score < 2 ? 'red' : score < 4 ? 'yellow' : 'green'
    };
  };

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const errors: FormErrors = {};
    
    switch (field) {
      case 'emailOrPhone':
        if (!value.trim()) {
          errors.emailOrPhone = 'Email is required';
          setFieldStatus(prev => ({ ...prev, emailOrPhone: 'invalid' }));
        } else {
          const validation = Validator.validateEmail(value);
          if (!validation.isValid) {
            errors.emailOrPhone = validation.errors[0];
            setFieldStatus(prev => ({ ...prev, emailOrPhone: 'invalid' }));
          } else {
            setFieldStatus(prev => ({ ...prev, emailOrPhone: 'valid' }));
          }
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
          setFieldStatus(prev => ({ ...prev, password: 'invalid' }));
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
          setFieldStatus(prev => ({ ...prev, password: 'invalid' }));
        } else {
          setFieldStatus(prev => ({ ...prev, password: 'valid' }));
        }
        break;
    }
    
    return errors;
  };

  // Handle field changes with validation
  const handleFieldChange = (field: string, value: string) => {
    if (field === 'emailOrPhone') {
      setEmailOrPhone(value);
    } else if (field === 'password') {
      setPassword(value);
      // Calculate password strength for password field
      if (value) {
        setPasswordStrength(calculatePasswordStrength(value));
      } else {
        setPasswordStrength(null);
      }
    }
    
    // Clear previous error for this field
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
    
    // Validate field if it has a value
    if (value.trim()) {
      const fieldErrors = validateField(field, value);
      setFormErrors(prev => ({ ...prev, ...fieldErrors }));
    } else {
      setFieldStatus(prev => ({ ...prev, [field]: 'idle' }));
    }
  };

  // Handle automatic tab switching when user already exists
  const handleUserExists = () => {
    // Clear any pending confirmation state immediately
    setPendingConfirmation(false);
    localStorage.removeItem('pending_email_confirmation');
    localStorage.removeItem('pending_email_confirmation_timestamp');
    
    // Switch to sign-in tab
    setActiveTab('signin');
    
    // Clear any form errors
    setFormErrors({});
    
    // Clear field status
    setFieldStatus({});
    
    // Clear password strength
    setPasswordStrength(null);
    
    // Keep the email in the field for convenience
    // Don't clear emailOrPhone so user doesn't have to retype it
    
    toast({
      title: "Account already exists! 🎉",
      description: `We found an account for ${emailOrPhone}. Please sign in with your password.`,
      variant: "default",
    });
  };

  useEffect(() => {
    /*
      Handle auth callback and session management.
      This processes email confirmation tokens and manages auth state.
    */
    const handleAuthCallback = async () => {
      try {
        // First, get the current session to handle any auth callbacks
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
        }

        // Set up auth state change listener to handle confirmations
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            // Essential logging for production monitoring
            if (event === 'SIGNED_IN' && session?.user) {
              // Clear any pending confirmations
              localStorage.removeItem('pending_email_confirmation');
              localStorage.removeItem('pending_email_confirmation_timestamp');
              setPendingConfirmation(false);

              // Check if this is a password reset by looking at the URL or session
              const urlParams = new URLSearchParams(window.location.search);
              const isPasswordReset = urlParams.get('type') === 'recovery' || 
                                    window.location.hash.includes('type=recovery');
              
              if (isPasswordReset) {
                // Handle password reset success
                toast({
                  title: "Password reset successful! 🎉",
                  description: "Your password has been updated successfully.",
                });
              } else {
                // Regular sign in
                toast({
                  title: "Email confirmed! 🎉",
                  description: "Welcome to Birthday Buddy!",
                });
              }

              // Handle pending group associations
              const pendingGroupId = localStorage.getItem('pendingGroupId');
              if (pendingGroupId) {
                try {
                  await supabase
                    .from("groups")
                    .update({ created_by: session.user.id })
                    .eq("id", pendingGroupId);

                  localStorage.removeItem('pendingGroupId');
                  localStorage.removeItem('pendingGroupName');
                } catch (groupError) {
                  console.error("Error associating group:", groupError);
                }
              }

              // Handle anonymous member upgrade
              await handleAnonymousUpgrade(session.user);

              // Handle redirect
              const redirectTo = sessionStorage.getItem('redirect_to');
              if (redirectTo) {
                sessionStorage.removeItem('redirect_to');
                sessionStorage.removeItem('auth_context');
                setTimeout(() => {
                  window.location.href = redirectTo;
                }, 1000); // Small delay to show success message
              } else {
                setTimeout(() => {
                  navigate("/groups");
                }, 1000);
              }
            } else if (event === 'PASSWORD_RECOVERY') {
              // Handle password recovery event
              toast({
                title: "Password reset link sent! 📧",
                description: "Please check your email for the password reset link.",
              });
            } else if (event === 'SIGNED_OUT') {
              // Handle sign out if needed
            }
          }
        );

        // Now check if we already have a valid user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update user state
          setCurrentUser(user);
          setIsAnonymous(false);
          
          // Clear any pending confirmations since user is authenticated
          localStorage.removeItem('pending_email_confirmation');
          localStorage.removeItem('pending_email_confirmation_timestamp');
          setPendingConfirmation(false);

          // Check if there's a specific redirect destination
          const redirectTo = sessionStorage.getItem('redirect_to');
          
          // If there's a pending group, associate it with the user
          const pendingGroupId = localStorage.getItem('pendingGroupId');
          if (pendingGroupId) {
            try {
              await supabase
                .from("groups")
                .update({ created_by: user.id })
                .eq("id", pendingGroupId);

              localStorage.removeItem('pendingGroupId');
              localStorage.removeItem('pendingGroupName');
            } catch (error) {
              console.error("Error associating group:", error);
            }
          }

          // Handle anonymous member upgrade
          await handleAnonymousUpgrade(user);

          // Redirect based on context
          if (redirectTo) {
            sessionStorage.removeItem('redirect_to');
            sessionStorage.removeItem('auth_context');
            window.location.href = redirectTo;
          } else {
            navigate("/groups");
          }
        } else {
          // No authenticated user
          setCurrentUser(null);
          setIsAnonymous(true);
          
          // Check for pending confirmations
          const pendingEmail = localStorage.getItem('pending_email_confirmation');
          const pendingTimestamp = localStorage.getItem('pending_email_confirmation_timestamp');
          
          if (pendingEmail) {
            // Check if confirmation is still valid (24 hours)
            const now = Date.now();
            const timestamp = pendingTimestamp ? parseInt(pendingTimestamp) : 0;
            const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            
            if (now - timestamp < twentyFourHours) {
              setEmailOrPhone(pendingEmail);
              setPendingConfirmation(true);
            } else {
              // Confirmation expired, clear it
              localStorage.removeItem('pending_email_confirmation');
              localStorage.removeItem('pending_email_confirmation_timestamp');
              console.log('Pending email confirmation expired');
            }
          }
          
          // Load remembered email if available
          const rememberedUser = localStorage.getItem('rememberUser');
          if (rememberedUser && !pendingEmail) {
            setEmailOrPhone(rememberedUser);
            setRememberMe(true);
          }
        }

        // Store subscription for cleanup
        return subscription;
      } catch (error) {
        console.error("Auth callback error:", error);
        return null;
      }
    };

    let subscription: any = null;
    
    handleAuthCallback().then((sub) => {
      subscription = sub;
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate, toast]);

  const handleAnonymousUpgrade = async (user: any) => {
    try {
      // Check for anonymous group memberships in localStorage
      const anonymousGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
      
      for (const anonymousGroup of anonymousGroups) {
        if (anonymousGroup.memberId) {
          // Update the group member to associate with the new user
          await supabase
            .from("group_members")
            .update({ user_id: user.id })
            .eq("id", anonymousGroup.memberId);
        }
      }

      // Clear anonymous groups from localStorage
      if (anonymousGroups.length > 0) {
        localStorage.removeItem('anonymousGroups');
        toast({
          title: "Account linked! 🎉",
          description: `Your ${anonymousGroups.length} group membership(s) have been linked to your account.`,
        });
      }
    } catch (error) {
      console.error("Error upgrading anonymous member:", error);
    }
  };

  const isEmail = (value: string) => value.includes('@');

  const handleResendConfirmation = async () => {
    const pendingEmail = localStorage.getItem('pending_email_confirmation');
    if (!pendingEmail) {
      toast({
        title: "No pending confirmation",
        description: "No email confirmation is currently pending.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        // Remove custom redirect - let Supabase use default configuration
        // options: {
        //   emailRedirectTo: 'https://no-cuelgues.vercel.app/auth'
        // }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Confirmation email resent! 📧",
        description: "Please check your inbox and spam folder for the new confirmation link.",
      });
    } catch (error: any) {
      console.error("Resend error:", error);
      toast({
        title: "Resend failed",
        description: error.message || "Failed to resend confirmation email. Please try signing up again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearPendingConfirmation = () => {
    localStorage.removeItem('pending_email_confirmation');
    localStorage.removeItem('pending_email_confirmation_timestamp');
    setPendingConfirmation(false);
    setEmailOrPhone('');
    setPassword('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For signup, we need an email
      if (!isEmail(emailOrPhone)) {
        throw new Error("Please use a valid email address for sign up");
      }

      // Validate all required fields before submission
      const requiredFields = ['emailOrPhone', 'password'];
      const validationErrors: FormErrors = {};
      
      requiredFields.forEach(field => {
        const value = field === 'emailOrPhone' ? emailOrPhone : password;
        if (!value || (typeof value === 'string' && !value.trim())) {
          validationErrors[field as keyof FormErrors] = `${field === 'emailOrPhone' ? 'Email' : 'Password'} is required`;
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        toast({
          title: "Please complete all required fields",
          description: "Please fill in all required fields before creating your account",
          variant: "destructive",
        });
        return;
      }

      // Try to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: emailOrPhone,
        password,
      });

      if (error) {
        console.error("❌ Signup error details:", {
          message: error.message,
          status: error.status,
          type: error.constructor.name,
          code: error.code,
          name: error.name,
        });

        // Enhanced check for existing user - check multiple possible error patterns
        const isExistingUser = 
          error.message?.toLowerCase().includes('user already registered') ||
          error.message?.toLowerCase().includes('already been registered') ||
          error.message?.toLowerCase().includes('email already in use') ||
          error.message?.toLowerCase().includes('already exists') ||
          error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('user already exists') ||
          error.message?.toLowerCase().includes('email already registered') ||
          error.code === 'auth/email-already-in-use' ||
          error.code === 'auth/user-already-registered' ||
          error.code === 'auth/user-already-exists' ||
          error.status === 422 || // Common status for existing user errors
          error.status === 400; // Another common status for validation errors

        if (isExistingUser) {
          console.log("✅ Detected existing user, calling handleUserExists");
          handleUserExists();
          return;
        }

        console.log("❌ Error not recognized as existing user, showing generic error");
        const appError = ErrorHandler.handleError(error);
        toast({
          title: appError.userMessage,
          description: appError.action,
          variant: appError.severity === 'error' ? 'destructive' : 'default',
        });
        return;
      }

      // If there's a pending group, associate it with the user
      const pendingGroupId = localStorage.getItem('pendingGroupId');
      if (pendingGroupId && data.user) {
        try {
          await supabase
            .from("groups")
            .update({ created_by: data.user.id })
            .eq("id", pendingGroupId);
          
          localStorage.removeItem('pendingGroupId');
          localStorage.removeItem('pendingGroupName');
        } catch (error) {
          console.error("Error associating group:", error);
        }
      }

      // Check if user needs email confirmation
      if (data.user && !data.session) {
        toast({
          title: "Check your email! 📧",
          description: "We've sent a confirmation link to your email. Please check your inbox and spam folder. The link will expire in 24 hours.",
        });
        
        // Store signup info for potential resend
        localStorage.setItem('pending_email_confirmation', emailOrPhone);
        localStorage.setItem('pending_email_confirmation_timestamp', Date.now().toString());
        setPendingConfirmation(true);
      } else if (data.session) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Birthday Buddy!",
        });
        
        // Clear any pending confirmations since user is now signed in
        localStorage.removeItem('pending_email_confirmation');
        localStorage.removeItem('pending_email_confirmation_timestamp');
        setPendingConfirmation(false);
        
        // Handle redirect
        const redirectTo = sessionStorage.getItem('redirect_to');
        if (redirectTo) {
          sessionStorage.removeItem('redirect_to');
          sessionStorage.removeItem('auth_context');
          window.location.href = redirectTo;
        } else {
          navigate("/groups");
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Enhanced check for existing user in catch block as well
      const isExistingUser = 
        error.message?.toLowerCase().includes('user already registered') ||
        error.message?.toLowerCase().includes('already been registered') ||
        error.message?.toLowerCase().includes('email already in use') ||
        error.message?.toLowerCase().includes('already exists') ||
        error.message?.toLowerCase().includes('already registered') ||
        error.code === 'auth/email-already-in-use' ||
        error.code === 'auth/user-already-registered' ||
        error.status === 422;

      if (isExistingUser) {
        handleUserExists();
        return;
      }
      
      const appError = ErrorHandler.handleError(error);
      toast({
        title: appError.userMessage,
        description: appError.action,
        variant: appError.severity === 'error' ? 'destructive' : 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For sign-in, we only support email addresses
      if (!isEmail(emailOrPhone)) {
        throw new Error("Please use your email address to sign in. Phone number sign-in is not currently supported.");
      }

      // Validate all required fields before submission
      const requiredFields = ['emailOrPhone', 'password'];
      const validationErrors: FormErrors = {};
      
      requiredFields.forEach(field => {
        const value = field === 'emailOrPhone' ? emailOrPhone : password;
        if (!value || (typeof value === 'string' && !value.trim())) {
          validationErrors[field as keyof FormErrors] = `${field === 'emailOrPhone' ? 'Email' : 'Password'} is required`;
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        toast({
          title: "Please complete all required fields",
          description: "Please fill in all required fields before signing in",
          variant: "destructive",
        });
        return;
      }

      // Try to sign in with email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password,
      });

      if (error) {
        console.error("Auth: Sign-in error:", error);
        const appError = ErrorHandler.handleError(error);
        toast({
          title: appError.userMessage,
          description: appError.action,
          variant: appError.severity === 'error' ? 'destructive' : 'default',
        });
        return;
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberUser', emailOrPhone);
      } else {
        localStorage.removeItem('rememberUser');
      }

      // Check for redirect destination
      const redirectTo = sessionStorage.getItem('redirect_to');
      const authContext = sessionStorage.getItem('auth_context');
      
      if (redirectTo) {
        sessionStorage.removeItem('redirect_to');
        sessionStorage.removeItem('auth_context');
        window.location.href = redirectTo;
      } else {
        navigate("/groups");
      }
    } catch (error: any) {
      console.error("Sign-in error:", error);
      const appError = ErrorHandler.handleError(error);
      toast({
        title: appError.userMessage,
        description: appError.action,
        variant: appError.severity === 'error' ? 'destructive' : 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailOrPhone || !isEmail(emailOrPhone)) {
      toast({
        title: "Email required",
        description: "Please enter your email address first to reset your password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailOrPhone, {
        redirectTo: window.location.hostname === 'localhost' 
          ? 'https://localhost:3000/auth'
          : 'https://no-cuelgues.vercel.app/auth'
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset email sent! 📧",
        description: "Please check your inbox and spam folder for the password reset link.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      const appError = ErrorHandler.handleError(error);
      toast({
        title: "Password reset failed",
        description: appError.userMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-celebration/5 to-birthday/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackNavigation}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="w-16 h-16 bg-celebration/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-celebration" />
          </div>
          <CardTitle className="text-2xl">
            {context === 'create' ? 'Create Your Account' : 
             context === 'join' ? 'Create Account (Optional)' : 
             context === 'claim' ? 'Claim Your Group' :
             'Welcome to Birthday Buddy'}
          </CardTitle>
          <CardDescription>
            {context === 'create' 
              ? 'Create your account to manage groups and access the full dashboard'
              : context === 'join'
              ? 'Link your group membership to an account for easier management'
              : context === 'claim'
              ? 'Create an account to manage your group and access the full dashboard'
              : 'Join groups and never miss a birthday again'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingConfirmation ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <strong>{emailOrPhone}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Please check your inbox and spam folder. The link expires in 24 hours.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleResendConfirmation} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Resending..." : "Resend Confirmation Email"}
                </Button>
                <Button 
                  onClick={handleClearPendingConfirmation} 
                  variant="ghost" 
                  className="w-full text-sm"
                >
                  Sign In with Different Account
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Already have an account? Click "Sign In with Different Account" to access the normal sign-in form.
                </p>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Not receiving emails?</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure {emailOrPhone} is correct</li>
                  <li>• Add your confirmation emails to your contacts</li>
                  <li>• Try a different email provider if issues persist</li>
                </ul>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={emailOrPhone}
                      onChange={(e) => handleFieldChange('emailOrPhone', e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={`${fieldStatus.emailOrPhone === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.emailOrPhone === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {fieldStatus.emailOrPhone === 'valid' && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                    {fieldStatus.emailOrPhone === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {fieldStatus.emailOrPhone === 'invalid' && formErrors.emailOrPhone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.emailOrPhone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter your email address to sign in
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      required
                      className={`${fieldStatus.password === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.password === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {fieldStatus.password === 'valid' && (
                      <CheckCircle className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                    )}
                    {fieldStatus.password === 'invalid' && (
                      <AlertCircle className="absolute right-10 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {fieldStatus.password === 'invalid' && formErrors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.password}
                    </p>
                  )}
                  {passwordStrength && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.color === 'red' ? 'text-red-500' : 
                        passwordStrength.color === 'yellow' ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-4 rounded ${
                              level <= passwordStrength.score
                                ? passwordStrength.color === 'red' ? 'bg-red-500' :
                                  passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember-me" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" text="" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Input
                      id="signup-email"
                      type="email"
                      value={emailOrPhone}
                      onChange={(e) => handleFieldChange('emailOrPhone', e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={`${fieldStatus.emailOrPhone === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.emailOrPhone === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {fieldStatus.emailOrPhone === 'valid' && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                    {fieldStatus.emailOrPhone === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {fieldStatus.emailOrPhone === 'invalid' && formErrors.emailOrPhone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.emailOrPhone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Use a valid email address for account creation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      required
                      minLength={6}
                      className={`${fieldStatus.password === 'valid' ? 'border-green-500 focus:border-green-500' : ''} ${fieldStatus.password === 'invalid' ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {fieldStatus.password === 'valid' && (
                      <CheckCircle className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                    )}
                    {fieldStatus.password === 'invalid' && (
                      <AlertCircle className="absolute right-10 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {fieldStatus.password === 'invalid' && formErrors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.password}
                    </p>
                  )}
                  {passwordStrength && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.color === 'red' ? 'text-red-500' : 
                        passwordStrength.color === 'yellow' ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 w-4 rounded ${
                              level <= passwordStrength.score
                                ? passwordStrength.color === 'red' ? 'bg-red-500' :
                                  passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" text="" />
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;