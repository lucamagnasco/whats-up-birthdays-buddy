import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Gift, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorHandler } from "@/lib/errorHandler";
import { Validator } from "@/lib/validation";
import { LoadingSpinner, LoadingOverlay } from "@/components/LoadingStates";
import { UserFeedback, SuccessCard, ErrorCard } from "@/components/UserFeedback";

const EnhancedAuth = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedbackMessages, setFeedbackMessages] = useState<any[]>([]);
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

  // Smart back navigation - goes to dashboard if authenticated, landing page if not
  const handleBackNavigation = () => {
    if (currentUser && !isAnonymous) {
      navigate("/groups");
    } else {
      navigate("/");
    }
  };

  // Add feedback message
  const addFeedbackMessage = (message: any) => {
    const id = Date.now().toString();
    setFeedbackMessages(prev => [...prev, { ...message, id }]);
  };

  // Remove feedback message
  const removeFeedbackMessage = (id: string) => {
    setFeedbackMessages(prev => prev.filter(msg => msg.id !== id));
  };

  // Validate form data
  const validateForm = (data: { emailOrPhone: string; password: string }) => {
    const errors: Record<string, string> = {};
    
    // Validate email
    const emailValidation = Validator.validateEmail(data.emailOrPhone);
    if (!emailValidation.isValid) {
      errors.emailOrPhone = emailValidation.errors[0];
    }
    
    // Validate password
    const passwordValidation = Validator.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
    
    return errors;
  };

  // Clear form errors
  const clearFormErrors = () => {
    setFormErrors({});
  };

  // Handle automatic tab switching when user already exists
  const handleUserExists = () => {
    // Clear any pending confirmation state immediately
    setPendingConfirmation(false);
    localStorage.removeItem('pending_email_confirmation');
    
    // Switch to sign-in tab
    setActiveTab('signin');
    
    // Clear any form errors
    setFormErrors({});
    
    addFeedbackMessage({
      type: 'info',
      title: "Account already exists! 🎉",
      description: "We found your account. Please sign in with your password.",
      autoDismiss: true,
      dismissAfter: 5000
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
          const appError = ErrorHandler.handleError(sessionError);
          addFeedbackMessage({
            type: 'error',
            title: appError.userMessage,
            description: appError.action,
            autoDismiss: true,
            dismissAfter: 5000
          });
        }

        // Set up auth state change listener to handle confirmations
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              // Clear any pending confirmations
              localStorage.removeItem('pending_email_confirmation');
              setPendingConfirmation(false);

              // Show success message
              addFeedbackMessage({
                type: 'success',
                title: "Email confirmed! 🎉",
                description: "Welcome to Birthday Buddy!",
                autoDismiss: true,
                dismissAfter: 3000
              });

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
                  const appError = ErrorHandler.handleError(groupError);
                  addFeedbackMessage({
                    type: 'warning',
                    title: "Group Association Warning",
                    description: appError.userMessage,
                    autoDismiss: true,
                    dismissAfter: 5000
                  });
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
                }, 1000);
              } else {
                setTimeout(() => {
                  navigate("/groups");
                }, 1000);
              }
            } else if (event === 'SIGNED_OUT') {
              // Handle sign out if needed
            }
          }
        );

        // Now check if we already have a valid user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          setIsAnonymous(false);
          
          localStorage.removeItem('pending_email_confirmation');
          setPendingConfirmation(false);

          const redirectTo = sessionStorage.getItem('redirect_to');
          
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

          await handleAnonymousUpgrade(user);

          if (redirectTo) {
            sessionStorage.removeItem('redirect_to');
            sessionStorage.removeItem('auth_context');
            window.location.href = redirectTo;
          } else {
            navigate("/groups");
          }
        } else {
          setCurrentUser(null);
          setIsAnonymous(true);
          
          const pendingEmail = localStorage.getItem('pending_email_confirmation');
          if (pendingEmail) {
            setEmailOrPhone(pendingEmail);
            setPendingConfirmation(true);
          }
          
          const rememberedUser = localStorage.getItem('rememberUser');
          if (rememberedUser && !pendingEmail) {
            setEmailOrPhone(rememberedUser);
            setRememberMe(true);
          }
        }

        return subscription;
      } catch (error) {
        console.error("Auth callback error:", error);
        const appError = ErrorHandler.handleError(error);
        addFeedbackMessage({
          type: 'error',
          title: appError.userMessage,
          description: appError.action,
          autoDismiss: true,
          dismissAfter: 5000
        });
        return null;
      }
    };

    let subscription: any = null;
    
    handleAuthCallback().then((sub) => {
      subscription = sub;
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleAnonymousUpgrade = async (user: any) => {
    try {
      const anonymousGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
      
      for (const anonymousGroup of anonymousGroups) {
        if (anonymousGroup.memberId) {
          await supabase
            .from("group_members")
            .update({ user_id: user.id })
            .eq("id", anonymousGroup.memberId);
        }
      }

      if (anonymousGroups.length > 0) {
        localStorage.removeItem('anonymousGroups');
        addFeedbackMessage({
          type: 'success',
          title: "Account linked! 🎉",
          description: `Your ${anonymousGroups.length} group membership(s) have been linked to your account.`,
          autoDismiss: true,
          dismissAfter: 5000
        });
      }
    } catch (error) {
      console.error("Error upgrading anonymous member:", error);
      const appError = ErrorHandler.handleError(error);
      addFeedbackMessage({
        type: 'warning',
        title: "Account Linking Warning",
        description: appError.userMessage,
        autoDismiss: true,
        dismissAfter: 5000
      });
    }
  };

  const isEmail = (value: string) => value.includes('@');

  const handleResendConfirmation = async () => {
    const pendingEmail = localStorage.getItem('pending_email_confirmation');
    if (!pendingEmail) {
      addFeedbackMessage({
        type: 'warning',
        title: "No pending confirmation",
        description: "No email confirmation is currently pending.",
        autoDismiss: true,
        dismissAfter: 3000
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });

      if (error) {
        throw error;
      }

      addFeedbackMessage({
        type: 'success',
        title: "Confirmation email resent! 📧",
        description: "Please check your inbox and spam folder for the new confirmation link.",
        autoDismiss: true,
        dismissAfter: 5000
      });
    } catch (error: any) {
      console.error("Resend error:", error);
      const appError = ErrorHandler.handleError(error);
      addFeedbackMessage({
        type: 'error',
        title: "Resend failed",
        description: appError.userMessage,
        autoDismiss: true,
        dismissAfter: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearPendingConfirmation = () => {
    localStorage.removeItem('pending_email_confirmation');
    setPendingConfirmation(false);
    setEmailOrPhone('');
    setPassword('');
    clearFormErrors();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearFormErrors();

    try {
      // Validate form data
      const validationErrors = validateForm({ emailOrPhone, password });
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        setLoading(false);
        return;
      }

      if (!isEmail(emailOrPhone)) {
        throw new Error("Please use a valid email address for sign up");
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailOrPhone,
        password,
      });

      if (error) {
        // Check if user already exists
        if (error.message?.includes('User already registered') || 
            error.message?.includes('already been registered') ||
            error.code === 'auth/email-already-in-use') {
          handleUserExists();
          return;
        }
        throw error;
      }

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

      if (data.user && !data.session) {
        addFeedbackMessage({
          type: 'info',
          title: "Check your email! 📧",
          description: "We've sent a confirmation link to your email. Please check your inbox and spam folder. The link will expire in 24 hours.",
          autoDismiss: false
        });
        
        localStorage.setItem('pending_email_confirmation', emailOrPhone);
        setPendingConfirmation(true);
      } else if (data.session) {
        addFeedbackMessage({
          type: 'success',
          title: "Account created successfully!",
          description: "Welcome to Birthday Buddy!",
          autoDismiss: true,
          dismissAfter: 3000
        });
        
        localStorage.removeItem('pending_email_confirmation');
        setPendingConfirmation(false);
        
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
      
      // Check if user already exists
      if (error.message?.includes('User already registered') || 
          error.message?.includes('already been registered') ||
          error.code === 'auth/email-already-in-use') {
        handleUserExists();
        return;
      }
      
      const appError = ErrorHandler.handleError(error);
      addFeedbackMessage({
        type: 'error',
        title: "Sign Up Error",
        description: appError.userMessage,
        autoDismiss: true,
        dismissAfter: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearFormErrors();

    try {
      // Validate form data
      const validationErrors = validateForm({ emailOrPhone, password });
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        setLoading(false);
        return;
      }

      if (!isEmail(emailOrPhone)) {
        throw new Error("Please use your email address to sign in. Phone number sign-in is not currently supported.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password,
      });

      if (error) {
        throw error;
      }

      if (rememberMe) {
        localStorage.setItem('rememberUser', emailOrPhone);
      } else {
        localStorage.removeItem('rememberUser');
      }

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
      addFeedbackMessage({
        type: 'error',
        title: "Sign In Error",
        description: appError.userMessage,
        autoDismiss: true,
        dismissAfter: 5000
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
          {/* User Feedback Messages */}
          <UserFeedback 
            messages={feedbackMessages} 
            onDismiss={removeFeedbackMessage}
            className="mb-4"
          />

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
                  {loading ? <LoadingSpinner size="sm" text="Resending..." /> : "Resend Confirmation Email"}
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
                    <Label htmlFor="email-phone">Email Address</Label>
                    <Input
                      id="email-phone"
                      type="email"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={formErrors.emailOrPhone ? 'border-red-500' : ''}
                    />
                    {formErrors.emailOrPhone && (
                      <p className="text-sm text-red-500">{formErrors.emailOrPhone}</p>
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
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={formErrors.password ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formErrors.password && (
                      <p className="text-sm text-red-500">{formErrors.password}</p>
                    )}
                  </div>
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" text="Signing in..." /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={formErrors.emailOrPhone ? 'border-red-500' : ''}
                    />
                    {formErrors.emailOrPhone && (
                      <p className="text-sm text-red-500">{formErrors.emailOrPhone}</p>
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
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={formErrors.password ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formErrors.password && (
                      <p className="text-sm text-red-500">{formErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" text="Creating account..." /> : "Create Account"}
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

export default EnhancedAuth; 