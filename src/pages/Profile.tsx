import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Save } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  birthday: string;
  likes: string;
  gift_wishes?: string;
  whatsapp_number: string;
  group_id: string;
  group_name: string;
}

const Profile = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfiles();
        } else {
          window.location.href = '/auth';
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfiles();
      } else {
        window.location.href = '/auth';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("group_members")
        .select(`
          *,
          groups(name)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const userProfiles = data?.map(member => ({
        ...member,
        group_name: member.groups?.name || "Unknown Group"
      })) || [];

      setProfiles(userProfiles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileId: string, updatedData: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .update(updatedData)
        .eq("id", profileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      loadUserProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Edit your information for each group</p>
        </div>
      </div>

      <div className="space-y-6">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardHeader>
              <CardTitle>{profile.group_name}</CardTitle>
              <CardDescription>Your profile in this group</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateProfile(profile.id, {
                    name: formData.get('name') as string,
                    birthday: formData.get('birthday') as string,
                    likes: formData.get('likes') as string,
                    gift_wishes: formData.get('gift_wishes') as string,
                    whatsapp_number: formData.get('whatsapp_number') as string,
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${profile.id}`}>Name</Label>
                    <Input
                      id={`name-${profile.id}`}
                      name="name"
                      defaultValue={profile.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`birthday-${profile.id}`}>Birthday</Label>
                    <Input
                      id={`birthday-${profile.id}`}
                      name="birthday"
                      type="date"
                      defaultValue={profile.birthday}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`likes-${profile.id}`}>Things You Like</Label>
                  <Textarea
                    id={`likes-${profile.id}`}
                    name="likes"
                    defaultValue={profile.likes}
                    placeholder="Coffee, books, sports, music, etc."
                    className="h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`gift-wishes-${profile.id}`}>Gift Wishes</Label>
                  <Textarea
                    id={`gift-wishes-${profile.id}`}
                    name="gift_wishes"
                    defaultValue={profile.gift_wishes || ""}
                    placeholder="Specific things you need or want as gifts..."
                    className="h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`whatsapp-${profile.id}`}>WhatsApp Number</Label>
                  <Input
                    id={`whatsapp-${profile.id}`}
                    name="whatsapp_number"
                    defaultValue={profile.whatsapp_number}
                    placeholder="+1234567890"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No profiles yet</h3>
          <p className="text-muted-foreground">Join a group to create your first profile</p>
        </div>
      )}
    </div>
  );
};

export default Profile;