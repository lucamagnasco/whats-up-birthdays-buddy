import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft } from "lucide-react";

const CreateGroup = () => {
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    invite_code: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGroupData({ ...groupData, invite_code: code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate invite code if not provided
      if (!groupData.invite_code) {
        generateInviteCode();
      }

      // Create the group (no user_id for anonymous creation)
      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name: groupData.name,
          description: groupData.description,
          invite_code: groupData.invite_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
          created_by: null // Anonymous group creation
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Group Created! 🎉",
        description: "Your group has been created successfully. Now create an account to manage it.",
      });

      // Store group info in localStorage
      localStorage.setItem('pendingGroupId', group.id);
      localStorage.setItem('pendingGroupName', group.name);

      // Redirect to auth with context
      navigate("/auth?flow=signup&context=group-created");

    } catch (error: any) {
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

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>After creating your group, you'll need to create an account</p>
              <p>to manage it and access your dashboard.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateGroup;