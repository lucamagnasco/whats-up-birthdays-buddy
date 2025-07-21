import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Gift, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  whatsappNumber: string;
}

const MyGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousGroups, setAnonymousGroups] = useState<AnonymousGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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
          loadAnonymousGroups();
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
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          group_members(count)
        `)
        .is("deactivated_at", null);

      if (error) throw error;

      const groupsWithCounts = data?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      })) || [];

      setGroups(groupsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    }
  };

  const loadAnonymousGroups = () => {
    const storedGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
    setAnonymousGroups(storedGroups);
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
    if (isAnonymous) {
      // For anonymous users, load group details first
      try {
        const { data: groupData, error } = await supabase
          .from("groups")
          .select("*")
          .eq("id", group.id)
          .single();

        if (error) throw error;
        setSelectedGroup(groupData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Could not load group details",
          variant: "destructive",
        });
        return;
      }
    } else {
      setSelectedGroup(group as Group);
    }
    
    await loadGroupMembers(group.id);
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
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-celebration mb-2">My Groups</h1>
          <p className="text-muted-foreground">
            {isAnonymous ? "Groups you've joined" : "Your birthday groups"}
          </p>
          {isAnonymous && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Want to create groups? 
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-700 underline ml-1"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign up here
                </Button>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1 space-y-4">
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
                      <h3 className="font-semibold">{anonymousGroup.groupName}</h3>
                      <p className="text-sm text-muted-foreground">Tap to view members</p>
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
                    onClick={() => window.location.href = '/groups'}
                  >
                    Create your first group
                  </Button>
                </Card>
              ) : (
                groups.map((group) => (
                  <Card 
                    key={group.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleGroupClick(group)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{group.member_count} members</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )
            )}
          </div>

          {/* Group Details */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedGroup.name}
                    {getCurrentMember() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProfile(getCurrentMember()!)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit My Profile
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>{selectedGroup.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Group Members ({members.length})
                    </h3>
                    <div className="grid gap-4">
                      {members.map((member) => {
                        const isCurrentUser = isAnonymous 
                          ? anonymousGroups.some(g => g.groupId === selectedGroup.id && g.whatsappNumber === member.whatsapp_number)
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
                                      Birthday: {new Date(member.birthday).toLocaleDateString()}
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
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Group</h3>
                <p className="text-muted-foreground">Choose a group from the list to view its members</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
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
              <Input
                id="edit-whatsapp"
                value={memberData.whatsapp_number}
                onChange={(e) => setMemberData({...memberData, whatsapp_number: e.target.value})}
                placeholder="+541188889999"
                required
              />
            </div>
            <Button type="submit" className="w-full">Update Profile</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyGroups;