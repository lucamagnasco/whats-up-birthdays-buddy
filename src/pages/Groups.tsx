import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Copy, Calendar, Gift, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import UserMenu from "@/components/UserMenu";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

interface Group {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_at: string;
  created_by: string;
  member_count?: number;
}

interface GroupMember {
  id: string;
  name: string;
  birthday: string;
  likes: string;
  gift_wishes?: string;
  whatsapp_number: string;
}

const Groups = () => {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [memberData, setMemberData] = useState({
    name: "",
    birthday: "",
    likes: "",
    gift_wishes: "",
    whatsapp_number: ""
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setCurrentUser(session.user);
          await loadGroups();
          
          // Check for invite parameter in URL
          const urlParams = new URLSearchParams(window.location.search);
          const inviteParam = urlParams.get('invite');
          if (inviteParam) {
            handleJoinGroup(inviteParam);
            // Remove the invite parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // No session, redirect to auth
          setLoading(false);
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          setLoading(true);
          await loadGroups();
        } else {
          setLoading(false);
          window.location.href = '/auth';
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const loadGroups = async () => {
    try {
      // Ensure we have a valid session before making requests
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("No session found, redirecting to auth");
        window.location.href = '/auth';
        return;
      }

      console.log("Loading groups for user:", session.user.id);

      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          group_members(count)
        `);

      if (error) throw error;

      const groupsWithCounts = data?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      })) || [];

      console.log("Loaded groups:", groupsWithCounts);
      setGroups(groupsWithCounts);
    } catch (error: any) {
      console.error("Load groups error:", error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive",
      });
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    console.log("Starting group creation process...");
    setLoading(true);

    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      if (!session?.user) {
        console.error("No user session found");
        throw new Error("Authentication required. Please sign in again.");
      }

      console.log("Creating group for user:", session.user.id);
      console.log("Group name:", newGroupName);
      console.log("Group description:", newGroupDescription);

      // Insert group with explicit created_by
      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          created_by: session.user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log("Group created successfully:", data);

      // Reset form and close dialog first
      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");

      // Reload groups to show the new group
      await loadGroups();
      
      // Check if user needs to complete profile data
      const { data: memberData } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', data.id)
        .eq('user_id', session.user.id)
        .single();
      
      console.log("Member data for creator:", memberData);
      
      // If the user has default/empty data, ask them to complete their profile
      if (memberData && (
        memberData.name === 'Group Creator' || 
        memberData.birthday === '1990-01-01' ||
        !memberData.whatsapp_number ||
        memberData.whatsapp_number === ''
      )) {
        // Set the group and ask for profile completion
        setSelectedGroup(data);
        setTimeout(() => {
          setMemberDialogOpen(true);
        }, 200);
        
        toast({
          title: "Group Created Successfully! 🎉",
          description: "Please complete your profile information to enable birthday reminders.",
        });
      } else {
        toast({
          title: "Group Created Successfully! 🎉",
          description: "Your group is ready to use.",
        });
      }

    } catch (error: any) {
      console.error("Create group error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const handleJoinGroup = async (inviteCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First, find the group by invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      if (groupError || !group) {
        throw new Error("Invalid invite code");
      }

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
        return;
      }

      // Set selected group and open member form
      setSelectedGroup(group);
      setMemberDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First, find the group by invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode)
        .single();

      if (groupError || !group) {
        throw new Error("Invalid invite code");
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        throw new Error("You are already a member of this group");
      }

      // Set selected group and open member form
      setSelectedGroup(group);
      setJoinDialogOpen(false);
      setMemberDialogOpen(true);
      setInviteCode("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addMemberToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Form submitted with selectedGroup:", selectedGroup);
      console.log("Current memberData:", memberData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!selectedGroup) {
        console.error("No group selected at form submission", selectedGroup);
        console.error("This should not happen - checking state...");
        throw new Error("No group selected");
      }

      console.log("Adding member to group:", selectedGroup.id);
      console.log("Member data:", memberData);

      // Check if this user is already a member (from auto-trigger)
      const { data: existingMember, error: checkError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", selectedGroup.id)
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error checking existing member:", checkError);
        throw checkError;
      }

      if (existingMember) {
        console.log("Updating existing member:", existingMember.id);
        // Update existing member with real data
        const { error } = await supabase
          .from("group_members")
          .update({
            name: memberData.name,
            birthday: memberData.birthday,
            likes: memberData.likes,
            gift_wishes: memberData.gift_wishes,
            whatsapp_number: memberData.whatsapp_number
          })
          .eq("id", existingMember.id);

        if (error) {
          console.error("Update member error:", error);
          throw error;
        }
      } else {
        console.log("Creating new member");
        // Create new member
        const { error } = await supabase
          .from("group_members")
          .insert({
            group_id: selectedGroup.id,
            user_id: user.id,
            name: memberData.name,
            birthday: memberData.birthday,
            likes: memberData.likes,
            gift_wishes: memberData.gift_wishes,
            whatsapp_number: memberData.whatsapp_number
          });

        if (error) {
          console.error("Insert member error:", error);
          throw error;
        }
      }

      console.log("Member added/updated successfully");

      // Send WhatsApp confirmation message
      if (memberData.whatsapp_number && memberData.whatsapp_number.trim()) {
        try {
          console.log("Sending WhatsApp confirmation to:", memberData.whatsapp_number);
          
          const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              template: {
                phone_number: memberData.whatsapp_number,
                template_name: 'group_confirmation',
                language: 'es_AR',
                template_parameters: [memberData.name, selectedGroup.name]
              },
              templateId: 'ff20074d-77d5-48dc-a158-ee4babe3f8a9'
            }
          });

          console.log("WhatsApp function result:", { whatsappResult, whatsappError });

          if (whatsappError) {
            console.error('WhatsApp message error:', whatsappError);
            toast({
              title: "Success! 🎉",
              description: "You joined the group successfully, but we couldn't send the WhatsApp confirmation. Please check if your number is correct.",
            });
          } else {
            console.log("WhatsApp message sent successfully");
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
      } else {
        toast({
          title: "Success! 🎉",
          description: "Successfully joined the group!",
        });
      }

      setMemberDialogOpen(false);
      setMemberData({ name: "", birthday: "", likes: "", gift_wishes: "", whatsapp_number: "" });
      setSelectedGroup(null);
      await loadGroups();
    } catch (error: any) {
      console.error("Add member error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/join?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const deleteGroup = async (groupId: string) => {
    try {
      console.log("Attempting to delete group:", groupId);
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }
      console.log("Current user ID:", user.id);
      
      // Check if user owns this group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("created_by, name")
        .eq("id", groupId)
        .single();
        
      if (groupError) {
        console.error("Error fetching group:", groupError);
        throw groupError;
      }
      
      console.log("Group data:", groupData);
      console.log("User owns group:", groupData.created_by === user.id);
      
      if (groupData.created_by !== user.id) {
        throw new Error("You can only delete groups you created");
      }

      // Soft delete: set deactivated_at timestamp
      const { error } = await supabase
        .from("groups")
        .update({ deactivated_at: new Date().toISOString() })
        .eq("id", groupId);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      // Update local state immediately
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));

      toast({
        title: "Group Deactivated",
        description: "The group has been deactivated and is no longer visible.",
      });

      // Refresh from server to ensure consistency
      await loadGroups();
    } catch (error: any) {
      console.error("Delete group error:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate group: " + error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Groups</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your birthday reminder groups</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <UserMenu />
          <div className="flex gap-2 sm:gap-3">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Users className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Join Group</span>
                <span className="xs:hidden">Join</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Join a Group</DialogTitle>
                <DialogDescription>
                  Enter the invite code to join an existing group
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={joinGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Join Group</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs sm:text-sm">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Create Group</span>
                <span className="xs:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new birthday reminder group for your friends
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., College Friends"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description">Description (Optional)</Label>
                  <Textarea
                    id="group-description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Describe your group..."
                  />
                </div>
                <Button type="submit" className="w-full">Create Group</Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <span className="truncate">{group.name}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              {group.description && (
                <CardDescription className="text-sm line-clamp-2">{group.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Invite Link</p>
                  <a 
                    href={`${window.location.origin}/join?invite=${group.invite_code}`}
                    className="text-xs text-primary hover:underline font-mono break-all line-clamp-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {window.location.origin}/join?invite={group.invite_code}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyInviteLink(group.invite_code)}
                  className="shrink-0 ml-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs sm:text-sm"
                  onClick={() => {
                    setSelectedGroup(group);
                    loadGroupMembers(group.id);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">View Members</span>
                  <span className="xs:hidden">Members</span>
                </Button>
                {currentUser && group.created_by === currentUser.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{group.name}"? This action cannot be undone. All members and data will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteGroup(group.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Group
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
          <p className="text-muted-foreground mb-6">Create your first group or join an existing one</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
            <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Join Group
            </Button>
          </div>
        </div>
      )}

      {/* Member Details Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <DialogTitle>
                {selectedGroup && currentUser && selectedGroup.created_by === currentUser.id 
                  ? `Complete Setup for ${selectedGroup.name}`
                  : `Join ${selectedGroup?.name}`
                }
              </DialogTitle>
              <DialogDescription>
                {selectedGroup && currentUser && selectedGroup.created_by === currentUser.id 
                  ? "As the group admin, please add your details to complete the group setup"
                  : "Please fill in your details to join the group"
                }
              </DialogDescription>
            </div>
            <LanguageToggle />
          </DialogHeader>
          <form onSubmit={addMemberToGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Your Name</Label>
              <Input
                id="member-name"
                value={memberData.name}
                onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-birthday">Your Birthday</Label>
              <Input
                id="member-birthday"
                type="date"
                value={memberData.birthday}
                onChange={(e) => setMemberData({...memberData, birthday: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-likes">Things You Like</Label>
              <Textarea
                id="member-likes"
                value={memberData.likes}
                onChange={(e) => setMemberData({...memberData, likes: e.target.value})}
                placeholder="Coffee, books, sports, music, etc."
                className="h-20"
              />
              <p className="text-xs text-muted-foreground">
                This helps others choose gifts for you
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-gift-wishes">Gift Wishes</Label>
              <Textarea
                id="member-gift-wishes"
                value={memberData.gift_wishes}
                onChange={(e) => setMemberData({...memberData, gift_wishes: e.target.value})}
                placeholder="Specific things you need or want as gifts..."
                className="h-20"
              />
              <p className="text-xs text-muted-foreground">
                Tell your friends what you specifically need or want
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-whatsapp">WhatsApp Number *</Label>
              <Input
                id="member-whatsapp"
                value={memberData.whatsapp_number}
                onChange={(e) => setMemberData({...memberData, whatsapp_number: e.target.value})}
                placeholder="+541188889999"
                required
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Required for birthday reminders!</strong></p>
                <p>Include country and zone code for WhatsApp notifications: +5411AAAABBBB</p>
                <p>Example: +541188889999, +447123456789</p>
              </div>
            </div>
            <Button type="submit" className="w-full">
              {selectedGroup && currentUser && selectedGroup.created_by === currentUser.id 
                ? "Complete Group Setup"
                : "Join Group"
              }
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group Members Dialog */}
      {selectedGroup && (
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedGroup.name} Members</DialogTitle>
              <DialogDescription>
                Birthday calendar and member information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{member.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Birthday: {formatDate(member.birthday)}</span>
                        </div>
                        {member.likes && (
                          <div className="flex items-start gap-2 text-sm">
                            <Gift className="w-4 h-4 mt-0.5 text-gift" />
                            <span><strong>Likes:</strong> {member.likes}</span>
                          </div>
                        )}
                        {member.gift_wishes && (
                          <div className="flex items-start gap-2 text-sm">
                            <Gift className="w-4 h-4 mt-0.5 text-primary" />
                            <span><strong>Gift Wishes:</strong> {member.gift_wishes}</span>
                          </div>
                        )}
                        {member.whatsapp_number && (
                          <div className="text-xs text-muted-foreground">
                            WhatsApp: {member.whatsapp_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {members.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No members in this group yet
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Groups;
