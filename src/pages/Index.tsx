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
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();

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

      // Check if someone with the same WhatsApp number already exists in this group
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", selectedGroup.id)
        .eq("whatsapp_number", memberData.whatsapp_number)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "Someone with this WhatsApp number is already in this group",
        });
        return;
      }

      // For anonymous users, insert without user_id
      const { data: newMember, error } = await supabase
        .from("group_members")
        .insert({
          group_id: selectedGroup.id,
          user_id: null, // Anonymous user
          name: memberData.name,
          birthday: memberData.birthday,
          likes: memberData.likes,
          gift_wishes: memberData.gift_wishes,
          whatsapp_number: memberData.whatsapp_number
        })
        .select()
        .single();

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
        memberId: newMember.id,
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
        className="fixed top-4 right-28 z-40 bg-white border border-orange-200 text-gray-900 hover:bg-orange-500 hover:text-white hover:border-orange-500 font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
      >
        {t('index.signIn')}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('index.joinTitle')} {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              {t('index.joinDesc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addMemberToGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">{t('index.yourName')}</Label>
              <Input
                id="member-name"
                value={memberData.name}
                onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                placeholder={t('index.yourNamePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-birthday">{t('index.yourBirthday')}</Label>
              <Input
                id="member-birthday"
                type="date"
                value={memberData.birthday}
                onChange={(e) => setMemberData({...memberData, birthday: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-likes">{t('index.thingsYouLike')}</Label>
              <Textarea
                id="member-likes"
                value={memberData.likes}
                onChange={(e) => setMemberData({...memberData, likes: e.target.value})}
                placeholder={t('index.thingsYouLikePlaceholder')}
                className="h-20"
              />
              <p className="text-xs text-muted-foreground">
                {t('index.thingsYouLikeHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-gift-wishes">{t('index.giftWishes')}</Label>
              <Textarea
                id="member-gift-wishes"
                value={memberData.gift_wishes}
                onChange={(e) => setMemberData({...memberData, gift_wishes: e.target.value})}
                placeholder={t('index.giftWishesPlaceholder')}
                className="h-20"
              />
              <p className="text-xs text-muted-foreground">
                {t('index.giftWishesHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-whatsapp">{t('index.whatsappNumber')} *</Label>
              <Input
                id="member-whatsapp"
                value={memberData.whatsapp_number}
                onChange={(e) => setMemberData({...memberData, whatsapp_number: e.target.value})}
                placeholder={t('index.whatsappPlaceholder')}
                required
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>{t('index.whatsappHelp').split('!')[0]}!</strong></p>
                <p>{t('index.whatsappHelp').split('!')[1]}</p>
                <p>{t('index.whatsappExample')}</p>
              </div>
            </div>
            <Button type="submit" className="w-full">
              {t('index.joinGroup')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
