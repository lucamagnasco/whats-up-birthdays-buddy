import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Gift, Smartphone } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [connectExisting, setConnectExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate("/groups");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      // If connectExisting is true and we have a whatsapp number, connect existing memberships
      if (connectExisting && whatsappNumber && data.user) {
        try {
          // Update anonymous group members with this user_id
          const { error: updateError } = await supabase
            .from("group_members")
            .update({ user_id: data.user.id })
            .eq("whatsapp_number", whatsappNumber)
            .is("user_id", null);

          if (updateError) {
            console.error("Error connecting existing memberships:", updateError);
          } else {
            // Clear anonymous groups from localStorage since they're now connected
            localStorage.removeItem('anonymousGroups');
            toast({
              title: "Memberships Connected!",
              description: "Your existing group memberships have been linked to your account.",
            });
          }
        } catch (connectError) {
          console.error("Error connecting memberships:", connectError);
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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
          <div className="w-16 h-16 bg-celebration/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-celebration" />
          </div>
          <CardTitle className="text-2xl">Welcome to Birthday Buddy</CardTitle>
          <CardDescription>
            Join groups and never miss a birthday again
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                
                {/* Connect existing memberships section */}
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="connect-existing" 
                      checked={connectExisting}
                      onCheckedChange={(checked) => setConnectExisting(checked as boolean)}
                    />
                    <Label htmlFor="connect-existing" className="text-sm font-medium">
                      Connect existing group memberships
                    </Label>
                    <Smartphone className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-blue-700">
                    If you've already joined groups using your phone number, we can connect them to your account
                  </p>
                  
                  {connectExisting && (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-connect">Your WhatsApp Number</Label>
                      <Input
                        id="whatsapp-connect"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+541188889999"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the same number you used when joining groups
                      </p>
                    </div>
                  )}
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