import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhatsAppInfo from "@/components/WhatsAppInfo";
import CTA from "@/components/CTA";
import LanguageToggle from "@/components/LanguageToggle";
import JoinGroupDialog from "@/components/JoinGroupDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string } | null>(null);
  const [memberData, setMemberData] = useState({
    name: "",
    birthday: "",
    likes: "",
    gift_wishes: "",
    whatsapp_number: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenJoinDialog = () => {
      setJoinDialogOpen(true);
    };

    window.addEventListener('openJoinGroupDialog', handleOpenJoinDialog);
    
    return () => {
      window.removeEventListener('openJoinGroupDialog', handleOpenJoinDialog);
    };
  }, []);

  const handleJoinSuccess = (groupId: string, groupName: string) => {
    setSelectedGroup({ id: groupId, name: groupName });
    setMemberDialogOpen(true);
  };

  const addMemberToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedGroup) throw new Error("No group selected");

      // For anonymous users, insert without user_id
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: selectedGroup.id,
          user_id: null, // Anonymous user
          name: memberData.name,
          birthday: memberData.birthday,
          likes: memberData.likes,
          gift_wishes: memberData.gift_wishes,
          whatsapp_number: memberData.whatsapp_number
        });

      if (error) throw error;

      // Send WhatsApp confirmation message
      try {
        const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            template: {
              phone_number: memberData.whatsapp_number,
              template_name: 'group_confirmation',
              language: 'es_AR',
              template_parameters: [memberData.name, selectedGroup.name]
            },
            templateId: '65838f7e-0da3-42fd-bfa7-4d05c1c3df2c'
          }
        });

        if (whatsappError) {
          console.error('WhatsApp message error:', whatsappError);
          toast({
            title: "Warning",
            description: "You joined the group successfully, but we couldn't send the WhatsApp confirmation. Please check if your number is correct.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success! 🎉",
            description: "Successfully joined the group! You should receive a WhatsApp confirmation message shortly.",
          });
        }
      } catch (whatsappError: any) {
        console.error('WhatsApp message error:', whatsappError);
        toast({
          title: "Success! 🎉",
          description: "Successfully joined the group! WhatsApp confirmation could not be sent.",
        });
      }

      setMemberDialogOpen(false);
      setMemberData({ name: "", birthday: "", likes: "", gift_wishes: "", whatsapp_number: "" });
      setSelectedGroup(null);
      
      // Store group membership info in localStorage for anonymous users
      const anonymousGroups = JSON.parse(localStorage.getItem('anonymousGroups') || '[]');
      anonymousGroups.push({
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        whatsappNumber: memberData.whatsapp_number
      });
      localStorage.setItem('anonymousGroups', JSON.stringify(anonymousGroups));
      
      // Redirect to groups page
      setTimeout(() => {
        window.location.href = '/groups';
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <LanguageToggle />
      
      {/* Sign-in button - white with orange hover, better spacing */}
      <Button 
        variant="outline"
        onClick={() => window.location.href = '/auth'}
        className="fixed top-4 right-20 z-40 bg-white border border-orange-200 text-gray-900 hover:bg-orange-500 hover:text-white hover:border-orange-500 font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
      >
        Sign In
      </Button>
      
      <Hero />
      <HowItWorks />
      <WhatsAppInfo />
      <CTA />

      <JoinGroupDialog 
        open={joinDialogOpen} 
        onOpenChange={setJoinDialogOpen}
        onJoinSuccess={handleJoinSuccess}
      />

      {/* Member Details Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-md">
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
              <Label htmlFor="member-gift-wishes">Gift Wishes</Label>
              <Textarea
                id="member-gift-wishes"
                value={memberData.gift_wishes}
                onChange={(e) => setMemberData({...memberData, gift_wishes: e.target.value})}
                placeholder="Specific things you need or want as gifts..."
                className="h-20"
              />
              <p className="text-xs text-muted-foreground">
                Tell your friends what you specifically need or want
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-whatsapp">WhatsApp Number *</Label>
              <Input
                id="member-whatsapp"
                value={memberData.whatsapp_number}
                onChange={(e) => setMemberData({...memberData, whatsapp_number: e.target.value})}
                placeholder="+541188889999"
                required
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Required for birthday reminders!</strong></p>
                <p>Include country and zone code for WhatsApp notifications: +5411AAAABBBB</p>
                <p>Example: +541188889999, +447123456789</p>
              </div>
            </div>
            <Button type="submit" className="w-full">Join Group</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
