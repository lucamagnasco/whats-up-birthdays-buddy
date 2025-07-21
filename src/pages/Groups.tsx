import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Copy, Calendar, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Group {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_at: string;
  member_count?: number;
}

interface GroupMember {
  id: string;
  name: string;
  birthday: string;
  likes: string;
  whatsapp_number: string;
}

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [memberData, setMemberData] = useState({
    name: "",
    birthday: "",
    likes: "",
    whatsapp_number: ""
  });

  useEffect(() => {
    // Set up auth state listener to ensure proper session context
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Only load groups when we have a valid session
          await loadGroups();
        } else {
          // Redirect to auth if no session
          window.location.href = '/auth';
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadGroups();
      } else {
        window.location.href = '/auth';
      }
    });

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

    setLoading(true);

    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error("Authentication required. Please sign in again.");
      }

      // Insert group (created_by is now handled automatically by the database)
      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: newGroupName,
          description: newGroupDescription,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      console.log("Group created successfully:", data);

      toast({
        title: "Success",
        description: "Group created successfully!",
      });

      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      loadGroups();
    } catch (error: any) {
      console.error("Create group error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!selectedGroup) throw new Error("No group selected");

      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: selectedGroup.id,
          user_id: user.id,
          name: memberData.name,
          birthday: memberData.birthday,
          likes: memberData.likes,
          whatsapp_number: memberData.whatsapp_number
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully joined the group!",
      });

      setMemberDialogOpen(false);
      setMemberData({ name: "", birthday: "", likes: "", whatsapp_number: "" });
      setSelectedGroup(null);
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Groups</h1>
          <p className="text-muted-foreground">Manage your birthday reminder groups</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent>
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {group.name}
                <Badge variant="secondary">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              {group.description && (
                <CardDescription>{group.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Invite Code</p>
                  <p className="text-xs text-muted-foreground font-mono">{group.invite_code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyInviteCode(group.invite_code)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedGroup(group);
                    loadGroupMembers(group.id);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Members
                </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Please fill in your details to join the group
            </DialogDescription>
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
              <Label htmlFor="member-whatsapp">WhatsApp Number (Optional)</Label>
              <Input
                id="member-whatsapp"
                value={memberData.whatsapp_number}
                onChange={(e) => setMemberData({...memberData, whatsapp_number: e.target.value})}
                placeholder="+1234567890"
              />
              <p className="text-xs text-muted-foreground">
                For receiving birthday reminders
              </p>
            </div>
            <Button type="submit" className="w-full">Join Group</Button>
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