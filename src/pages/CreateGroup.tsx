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
  const navigate = useNavigate();
  const { toast } = useToast();

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
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Anonymous user - allow group creation
          setIsAnonymous(true);
          setCurrentUser(null);
        } else {
          // Authenticated user
          setIsAnonymous(false);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // On error, assume anonymous
        setIsAnonymous(true);
        setCurrentUser(null);
      }
    };

    checkAuthentication();
  }, [navigate]);

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGroupData({ ...groupData, invite_code: code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("CreateGroup: Starting form submission");
    console.log("CreateGroup: Is anonymous:", isAnonymous);
    console.log("CreateGroup: Group data:", groupData);

    if (!groupData.name.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate invite code if not provided
      const inviteCode = groupData.invite_code || Math.random().toString(36).substring(2, 8).toUpperCase();

      console.log("CreateGroup: About to create group with data:", {
        name: groupData.name,
        description: groupData.description,
        invite_code: inviteCode,
        created_by: isAnonymous ? null : currentUser?.id
      });

      // Create the group (with or without owner)
      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name: groupData.name,
          description: groupData.description,
          invite_code: inviteCode,
          created_by: isAnonymous ? null : currentUser?.id
        })
        .select()
        .single();

      console.log("CreateGroup: Supabase response:", { group, error });

      if (error) {
        console.error("CreateGroup: Supabase error:", error);
        throw error;
      }

      console.log("CreateGroup: Group created successfully:", group);

      // For anonymous users, store pending group in localStorage
      if (isAnonymous) {
        localStorage.setItem('pendingGroupId', group.id);
        localStorage.setItem('pendingGroupName', group.name);
      }

      // Store the created group for the success dialog
      setCreatedGroup(group);
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

  // Component always renders now - no loading state needed for auth check

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
            <Users className="w-8 h-8 text-celebration" />
          </div>
          <CardTitle className="text-2xl">Create Your Group</CardTitle>
          <CardDescription>
            Set up a new birthday group for your family or friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                value={groupData.name}
                onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                placeholder="Family, Friends, Office Team..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={groupData.description}
                onChange={(e) => setGroupData({ ...groupData, description: e.target.value })}
                placeholder="Tell everyone what this group is about"
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-code"
                  value={groupData.invite_code}
                  onChange={(e) => setGroupData({ ...groupData, invite_code: e.target.value.toUpperCase() })}
                  placeholder="AUTO-GENERATED"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={generateInviteCode}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This code will allow others to join your group
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Group..." : "Create Group"}
            </Button>

            {isAnonymous && (
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>You can create a group instantly!</p>
                <p>Create an account after to manage it and access your dashboard.</p>
              </div>
            )}
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

            {/* Account/Profile Section */}
            {isAnonymous ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900 mb-1">Create Account to Manage Group</h4>
                    <p className="text-sm text-orange-700 mb-3">
                      Create an account to manage your group, view members, and access the full dashboard.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreateAccount}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Create Account
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Complete Your Profile</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Don't forget to add your birthday and contact info so others can celebrate with you!
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate('/profile')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Complete Profile
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleGoToDashboard}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGroup;