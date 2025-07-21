import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Users } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    likes: '',
    gift_wishes: '',
    whatsapp_number: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      // Use the first profile's data to populate the form
      // (since all profiles should have the same user data)
      if (userProfiles.length > 0) {
        const firstProfile = userProfiles[0];
        setFormData({
          name: firstProfile.name || '',
          birthday: firstProfile.birthday || '',
          likes: firstProfile.likes || '',
          gift_wishes: firstProfile.gift_wishes || '',
          whatsapp_number: firstProfile.whatsapp_number || ''
        });
      }
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

  const updateAllProfiles = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update all group memberships with the same data
      const { error } = await supabase
        .from("group_members")
        .update({
          name: formData.name,
          birthday: formData.birthday,
          likes: formData.likes,
          gift_wishes: formData.gift_wishes,
          whatsapp_number: formData.whatsapp_number
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: `Your profile has been updated across all ${profiles.length} group${profiles.length > 1 ? 's' : ''}!`,
      });

      await loadUserProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Your information will be shared across all your groups</p>
        </div>
      </div>

      {profiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Groups
            </CardTitle>
            <CardDescription>
              You're a member of {profiles.length} group{profiles.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profiles.map((profile) => (
                <Badge key={profile.id} variant="secondary">
                  {profile.group_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profiles.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              This information will be used across all your groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateAllProfiles} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleInputChange('birthday', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="likes">Things You Like</Label>
                <Textarea
                  id="likes"
                  value={formData.likes}
                  onChange={(e) => handleInputChange('likes', e.target.value)}
                  placeholder="Coffee, books, sports, music, etc."
                  className="h-20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gift-wishes">Gift Wishes</Label>
                <Textarea
                  id="gift-wishes"
                  value={formData.gift_wishes}
                  onChange={(e) => handleInputChange('gift_wishes', e.target.value)}
                  placeholder="Specific things you need or want as gifts..."
                  className="h-20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : `Update Profile Across All Groups`}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
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