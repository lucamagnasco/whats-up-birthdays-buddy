import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, LogOut, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  full_name: string;
  whatsapp_number: string;
  birthday: string;
  likes: string;
  gift_wishes: string;
}

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ 
    full_name: "", 
    whatsapp_number: "", 
    birthday: "", 
    likes: "",
    gift_wishes: ""
  });
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error loading profile:", profileError);
      }

      // Load latest group member data (for birthday, likes, and gift wishes)
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("name, birthday, likes, gift_wishes, whatsapp_number")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })
        .limit(1)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error("Error loading member data:", memberError);
      }

      // Combine profile and member data
      setProfile({
        full_name: profileData?.full_name || memberData?.name || "",
        whatsapp_number: profileData?.whatsapp_number || memberData?.whatsapp_number || "",
        birthday: memberData?.birthday || "",
        likes: memberData?.likes || "",
        gift_wishes: memberData?.gift_wishes || ""
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profiles table - use upsert with onConflict to handle existing records
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          whatsapp_number: profile.whatsapp_number
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Update all group_members records for this user
      const { error: memberError } = await supabase
        .from("group_members")
        .update({
          name: profile.full_name,
          birthday: profile.birthday,
          likes: profile.likes,
          gift_wishes: profile.gift_wishes,
          whatsapp_number: profile.whatsapp_number
        })
        .eq("user_id", user.id);

      if (memberError) {
        console.warn("Error updating group member data:", memberError);
        // Don't throw error, just warn since profile was updated
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully in all groups.",
      });
      
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Clean up any auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Clean up session storage too
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = '/auth';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 sm:px-3">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline text-sm truncate max-w-32">{user?.email || "User"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 sm:w-56">
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Update your personal information. Changes will apply to all your groups.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted text-sm"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={profile.birthday}
                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Your birthday will be updated in all groups
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="likes">Things You Like</Label>
              <Textarea
                id="likes"
                value={profile.likes}
                onChange={(e) => setProfile({ ...profile, likes: e.target.value })}
                placeholder="Coffee, books, sports, music, etc."
                className="text-sm h-20"
              />
              <p className="text-xs text-muted-foreground">
                Helps friends choose gifts for you
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gift_wishes">Gift Wishes</Label>
              <div className="relative">
                <Textarea
                  id="gift_wishes"
                  value={profile.gift_wishes}
                  onChange={(e) => setProfile({ ...profile, gift_wishes: e.target.value })}
                  placeholder="Specific things you need or want as gifts..."
                  className="text-sm h-20"
                />
                <Gift className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground">
                Tell your friends what you specifically need or want
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <Input
                id="whatsapp_number"
                value={profile.whatsapp_number}
                onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                placeholder="+1234567890"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US, +54 for Argentina)
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" className="flex-1 text-sm">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="text-sm">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserMenu;