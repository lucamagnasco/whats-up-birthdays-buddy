import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowLeft } from "lucide-react";

const JoinWithoutCode = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      navigate(`/join?invite=${inviteCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-celebration/5 to-birthday/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Unirse a un Grupo</CardTitle>
            <CardDescription>
              Ingresa el código de invitación que te compartió tu amigo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Código de Invitación</Label>
                <Input
                  id="invite-code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="ej: abc123"
                  required
                  className="text-center font-mono text-lg"
                />
                <p className="text-xs text-muted-foreground text-center">
                  El código aparece cuando tus amigos comparten el grupo
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={!inviteCode.trim()}>
                Buscar Grupo
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-3">
                ¿No tenés código? Pedíselo a quien te invitó o...
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/create')}
                className="w-full"
              >
                Crear Tu Propio Grupo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinWithoutCode;