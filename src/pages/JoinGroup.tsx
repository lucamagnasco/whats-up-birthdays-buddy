import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Gift } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string;
}

const JoinGroup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteCode = searchParams.get('invite');
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const { toast } = useToast();
  
  // Member data form
  const [memberData, setMemberData] = useState({
    name: "",
    birthday: "",
    likes: "",
    gift_wishes: "",
    whatsapp_number: ""
  });

  // Auth form
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      fetchGroupInfo();
    } else {
      toast({
        title: "Invalid Link",
        description: "No invite code found in the URL",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [inviteCode]);

  const fetchGroupInfo = async () => {
    try {
      console.log("Fetching group info for invite code:", inviteCode);
      
      const { data: group, error } = await supabase
        .from("groups")
        .select("id, name, description")
        .eq("invite_code", inviteCode)
        .is("deactivated_at", null) // Only active groups
        .maybeSingle();

      console.log("Group query result:", { group, error });

      if (error || !group) {
        console.error("Group not found or error:", error);
        throw new Error("Invalid invite code or group no longer exists");
      }

      console.log("Group found:", group);
      setGroup(group);
    } catch (error: any) {
      console.error("Fetch group info error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);

    try {
      let authResult;
      
      if (authMode === 'signup') {
        authResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
      } else {
        authResult = await supabase.auth.signInWithPassword({
          email,
          password
        });
      }

      if (authResult.error) throw authResult.error;

      if (authMode === 'signup' && !authResult.data.session) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link. Please check your email and click the link to verify your account before joining the group.",
        });
        return;
      }

      // If login successful, proceed to join group
      await joinGroupWithAuth();
      
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const joinGroupWithAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !group) throw new Error("Authentication required");

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this group",
        });
        navigate('/groups');
        return;
      }

      // Add member to group
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          name: memberData.name,
          birthday: memberData.birthday,
          likes: memberData.likes,
          gift_wishes: memberData.gift_wishes,
          whatsapp_number: memberData.whatsapp_number
        });

      if (error) throw error;

      // Send WhatsApp confirmation message
      try {
        const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            template: {
              phone_number: memberData.whatsapp_number,
              template_name: 'group_confirmation',
              language: 'es_AR',
              template_parameters: [memberData.name, group.name]
            },
            templateId: '65838f7e-0da3-42fd-bfa7-4d05c1c3df2c'
          }
        });

        if (whatsappError) {
          console.error('WhatsApp message error:', whatsappError);
          toast({
            title: "Success! 🎉",
            description: "You joined the group successfully, but we couldn't send the WhatsApp confirmation. Please check if your number is correct.",
          });
        } else {
          toast({
            title: "Success! 🎉",
            description: "Successfully joined the group! You should receive a WhatsApp confirmation message shortly.",
          });
        }
      } catch (whatsappError: any) {
        console.error('WhatsApp message error:', whatsappError);
        toast({
          title: "Success! 🎉",
          description: "You joined the group successfully, but we couldn't send the WhatsApp confirmation.",
        });
      }

      navigate('/groups');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is already authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // User is already authenticated, proceed directly
      await joinGroupWithAuth();
    } else {
      // User needs to authenticate first
      setShowAuthForm(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading group information...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join {group.name}</CardTitle>
          {group.description && (
            <CardDescription className="text-center">
              {group.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!showAuthForm ? (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={memberData.name}
                  onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <div className="relative">
                  <Input
                    id="birthday"
                    type="date"
                    value={memberData.birthday}
                    onChange={(e) => setMemberData({ ...memberData, birthday: e.target.value })}
                    required
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="likes">What do you like?</Label>
                <Input
                  id="likes"
                  value={memberData.likes}
                  onChange={(e) => setMemberData({ ...memberData, likes: e.target.value })}
                  placeholder="e.g., coffee, books, music..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gift_wishes">Gift wishes (optional)</Label>
                <div className="relative">
                  <Input
                    id="gift_wishes"
                    value={memberData.gift_wishes}
                    onChange={(e) => setMemberData({ ...memberData, gift_wishes: e.target.value })}
                    placeholder="What would you like as a gift?"
                  />
                  <Gift className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  value={memberData.whatsapp_number}
                  onChange={(e) => setMemberData({ ...memberData, whatsapp_number: e.target.value })}
                  placeholder="+1234567890"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include country code for WhatsApp notifications
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={joining}>
                {joining ? "Joining..." : "Join Group"}
              </Button>
            </form>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  To join this group, you need to sign in or create an account.
                </p>
              </div>
              
              <div className="flex space-x-1 mb-4">
                <Button
                  type="button"
                  variant={authMode === 'signup' ? 'default' : 'outline'}
                  onClick={() => setAuthMode('signup')}
                  className="flex-1"
                >
                  Sign Up
                </Button>
                <Button
                  type="button"
                  variant={authMode === 'signin' ? 'default' : 'outline'}
                  onClick={() => setAuthMode('signin')}
                  className="flex-1"
                >
                  Sign In
                </Button>
              </div>
              
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
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
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={joining}>
                  {joining ? "Processing..." : authMode === 'signup' ? "Sign Up & Join Group" : "Sign In & Join Group"}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAuthForm(false)}
                  className="w-full"
                >
                  Back to Group Info
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGroup;