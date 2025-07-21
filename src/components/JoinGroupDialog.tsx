import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinSuccess: (groupId: string, groupName: string) => void;
}

const JoinGroupDialog = ({ open, onOpenChange, onJoinSuccess }: JoinGroupDialogProps) => {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Please sign in to join a group");
      }

      // Find the group by invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("invite_code", inviteCode.trim())
        .is("deactivated_at", null) // Only active groups
        .single();

      if (groupError || !group) {
        throw new Error("Invalid invite code or group not found");
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
        onOpenChange(false);
        setInviteCode("");
        return;
      }

      // Success - pass group info to parent
      onJoinSuccess(group.id, group.name);
      onOpenChange(false);
      setInviteCode("");

      toast({
        title: "Group Found! 🎉",
        description: `Ready to join "${group.name}". Please fill in your details.`,
      });

    } catch (error: any) {
      console.error("Join group error:", error);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Join a Group
          </DialogTitle>
          <DialogDescription>
            Enter the invite code to join an existing birthday group
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter group invite code"
              required
            />
          </div>
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !inviteCode.trim()}
              className="flex-1"
            >
              {loading ? "Finding Group..." : "Join Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGroupDialog;