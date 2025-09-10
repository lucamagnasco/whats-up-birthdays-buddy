import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Gift, Calendar } from "lucide-react";

const QuickActions = () => {
  return (
    <div className="mt-8 mb-12">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">
          ¿Cómo funciona?
        </h3>
        <p className="text-muted-foreground">
          En 3 simples pasos nunca más te olvidas de un cumpleaños
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">1. Crear Grupo</h4>
            <p className="text-sm text-muted-foreground">
              Creá tu grupo de cumpleaños con un nombre divertido
            </p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-birthday/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-birthday" />
            </div>
            <h4 className="font-semibold mb-2">2. Invitar Amigos</h4>
            <p className="text-sm text-muted-foreground">
              Compartí el código e invitá a tus amigos a unirse
            </p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-gift/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-gift" />
            </div>
            <h4 className="font-semibold mb-2">3. Recibir Recordatorios</h4>
            <p className="text-sm text-muted-foreground">
              Te llegará un WhatsApp automático cuando sea el cumple de alguien
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickActions;