import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Gift, MessageCircle } from "lucide-react";

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
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
      const { data: newMember, error } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: null, // Anonymous user
          name: memberData.name,
          birthday: memberData.birthday,
          likes: memberData.likes,
          gift_wishes: memberData.gift_wishes,
          whatsapp_number: memberData.whatsapp_number
        })
        .select()
        .single();

      if (error) throw error;

      // Store anonymous group membership info in localStorage
      const anonymousGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
      anonymousGroups.push({
        groupId: group.id,
        groupName: group.name,
        memberId: newMember.id,
        whatsappNumber: memberData.whatsapp_number
      });
      localStorage.setItem('anonymousGroups', JSON.stringify(anonymousGroups));

      // Send WhatsApp confirmation message
      try {
        const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            template: {
              phone_number: memberData.whatsapp_number,
              template_name: 'group_confirmation',
              language: 'es_AR',
              template_parameters: [memberData.name]
            },
            templateId: '578b0acd-e167-4f27-be4d-10922344dd10'
          }
        });

        if (whatsappError) {
          console.error('WhatsApp message error:', whatsappError);
        }
      } catch (whatsappError: any) {
        console.error('WhatsApp message error:', whatsappError);
      }

      setShowSuccessDialog(true);
      setJoining(false);

    } catch (error: any) {
      console.error("Join group error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setJoining(false);
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

  const handleGoToGroup = () => {
    // Store context and redirect to auth to see the group they joined
    sessionStorage.setItem('auth_context', 'join');
    sessionStorage.setItem('redirect_to', '/my-groups');
    navigate('/auth?context=join');
  };

  const handleCreateAccount = () => {
    // Store context and redirect to auth to create their own group
    sessionStorage.setItem('auth_context', 'create');
    sessionStorage.setItem('redirect_to', '/create-group');
    navigate('/auth?context=create');
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
                Include country and zone code for WhatsApp notifications: +5411AAAABBBB
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogDescription className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <p className="font-medium text-green-800 mb-2 flex items-center justify-center gap-2">
                  <span className="animate-pulse">🎉</span>
                  You've successfully joined "{group?.name}"!
                  <span className="animate-pulse">🎉</span>
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-blue-600 animate-bounce" />
                  <p className="font-medium text-blue-800">
                    WhatsApp Confirmation
                  </p>
                </div>
                <p className="text-sm text-blue-700">
                  📱 We're sending you a confirmation message on WhatsApp right now! Check your messages in a few moments.
                </p>
              </div>
              
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleGoToGroup}
                  className="w-full"
                >
                  Create User to View/Create Groups
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Didn't receive the confirmation?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open('https://wa.me/541154191677?text=Hello,%20I%20didn\'t%20receive%20the%20group%20confirmation%20message', '_blank');
                  }}
                  className="w-full"
                >
                  📞 Contact us on WhatsApp
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JoinGroup;