import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft, Copy, MessageCircle, User, Mail } from "lucide-react";
const CreateGroup = () => {
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    invite_code: ""
  });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<any>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Smart back navigation - goes to dashboard if authenticated, landing page if not
  const handleBackNavigation = () => {
    if (currentUser && !isAnonymous) {
      navigate("/groups");
    } else {
      navigate("/");
    }
  };

  // When the success dialog is closed (e.g., user clicks the X), go to dashboard
  const handleSuccessDialogChange = (open: boolean) => {
    setShowSuccessDialog(open);
    if (!open) {
      navigate("/groups");
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // Redirect to auth if not authenticated
          sessionStorage.setItem('redirect_to', '/create');
          sessionStorage.setItem('auth_context', 'create');
          navigate('/auth?context=create');
          return;
        }
        
        // User is authenticated
        setIsAnonymous(false);
        setCurrentUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/auth?context=create');
      }
    };

    checkAuthentication();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("CreateGroup: Starting form submission");
    console.log("CreateGroup: Current user:", currentUser);

    if (!groupData.name.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to create a group",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Auto-generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      console.log("CreateGroup: About to create group with data:", {
        name: groupData.name,
        description: "", // Empty description initially
        invite_code: inviteCode,
        created_by: currentUser.id
      });

      // Create the group with created_by to trigger auto-add creator
      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name: groupData.name,
          description: "", // Empty description initially
          invite_code: inviteCode,
          created_by: currentUser.id // This triggers the database trigger to add creator as member
        })
        .select()
        .single();

      console.log("CreateGroup: Supabase response:", { group, error });

      if (error) {
        console.error("CreateGroup: Supabase error:", error);
        throw error;
      }

      console.log("CreateGroup: Group created successfully:", group);

      // Check if creator was automatically added as member by database trigger
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      console.log("CreateGroup: Creator member data:", memberData, "Error:", memberError);

      // If no member data found, manually add the creator as fallback
      let finalMemberData = memberData;
      if (!memberData) {
        console.log("CreateGroup: Database trigger didn't add creator, manually adding...");
        try {
          const { data: newMember, error: addMemberError } = await supabase
            .from('group_members')
            .insert({
              group_id: group.id,
              user_id: currentUser.id,
              name: 'Group Creator',
              birthday: '1990-01-01',
              likes: '',
              gift_wishes: '',
              whatsapp_number: ''
            })
            .select()
            .single();

          if (addMemberError) {
            console.error("CreateGroup: Failed to manually add creator:", addMemberError);
            // Continue anyway - user can join their own group later
          } else {
            console.log("CreateGroup: Successfully added creator manually:", newMember);
            finalMemberData = newMember;
          }
        } catch (fallbackError) {
          console.error("CreateGroup: Fallback member creation failed:", fallbackError);
          // Continue anyway - this is not critical for the success flow
        }
      }

      // Store the created group for the success dialog
      setCreatedGroup({ ...group, memberData: finalMemberData });
      setShowSuccessDialog(true);

    } catch (error: any) {
      console.error("CreateGroup: Caught error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!createdGroup) return;
    
    const inviteUrl = `https://whats-up-birthdays-buddy.vercel.app/join?invite=${createdGroup.invite_code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied! 📋",
      description: "Invite link copied to clipboard",
    });
  };

  const shareOnWhatsApp = () => {
    if (!createdGroup) return;
    
    const inviteUrl = `https://whats-up-birthdays-buddy.vercel.app/join?invite=${createdGroup.invite_code}`;
    const message = `🎉 Join my birthday group "${createdGroup.name}"!\n\nClick this link to join and never miss a birthday again:\n${inviteUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleCreateAccount = () => {
    // Store redirect and context for claiming group ownership
    sessionStorage.setItem('redirect_to', '/groups');
    sessionStorage.setItem('auth_context', 'claim');
    navigate('/auth?context=claim');
  };

  const handleGoToDashboard = () => {
    setShowSuccessDialog(false);
    navigate("/groups");
  };

  const handleUpdateDescription = async () => {
    if (!createdGroup) return;
    
    try {
      const { error } = await supabase
        .from("groups")
        .update({ description: tempDescription })
        .eq("id", createdGroup.id);

      if (error) throw error;

      // Update the created group state
      setCreatedGroup({ ...createdGroup, description: tempDescription });
      setEditingDescription(false);
      
      toast({
        title: "Description updated!",
        description: "Your group description has been saved.",
      });
    } catch (error: any) {
      console.error("Error updating description:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update description.",
        variant: "destructive",
      });
    }
  };

  const handleStartEditingDescription = () => {
    setTempDescription(createdGroup?.description || "");
    setEditingDescription(true);
  };

  // Component always renders now - no loading state needed for auth check

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
            <Users className="w-8 h-8 text-celebration" />
          </div>
          <CardTitle className="text-2xl">Create Your Group</CardTitle>
          <CardDescription>
            Set up a new birthday group for your family or friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                type="text"
                value={groupData.name}
                onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                placeholder="Family, Friends, Office Team..."
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Group..." : "Create Group"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={handleSuccessDialogChange}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-center">
              🎉 Group Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your group "{createdGroup?.name}" is ready to use!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Group Info Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Group Details</h4>
              
              <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Group Name:</p>
                  <p className="text-sm">{createdGroup?.name}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">Description:</p>
                    {!editingDescription && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStartEditingDescription}
                        className="h-auto p-1 text-xs"
                      >
                        {createdGroup?.description ? "Edit" : "Add"}
                      </Button>
                    )}
                  </div>
                  
                  {editingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        placeholder="Tell everyone what this group is about"
                        className="h-20 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleUpdateDescription}
                          className="text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDescription(false)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {createdGroup?.description || "No description yet"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Invite Link Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Share Your Group</h4>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Invite Link:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                    https://whats-up-birthdays-buddy.vercel.app/join?invite={createdGroup?.invite_code}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInviteLink}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={shareOnWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share on WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={copyInviteLink}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Profile Completion Section */}
            {createdGroup?.memberData && (
              createdGroup.memberData.name === 'Group Creator' || 
              createdGroup.memberData.birthday === '1990-01-01' ||
              !createdGroup.memberData.whatsapp_number ||
              createdGroup.memberData.whatsapp_number === ''
            ) ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 mb-1">Complete Your Profile</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Add your birthday and WhatsApp number so others can celebrate with you and you receive reminders!
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate('/profile')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Complete Profile Now
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-green-600 mt-0.5">✅</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 mb-1">Group Ready!</h4>
                    <p className="text-sm text-green-700">
                      Your group is set up and ready to use. Start inviting friends and family!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGoToDashboard}
                className="flex-1"
              >
                View My Groups
              </Button>
              {createdGroup?.memberData && (
                createdGroup.memberData.name === 'Group Creator' || 
                createdGroup.memberData.birthday === '1990-01-01' ||
                !createdGroup.memberData.whatsapp_number ||
                createdGroup.memberData.whatsapp_number === ''
              ) && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="flex-1"
                >
                  Complete Profile
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGroup;