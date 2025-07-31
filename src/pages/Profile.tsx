import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Users, ArrowLeft } from "lucide-react";

interface UserGroup {
  group_id: string;
  group_name: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserGroup[]>([]);
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
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfiles();
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Load user's profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw profileError;
      }

      // Load groups where user is a member
      const { data: groupData, error: groupError } = await supabase
        .from("group_members")
        .select(`
          group_id,
          groups!inner(name)
        `)
        .eq("user_id", user.id)
        .not("groups.deactivated_at", "is", null);

      if (groupError) throw groupError;

      // Remove duplicates based on group_id to ensure we only count unique groups
      const uniqueGroups = new Map();
      const userGroups = groupData?.map(member => ({
        group_id: member.group_id,
        group_name: member.groups?.name || "Unknown Group"
      })).filter(member => {
        if (uniqueGroups.has(member.group_id)) {
          return false; // Skip duplicate groups
        }
        uniqueGroups.set(member.group_id, true);
        return true;
      }) || [];

      setProfiles(userGroups);

      // Populate form with profile data
      if (profileData) {
        setFormData({
          name: profileData.full_name || '',
          birthday: profileData.birthday || '',
          likes: profileData.likes || '',
          gift_wishes: profileData.gift_wishes || '',
          whatsapp_number: profileData.whatsapp_number || ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your profile",
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

      // Update or create profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: formData.name,
          birthday: formData.birthday,
          likes: formData.likes,
          gift_wishes: formData.gift_wishes,
          whatsapp_number: formData.whatsapp_number
        });

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: profiles.length > 0 
          ? `Your profile has been updated and will be synced across all ${profiles.length} group${profiles.length > 1 ? 's' : ''}!`
          : "Your profile has been created! Join groups to start sharing your information.",
      });

      // Reload profile to keep local state in sync
      await loadUserProfiles();

      // Redirect back to groups dashboard
      navigate("/groups");
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
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/groups')}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Groups
      </Button>

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

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            {profiles.length > 0 
              ? "This information will be used across all your groups"
              : "Create your profile to get started. You can join groups later and this information will be automatically shared."
            }
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
              {saving ? 'Saving...' : (profiles.length > 0 ? 'Update Profile Across All Groups' : 'Create Profile')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;