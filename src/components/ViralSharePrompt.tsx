import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Share2, MessageCircle, Users } from "lucide-react";
import ShareGroupButton from "./ShareGroupButton";

interface ViralSharePromptProps {
  groupName: string;
  inviteCode: string;
  memberCount: number;
}

const ViralSharePrompt = ({ groupName, inviteCode, memberCount }: ViralSharePromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after group creation or when member count is low
    const shouldPrompt = memberCount <= 3;
    
    if (shouldPrompt) {
      // Delay to let user appreciate the success first
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [memberCount]);

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Heart className="w-5 h-5 text-pink-500" />
            ¡Invita a tus amigos!
          </DialogTitle>
          <DialogDescription className="text-center">
            "{groupName}" es más divertido con más gente. ¿Querés invitar a algunos amigos?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Los grupos funcionan mejor con al menos 5 personas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Más amigos = más cumpleaños para recordar 🎂
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <ShareGroupButton 
              groupName={groupName}
              inviteCode={inviteCode}
              className="w-full"
            />
            
            <Button
              variant="outline"
              onClick={() => {
                const whatsappMessage = `¡Únete a mi grupo de cumpleaños "${groupName}"! 🎂\n\nNunca más nos olvidaremos de un cumpleaños. Recibí recordatorios automáticos por WhatsApp.\n\n👉 ${window.location.origin}/join?invite=${inviteCode}\n\n¡Es gratis y súper fácil!`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
                window.open(whatsappUrl, '_blank');
                setShowPrompt(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar por WhatsApp
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="text-muted-foreground"
            >
              Quizás más tarde
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViralSharePrompt;