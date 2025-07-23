import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, LogOut } from "lucide-react";
import { getCurrentUser, clearCurrentUser, UserData } from "@/lib/user";

const UserMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    try {
      const userData = getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleProfileSettings = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    try {
      // Clear user data from localStorage
      clearCurrentUser();
      
      // Clean up any remaining auth-related data
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.includes('userData') || key.includes('anonymousGroups')) {
          localStorage.removeItem(key);
        }
      });

      // Clean up session storage too
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-') || key.includes('redirect_to') || key.includes('auth_context')) {
          sessionStorage.removeItem(key);
        }
      });

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