import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Gift, ArrowLeft, Mail, Lock } from "lucide-react";

const EmailCollector = () => {
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const context = searchParams.get('context');

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !emailConfirm.trim() || !password.trim()) {
      toast({
        title: "All fields required",
        description: "Please fill in your email (twice) and password",
        variant: "destructive",
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (email !== emailConfirm) {
      toast({
        title: "Emails don't match",
        description: "Please make sure both email addresses are identical",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Store user email and password in localStorage
      const userData = {
        email: email,
        password: password, // In a real app, this should be hashed
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('userData', JSON.stringify(userData));

      // Handle any pending group associations
      const pendingGroupId = localStorage.getItem('pendingGroupId');
      if (pendingGroupId) {
        // Keep the pending group for now, it will be claimed when we navigate
        localStorage.setItem('pendingGroupEmail', email);
      }

      // Handle anonymous member upgrade
      const anonymousGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
      if (anonymousGroups.length > 0) {
        // Store email with anonymous groups for potential upgrade
        localStorage.setItem('anonymousGroupsEmail', email);
        toast({
          title: "Welcome! 🎉",
          description: `Your ${anonymousGroups.length} group membership(s) will be linked to ${email}.`,
        });
      }

      // Handle redirect based on context
      const redirectTo = sessionStorage.getItem('redirect_to');
      if (redirectTo) {
        sessionStorage.removeItem('redirect_to');
        sessionStorage.removeItem('auth_context');
        navigate(redirectTo);
      } else {
        navigate("/groups");
      }

    } catch (error: any) {
      console.error("Email collection error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const getContextMessage = () => {
    switch (context) {
      case 'create':
        return {
          title: "Create Your Group",
          description: "Enter your email to create and manage birthday groups"
        };
      case 'join':
        return {
          title: "Join the Group",
          description: "Enter your email to join the birthday group"
        };
      case 'claim':
        return {
          title: "Claim Your Groups",
          description: "Enter your email to permanently manage your groups"
        };
      default:
        return {
          title: "Join Birthday Buddy",
          description: "Enter your email to start organizing birthday celebrations"
        };
    }
  };

  const contextInfo = getContextMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Gift className="w-8 h-8 text-primary" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs">🎉</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {contextInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {contextInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-confirm">Confirm Email Address</Label>
              <div className="relative">
                <Input
                  id="email-confirm"
                  type="email"
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground">
                Please re-enter your email to confirm it's correct
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  required
                  className="pl-10"
                  minLength={6}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailCollector; 