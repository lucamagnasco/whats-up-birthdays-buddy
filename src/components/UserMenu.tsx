import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  full_name: string;
  whatsapp_number: string;
  birthday: string;
  likes: string;
}

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ 
    full_name: "", 
    whatsapp_number: "", 
    birthday: "", 
    likes: "" 
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

      // Load latest group member data (for birthday and likes)
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("name, birthday, likes, whatsapp_number")
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
        likes: memberData?.likes || ""
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

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          whatsapp_number: profile.whatsapp_number
        });

      if (profileError) throw profileError;

      // Update all group_members records for this user
      const { error: memberError } = await supabase
        .from("group_members")
        .update({
          name: profile.full_name,
          birthday: profile.birthday,
          likes: profile.likes,
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

      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = '/auth';
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
              <Input
                id="likes"
                value={profile.likes}
                onChange={(e) => setProfile({ ...profile, likes: e.target.value })}
                placeholder="Coffee, books, sports, music, etc."
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Helps friends choose gifts for you
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