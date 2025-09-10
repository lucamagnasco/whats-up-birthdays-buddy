import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Gift, Edit, Copy, MessageCircle, Share2, LogOut, Plus, Trash2 } from "lucide-react";
import ShareGroupButton from "@/components/ShareGroupButton";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import UserMenu from "@/components/UserMenu";
import { formatBirthdayDate } from "@/lib/utils";

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
  user_id?: string;
}

interface AnonymousGroup {
  groupId: string;
  groupName: string;
  whatsappNumber: string | null;
  memberId?: string | null;
  isCreator?: boolean;
}

const MyGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousGroups, setAnonymousGroups] = useState<AnonymousGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [hasIncompleteProfile, setHasIncompleteProfile] = useState(false);
  const [memberData, setMemberData] = useState({
    name: "",
    birthday: "",
    likes: "",
    gift_wishes: "",
    whatsapp_number: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const initializeGroups = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Authenticated user
          setCurrentUser(session.user);
          setIsAnonymous(false);
          await loadAuthenticatedGroups();
        } else {
          // Anonymous user - load from localStorage
          setIsAnonymous(true);
          await loadAnonymousGroups();
        }
      } catch (error) {
        console.error("Error initializing groups:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeGroups();
  }, []);

  const loadAuthenticatedGroups = async () => {
    try {
      // First get the current user to ensure we have a valid session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("User not authenticated:", userError);
        return;
      }

      console.log("Loading groups for authenticated user:", user.id);

      // Query groups where user is creator or member
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          group_members(count)
        `)
        .is("deactivated_at", null);

      if (error) {
        console.error("Error loading groups:", error);
        throw error;
      }

      console.log("Loaded groups:", data);

      const groupsWithCounts = data?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithCounts);

      // Check profile completeness for the current user
      if (currentUser) {
        const { data: memberships } = await supabase
          .from("group_members")
          .select("birthday, whatsapp_number")
          .eq("user_id", currentUser.id);

        const incomplete = (memberships || []).some((m: any) => {
          return (
            m.birthday === "1990-01-01" ||
            !m.whatsapp_number ||
            m.whatsapp_number.trim() === ""
          );
        });
        setHasIncompleteProfile(incomplete);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    }
  };

  const loadAnonymousGroups = async () => {
    // Load groups where user is a member
    const storedMemberGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
    
    // Also check for groups created by this anonymous user
    const pendingGroupId = localStorage.getItem('pendingGroupId');
    const pendingGroupName = localStorage.getItem('pendingGroupName');
    
    let allAnonymousGroups = [...storedMemberGroups];
    
    // If there's a pending group, add it to the list
    if (pendingGroupId && pendingGroupName) {
      // Check if this group is not already in the member groups
      const existingGroup = storedMemberGroups.find(g => g.groupId === pendingGroupId);
      if (!existingGroup) {
        try {
          // Verify the group still exists in the database
          const { data: groupExists } = await supabase
            .from("groups")
            .select("id, name")
            .eq("id", pendingGroupId)
            .single();
            
          if (groupExists) {
            allAnonymousGroups.push({
              groupId: pendingGroupId,
              groupName: pendingGroupName,
              memberId: null, // User is creator, not member yet
              whatsappNumber: null,
              isCreator: true
            });
          } else {
            // Clean up invalid pending group
            localStorage.removeItem('pendingGroupId');
            localStorage.removeItem('pendingGroupName');
          }
        } catch (error) {
          console.error("Error checking pending group:", error);
        }
      }
    }
    
    setAnonymousGroups(allAnonymousGroups);
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

  const handleGroupClick = async (group: Group | { id: string; name: string }) => {
    // Navigate to the group detail page
    navigate(`/groups/${group.id}`);
  };

  const handleEditProfile = (member: GroupMember) => {
    setMemberData({
      name: member.name,
      birthday: member.birthday,
      likes: member.likes,
      gift_wishes: member.gift_wishes || "",
      whatsapp_number: member.whatsapp_number
    });
    setEditDialogOpen(true);
  };

  const updateMemberProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedGroup) return;

      let memberToUpdate: GroupMember | undefined;

      if (isAnonymous) {
        // Find member by whatsapp number for anonymous users
        const anonymousGroup = anonymousGroups.find(g => g.groupId === selectedGroup.id);
        if (anonymousGroup) {
          memberToUpdate = members.find(m => m.whatsapp_number === anonymousGroup.whatsappNumber);
        }
      } else {
        // Find member by user_id for authenticated users
        memberToUpdate = members.find(m => m.user_id === currentUser?.id);
      }

      if (!memberToUpdate) {
        throw new Error("Could not find your profile to update");
      }

      const { error } = await supabase
        .from("group_members")
        .update({
          name: memberData.name,
          birthday: memberData.birthday,
          likes: memberData.likes,
          gift_wishes: memberData.gift_wishes,
          whatsapp_number: memberData.whatsapp_number
        })
        .eq("id", memberToUpdate.id);

      if (error) throw error;

      // Update localStorage for anonymous users
      if (isAnonymous) {
        const updatedAnonymousGroups = anonymousGroups.map(g => 
          g.groupId === selectedGroup.id 
            ? { ...g, whatsappNumber: memberData.whatsapp_number }
            : g
        );
        setAnonymousGroups(updatedAnonymousGroups);
        localStorage.setItem('anonymousGroups', JSON.stringify(updatedAnonymousGroups));
      }

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });

      setHasIncompleteProfile(false);

      setEditDialogOpen(false);
      await loadGroupMembers(selectedGroup.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      console.log("Attempting to delete group:", groupId);
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }
      
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
        title: "Group deleted successfully",
        description: "The group has been removed from your list.",
      });

      // Close the group details dialog if it's open
      if (selectedGroup?.id === groupId) {
        setGroupDetailsOpen(false);
        setSelectedGroup(null);
      }

      // Refresh from server to ensure consistency
      await loadAuthenticatedGroups();
    } catch (error: any) {
      console.error("Delete group error:", error);
      toast({
        title: "Error",
        description: "Failed to delete group: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getCurrentMember = () => {
    if (!selectedGroup) return null;
    
    if (isAnonymous) {
      const anonymousGroup = anonymousGroups.find(g => g.groupId === selectedGroup.id);
      if (anonymousGroup) {
        return members.find(m => m.whatsapp_number === anonymousGroup.whatsappNumber);
      }
    } else {
      return members.find(m => m.user_id === currentUser?.id);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-celebration/5 to-birthday/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-celebration mx-auto mb-4"></div>
          <p>Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-celebration/5 to-birthday/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Logout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-celebration mb-2">My Groups</h1>
            <p className="text-muted-foreground">
              {isAnonymous ? "Groups you've joined" : "Your birthday groups"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!isAnonymous && <UserMenu />}
            <div className="flex gap-2 sm:gap-3">
              {!isAnonymous && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs sm:text-sm"
                  onClick={() => navigate('/create')}
                >
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Create Group</span>
                  <span className="xs:hidden">Create</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion Warning - Top Level */}
        {!isAnonymous && (() => {
          // Check if user has incomplete profile in any group
          return hasIncompleteProfile ? (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900 mb-1">Complete Your Profile</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Your profile is incomplete in some groups. Add your birthday and WhatsApp number to receive birthday reminders!
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Navigate to profile page using React Router
                      navigate('/profile');
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Complete Profile
                  </Button>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Remove the old header */}
        {isAnonymous && (() => {
          // Check if user has created groups
          const createdGroups = anonymousGroups.filter(g => g.isCreator);
          
          if (createdGroups.length > 0) {
            return (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-orange-600 mt-0.5">🎉</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900 mb-1">You've Created Groups!</h4>
                    <p className="text-sm text-orange-700 mb-3">
                      Create an account to permanently manage your {createdGroups.length} group{createdGroups.length > 1 ? 's' : ''} and access all features.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        sessionStorage.setItem('redirect_to', '/groups');
                        sessionStorage.setItem('auth_context', 'claim');
                        navigate('/auth?context=claim');
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Create Account & Claim Groups
                    </Button>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Want to create groups? 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-700 underline ml-1"
                    onClick={() => navigate('/create')}
                  >
                    Create one here
                  </Button>
                </p>
              </div>
            );
          }
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Groups List - Full Width */}
          {isAnonymous ? (
            anonymousGroups.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No groups joined yet</p>
              </Card>
            ) : (
              anonymousGroups.map((anonymousGroup) => (
                <Card 
                  key={anonymousGroup.groupId}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGroupClick({ id: anonymousGroup.groupId, name: anonymousGroup.groupName })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{anonymousGroup.groupName}</h3>
                        <p className="text-sm text-muted-foreground">Click to view details</p>
                      </div>
                      {anonymousGroup.isCreator && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                          <Users className="w-3 h-3" />
                          Creator
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            groups.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No groups yet</p>
                <Button 
                  className="mt-2"
                  onClick={() => navigate('/create')}
                >
                  Create your first group
                </Button>
              </Card>
            ) : (
              groups.map((group) => (
                <Card 
                  key={group.id}
                  className="cursor-pointer hover:shadow-md transition-shadow hover:shadow-lg"
                  onClick={(e) => {
                    // Don't open group details if clicking on delete button
                    if ((e.target as HTMLElement).closest('button[data-delete-button]')) {
                      return;
                    }
                    handleGroupClick(group);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <ShareGroupButton 
                            groupName={group.name}
                            inviteCode={group.invite_code}
                            className="opacity-75 hover:opacity-100"
                          />
                        </div>
                      </div>
                      {/* Admin Delete Button */}
                      {currentUser && group.created_by === currentUser.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-delete-button="true"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                            >
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
              ))
            )
          )}
        </div>

        {/* Group Details Modal */}
        <Dialog open={groupDetailsOpen} onOpenChange={setGroupDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedGroup?.name}
              </DialogTitle>
              <DialogDescription>{selectedGroup?.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Invite Link Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Invite Others
                </h3>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Share this link to invite friends:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                      https://whats-up-birthdays-buddy.lovable.app/join?invite={selectedGroup?.invite_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const inviteUrl = `https://whats-up-birthdays-buddy.lovable.app/join?invite=${selectedGroup?.invite_code}`;
                        navigator.clipboard.writeText(inviteUrl);
                        toast({
                          title: "Copied! 📋",
                          description: "Invite link copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const inviteUrl = `https://whats-up-birthdays-buddy.lovable.app/join?invite=${selectedGroup?.invite_code}`;
                      const message = `🎉 Join my birthday group "${selectedGroup?.name}"!\n\nClick this link to join and never miss a birthday again:\n${inviteUrl}`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Share on WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const inviteUrl = `https://whats-up-birthdays-buddy.lovable.app/join?invite=${selectedGroup?.invite_code}`;
                      navigator.clipboard.writeText(inviteUrl);
                      toast({
                        title: "Copied! 📋",
                        description: "Invite link copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  
                  {/* Admin Delete Button in Modal */}
                  {!isAnonymous && currentUser && selectedGroup?.created_by === currentUser.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Group
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{selectedGroup?.name}"? This action cannot be undone. All members and data will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => selectedGroup && deleteGroup(selectedGroup.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Group
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Group Members */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Group Members ({members.length})
                </h3>
                <div className="grid gap-4">
                  {members.map((member) => {
                    const isCurrentUser = isAnonymous 
                      ? anonymousGroups.some(g => g.groupId === selectedGroup?.id && g.whatsappNumber === member.whatsapp_number)
                      : member.user_id === currentUser?.id;
                    
                    return (
                      <Card key={member.id} className={isCurrentUser ? "ring-2 ring-celebration/20" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{member.name}</h4>
                                {isCurrentUser && <Badge variant="secondary">You</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Birthday: {formatBirthdayDate(member.birthday)}
                                </div>
                                {member.likes && (
                                  <div className="flex items-start gap-2">
                                    <Gift className="w-4 h-4 mt-0.5" />
                                    <div>
                                      <p>Likes: {member.likes}</p>
                                      {member.gift_wishes && (
                                        <p className="mt-1">Wishes: {member.gift_wishes}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Your Profile</DialogTitle>
              <DialogDescription>
                Update your information for this group
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={updateMemberProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Your Name</Label>
                <Input
                  id="edit-name"
                  value={memberData.name}
                  onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-birthday">Your Birthday</Label>
                <Input
                  id="edit-birthday"
                  type="date"
                  value={memberData.birthday}
                  onChange={(e) => setMemberData({...memberData, birthday: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-likes">Things You Like</Label>
                <Textarea
                  id="edit-likes"
                  value={memberData.likes}
                  onChange={(e) => setMemberData({...memberData, likes: e.target.value})}
                  placeholder="Coffee, books, sports, music, etc."
                  className="h-20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gift-wishes">Gift Wishes</Label>
                <Textarea
                  id="edit-gift-wishes"
                  value={memberData.gift_wishes}
                  onChange={(e) => setMemberData({...memberData, gift_wishes: e.target.value})}
                  placeholder="Specific things you need or want as gifts..."
                  className="h-20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp">WhatsApp Number *</Label>
                <PhoneInput
                  id="edit-whatsapp"
                  value={memberData.whatsapp_number}
                  onChange={(value) => setMemberData({...memberData, whatsapp_number: value})}
                  placeholder="Phone number"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Update Profile</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyGroups;