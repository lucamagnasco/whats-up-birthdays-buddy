import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Gift, ArrowLeft, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const flow = searchParams.get('flow') || 'signin';
  const context = searchParams.get('context');

  useEffect(() => {
    /*
      Only redirect when Supabase confirms there is a **valid** authenticated user.
      Using `getUser()` avoids false-positive redirects caused by stale sessions that may
      still exist in local storage but are no longer valid on the server.
    */
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Load remembered email if available
        const rememberedUser = localStorage.getItem('rememberUser');
        if (rememberedUser) {
          setEmailOrPhone(rememberedUser);
          setRememberMe(true);
        }
        
        // Check for pending email confirmation
        const pendingEmail = localStorage.getItem('pending_email_confirmation');
        if (pendingEmail) {
          setEmailOrPhone(pendingEmail);
          setPendingConfirmation(true);
        }
        
        return; // No valid session – stay on the auth page
      }

      // User is authenticated - clear any pending confirmations
      localStorage.removeItem('pending_email_confirmation');
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
    };

    checkUser();
  }, [navigate]);

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
        options: {
          emailRedirectTo: 'https://whats-up-birthdays-buddy.vercel.app/auth'
        }
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

      const { data, error } = await supabase.auth.signUp({
        email: emailOrPhone,
        password,
        options: {
          emailRedirectTo: 'https://whats-up-birthdays-buddy.vercel.app/auth'
        }
      });

      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes("Password should be at least 6 characters")) {
          throw new Error("Password must be at least 6 characters long");
        }
        if (error.message.includes("User already registered")) {
          throw new Error("An account with this email already exists. Please try signing in instead.");
        }
        if (error.message.includes("Unable to send email")) {
          throw new Error("Unable to send confirmation email. Please check your email address and try again, or contact support if the issue persists.");
        }
        throw error;
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
        setPendingConfirmation(true);
      } else if (data.session) {
        // User is immediately signed in (confirmations disabled)
        toast({
          title: "Account created successfully!",
          description: "Welcome to Birthday Buddy!",
        });
        
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
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("Auth: Starting sign-in process");
    console.log("Auth: Email/phone:", emailOrPhone);

    try {
      // For sign-in, we only support email addresses
      if (!isEmail(emailOrPhone)) {
        throw new Error("Please use your email address to sign in. Phone number sign-in is not currently supported.");
      }

      // Try to sign in with email
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password,
      });

      console.log("Auth: Sign-in response:", { data, error });

      if (error) {
        console.error("Auth: Sign-in error:", error);
        // Provide more user-friendly error messages
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials and try again.");
        }
        throw error;
      }

      console.log("Auth: Sign-in successful, user:", data.user);

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberUser', emailOrPhone);
      } else {
        localStorage.removeItem('rememberUser');
      }

      // Check for redirect destination
      const redirectTo = sessionStorage.getItem('redirect_to');
      const authContext = sessionStorage.getItem('auth_context');
      
      console.log("Auth: Checking redirect - redirectTo:", redirectTo, "context:", authContext);

      if (redirectTo) {
        console.log("Auth: Redirecting to:", redirectTo);
        sessionStorage.removeItem('redirect_to');
        sessionStorage.removeItem('auth_context');
        window.location.href = redirectTo;
      } else {
        console.log("Auth: No redirect, going to /groups");
        navigate("/groups");
      }
    } catch (error: any) {
      console.error("Auth: Sign-in error caught:", error);
      toast({
        title: "Sign In Error",
        description: error.message,
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
            onClick={() => navigate("/")}
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
                  Use Different Email
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Not receiving emails?</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure {emailOrPhone} is correct</li>
                  <li>• Add noreply@mail.supabase.io to your contacts</li>
                  <li>• Try a different email provider if issues persist</li>
                </ul>
              </div>
            </div>
          ) : (
            <Tabs defaultValue={flow} className="w-full">
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your email address to sign in
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
                  {loading ? "Signing in..." : "Sign In"}
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a valid email address for account creation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
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