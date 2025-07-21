import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Gift, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const flow = searchParams.get('flow') || 'signin';
  const context = searchParams.get('context');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // If there's a pending group, associate it with the user
        const pendingGroupId = localStorage.getItem('pendingGroupId');
        if (pendingGroupId) {
          try {
            await supabase
              .from("groups")
              .update({ created_by: session.user.id })
              .eq("id", pendingGroupId);
            
            localStorage.removeItem('pendingGroupId');
            localStorage.removeItem('pendingGroupName');
          } catch (error) {
            console.error("Error associating group:", error);
          }
        }
        navigate("/groups");
      }
    };
    checkUser();
  }, [navigate]);

  const isEmail = (value: string) => value.includes('@');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For signup, we need an email
      if (!isEmail(emailOrPhone)) {
        throw new Error("Please use an email address for sign up");
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailOrPhone,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

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

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your signup.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
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

    try {
      // Try to sign in with the provided email/phone
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone, // Supabase will handle email format
        password,
      });

      if (error) throw error;

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberUser', emailOrPhone);
      } else {
        localStorage.removeItem('rememberUser');
      }

      navigate("/groups");
    } catch (error: any) {
      toast({
        title: "Error",
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
            {context === 'group-created' ? 'Create Your Account' : 'Welcome to Birthday Buddy'}
          </CardTitle>
          <CardDescription>
            {context === 'group-created' 
              ? 'Complete your account to manage your group and access the dashboard'
              : 'Join groups and never miss a birthday again'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={flow} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-phone">Email or Phone</Label>
                  <Input
                    id="email-phone"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="your@email.com or +541188889999"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your email address or WhatsApp number
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;