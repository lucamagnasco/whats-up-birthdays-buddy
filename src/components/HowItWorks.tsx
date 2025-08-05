import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ArrowRight, CheckCircle2, Users, Heart, Eye, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      step: "01",
      title: "Crear o Unirse a Grupos",
      description: "Inicia un nuevo grupo de cumpleaños o únete usando un enlace de invitación. Perfecto para familias, círculos de amigos o equipos de trabajo.",
      icon: Users,
      color: "primary"
    },
    {
      step: "02", 
      title: "Agregar Gustos y Deseos",
      description: "Completá tu nombre, cumpleaños y cosas que te gustan. Esto ayuda a los amigos a saber qué regalos te gustarían.",
      icon: Heart,
      color: "birthday"
    },
    {
      step: "03",
      title: "Ver Info de Amigos en tu Grupo",
      description: "Navegá por los perfiles de los miembros de tu grupo para ver sus cumpleaños y preferencias de regalos en un solo lugar.",
      icon: Eye,
      color: "gift"
    },
    {
      step: "04",
      title: "Recibir Recordatorios via WhatsApp",
      description: "Recibe mensajes personalizados por WhatsApp antes de los cumpleaños de tus amigos con sus gustos y sugerencias de regalos.",
      icon: MessageCircle,
      color: "celebration"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-4 md:space-y-6 mb-12 md:mb-20">
          <Badge variant="outline" className="px-4 md:px-6 py-2 text-sm md:text-base bg-primary/10 border-primary/20 text-primary">
            {t('common.simpleProcess')}
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
            {t('howItWorks.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const colorClasses = {
              primary: "text-primary",
              birthday: "text-birthday", 
              gift: "text-gift",
              celebration: "text-celebration"
            };
            return (
              <Card key={index} className="border-0 shadow-elevation hover:shadow-glow transition-all duration-500 bg-gradient-card hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className={`w-6 h-6 md:w-8 md:h-8 ${colorClasses[step.color as keyof typeof colorClasses]}`} />
                  </div>
                  <CardTitle className="text-lg md:text-xl font-black text-foreground mb-2">{step.title}</CardTitle>
                  <CardDescription className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 md:mt-20 space-y-4 md:space-y-6">
          <Button 
            size="lg" 
            className="text-base md:text-lg px-6 md:px-10 py-4 md:py-6 bg-gradient-to-r from-primary to-birthday hover:shadow-glow transition-all duration-300 group"
            onClick={() => window.location.href = '/auth'}
          >
            <UserPlus className="mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5" />
            {t('howItWorks.startGroup')}
            <ArrowRight className="ml-2 md:ml-3 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {/* Gratis para usar message */}
          <div className="mt-6 md:mt-8">
            <p className="text-xs md:text-sm text-muted-foreground">
              Gratis para usar • Sin tarjeta de crédito requerida • Configurar en menos de 1 minuto
            </p>
          </div>
          
          {/* Kiwell growth hack footer */}
          <div className="mt-8 p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg">
            <div className="flex flex-col items-center space-y-3">
              <p className="text-xs text-green-700 text-center">
                Chequeá nuestro proyecto de wellness
              </p>
              <a 
                href="https://kiwell.ar/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lime-700 hover:text-lime-600 font-medium group transition-all duration-200 hover:scale-105"
              >
                {/* Kiwell Logo */}
                <img 
                  src="/logos/Logo_kiwell_2025_Lime (2).png" 
                  alt="Kiwell Logo" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if logo doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-5 h-5 bg-gradient-to-br from-lime-400 to-lime-600 rounded-lg flex items-center justify-center shadow-sm hidden">
                  <span className="text-white text-xs font-bold tracking-wide">KW</span>
                </div>
                <span className="text-sm font-semibold text-lime-700">kiwell.ar</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;