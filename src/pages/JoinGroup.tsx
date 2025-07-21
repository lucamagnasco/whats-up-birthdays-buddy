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


  const joinGroupAnonymously = async () => {
    try {
      if (!group) throw new Error("Group information not found");

      // Check if someone with the same WhatsApp number already exists in this group
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .eq("whatsapp_number", memberData.whatsapp_number)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "Someone with this WhatsApp number is already in this group",
        });
        return;
      }

      // Add member to group without user_id (anonymous)
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: null, // Anonymous user
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
            title: "Welcome! 🎉",
            description: "You've successfully joined the group! You can sign up later to manage your groups. (WhatsApp confirmation couldn't be sent - please check your number)",
          });
        } else {
          toast({
            title: "Welcome! 🎉",
            description: "You've successfully joined the group! You should receive a WhatsApp confirmation shortly. You can sign up later to manage your groups.",
          });
        }
      } catch (whatsappError: any) {
        console.error('WhatsApp message error:', whatsappError);
        toast({
          title: "Welcome! 🎉",
          description: "You've successfully joined the group! You can sign up later to manage your groups. (WhatsApp confirmation couldn't be sent)",
        });
      }
      navigate('/');
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
    setJoining(true);
    
    try {
      // Join group anonymously without requiring authentication
      await joinGroupAnonymously();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
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
            
            <div className="p-3 bg-muted/50 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                💡 No account needed! You can join now and create an account later to manage your groups.
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={joining}>
              {joining ? "Joining..." : "Join Group"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGroup;