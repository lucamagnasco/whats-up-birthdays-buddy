import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/user";

const UserMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error loading user:", error);
        return;
      }
      setUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleProfileSettings = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      // Sign out using Supabase
      await signOut();

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Navigate to landing page using React Router
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect to landing page even if logout fails
      navigate('/');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 sm:px-3">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline text-sm truncate max-w-32">{user?.email || "User"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 sm:w-56">
        <DropdownMenuItem onClick={handleProfileSettings}>
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
  );
};

export default UserMenu;