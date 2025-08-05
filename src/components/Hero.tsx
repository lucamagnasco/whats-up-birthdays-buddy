import { Button } from "@/components/ui/button";
import { Gift, Users, Calendar, ArrowRight, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const heroImageUrl = "/lovable-uploads/d59c27c8-a272-4cbe-b320-54b7ba196619.png";

const Hero = () => {
  const { t } = useLanguage();

  const handleCreateGroup = () => {
    // Redirect to auth with create context for better UX
    sessionStorage.setItem('redirect_to', '/create');
    sessionStorage.setItem('auth_context', 'create');
          window.location.href = '/auth?context=create';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 flex items-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-50"></div>
      
      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 md:space-y-8 animate-fade-in pt-8 md:pt-12">
            <div className="space-y-4 md:space-y-6">
              {/* Celebratory badge removed for cleaner layout */}
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[0.9] tracking-tight">
                <div>
                  <span className="block">Nunca más te olvides de un</span>
                  <span className="bg-gradient-to-r from-primary via-birthday to-gift bg-clip-text text-transparent block mt-2">
                    Cumpleaños!
                  </span>
                </div>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                <span className="underline decoration-orange-400 decoration-2">
                  Dejaste de usar facebook
                </span>
                {' '}y te olvidas de los cumpleaños??<br />
                Crea grupos con amigos y recibí recordatorios de whatsapp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 bg-gradient-to-r from-primary to-birthday hover:shadow-glow transition-all duration-300 group" 
                onClick={handleCreateGroup}
              >
                <Users className="mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5" />
                {t('hero.createGroup')}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300 group" 
                onClick={() => {
                  // Trigger join group popup
                  window.dispatchEvent(new CustomEvent('openJoinGroupDialog'));
                }}
              >
                <Play className="mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5" />
                {t('hero.joinGroup')}
              </Button>
            </div>

            {/* Free message - moved outside Kiwell box for visual separation */}
            <div className="mt-6">
              <p className="text-sm text-green-800 text-center font-medium">
                🎉 ¡Completamente gratis!
              </p>
            </div>

            {/* Kiwell reference - separated from free message */}
            <div className="mt-4 p-4 bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-lg">
              <div className="flex flex-col items-center space-y-3">
                <p className="text-sm text-green-700 text-center">
                  Soy Luca, como me olvidé el cumpleaños de mi mejor amigo, armé esta app gratuita. Me podés dar una mano chequeando mi otro proyecto de wellness:
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
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      // Fallback to placeholder if logo doesn't exist
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-6 h-6 bg-gradient-to-br from-lime-400 to-lime-600 rounded-lg flex items-center justify-center shadow-sm hidden">
                    <span className="text-white text-xs font-bold tracking-wide">KW</span>
                  </div>
                  <span className="text-lg font-semibold text-lime-700">kiwell.ar</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Mobile Image - Shows only on mobile, below buttons */}
            <div className="relative animate-scale-in lg:hidden mt-8">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-elevation bg-gradient-to-br from-white to-gray-50">
                <img 
                  src={heroImageUrl} 
                  alt="Messi celebration with teammates"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gift to-primary rounded-full flex items-center justify-center shadow-elevation animate-pulse">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Desktop Image - Shows only on desktop, on the right side */}
          <div className="relative animate-scale-in hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden shadow-elevation bg-gradient-to-br from-white to-gray-50">
              <img 
                src={heroImageUrl} 
                alt="Messi celebration with teammates"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
            
            {/* Floating gift icon removed for a calmer aesthetic */}
            
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-gift to-primary rounded-full flex items-center justify-center shadow-elevation animate-pulse">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;