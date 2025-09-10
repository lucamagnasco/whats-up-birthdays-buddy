import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, MessageCircle, Mail, Link, QrCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ShareGroupButtonProps {
  groupName: string;
  inviteCode: string;
  className?: string;
}

const ShareGroupButton = ({ groupName, inviteCode, className }: ShareGroupButtonProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/join?invite=${inviteCode}`;
  const whatsappMessage = `¡Únete a mi grupo de cumpleaños "${groupName}"! 🎂\n\nNunca más nos olvidaremos de un cumpleaños. Recibí recordatorios automáticos por WhatsApp.\n\n👉 ${shareUrl}\n\n¡Es gratis y súper fácil!`;
  const emailSubject = `Únete a "${groupName}" - Recordatorios de Cumpleaños`;
  const emailBody = `¡Hola!\n\nTe invito a unirte a mi grupo de cumpleaños "${groupName}". \n\nCon esta app nunca más nos olvidaremos de los cumpleaños importantes. Recibimos recordatorios automáticos por WhatsApp.\n\nHace clic acá para unirte: ${shareUrl}\n\n¡Es completamente gratis y muy fácil de usar!\n\nSaludos`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "¡Copiado!",
        description: `${type} copiado al portapapeles`,
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "¡Copiado!",
        description: `${type} copiado al portapapeles`,
      });
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(emailUrl, '_blank');
  };

  const shareViaNativeAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a "${groupName}"`,
          text: `Recordatorios de cumpleaños automáticos para nuestro grupo`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying link
      copyToClipboard(shareUrl, "Link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartir
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Invitar Amigos
          </DialogTitle>
          <DialogDescription>
            Comparte "{groupName}" con tus amigos para que nunca más se olviden de un cumpleaños
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shareViaWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>

          {/* Native Share (mobile) */}
          {navigator.share && (
            <Button
              onClick={shareViaNativeAPI}
              variant="outline"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir...
            </Button>
          )}

          <Separator />

          {/* Copy Link */}
          <div className="space-y-2">
            <Label>Link de invitación</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-sm"
              />
              <Button
                onClick={() => copyToClipboard(shareUrl, "Link")}
                size="sm"
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Copy Invite Code */}
          <div className="space-y-2">
            <Label>Código de invitación</Label>
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                readOnly
                className="text-sm font-mono"
              />
              <Button
                onClick={() => copyToClipboard(inviteCode, "Código")}
                size="sm"
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Copy WhatsApp Message */}
          <div className="space-y-2">
            <Label>Mensaje para WhatsApp</Label>
            <div className="relative">
              <textarea
                value={whatsappMessage}
                readOnly
                className="w-full h-24 p-2 text-xs border rounded-md resize-none bg-muted"
              />
              <Button
                onClick={() => copyToClipboard(whatsappMessage, "Mensaje")}
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareGroupButton;