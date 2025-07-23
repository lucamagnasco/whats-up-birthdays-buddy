import { Button } from "@/components/ui/button";
import { Gift, Users, Calendar, MessageCircle, ArrowRight, Play } from "lucide-react";
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
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              {/* Celebratory badge removed for cleaner layout */}
              
              <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[0.9] tracking-tight">
                <div>
                  {t('hero.title')}
                  <span className="bg-gradient-to-r from-primary via-birthday to-gift bg-clip-text text-transparent block mt-2">
                    {t('hero.titleHighlight')}
                  </span>
                </div>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                {t('hero.description')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-birthday hover:shadow-glow transition-all duration-300 group" 
                onClick={handleCreateGroup}
              >
                <Users className="mr-3 w-5 h-5" />
                {t('hero.createGroup')}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300 group" 
                onClick={() => {
                  // Trigger join group popup
                  window.dispatchEvent(new CustomEvent('openJoinGroupDialog'));
                }}
              >
                <Play className="mr-3 w-5 h-5" />
                {t('hero.joinGroup')}
              </Button>
            </div>

            {/* Mobile Image - Shows only on mobile, below buttons */}
            <div className="relative animate-scale-in lg:hidden">
              <div className="relative rounded-3xl overflow-hidden shadow-elevation bg-gradient-to-br from-white to-gray-50">
                <img 
                  src={heroImageUrl} 
                  alt="Messi celebration with teammates"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-gift to-primary rounded-full flex items-center justify-center shadow-elevation animate-pulse">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-lg transition-shadow">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{t('hero.groupManagement')}</h3>
              </div>
              
              <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-birthday/20 to-birthday/10 rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-lg transition-shadow">
                  <Calendar className="w-7 h-7 text-birthday" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{t('hero.birthdayTracking')}</h3>
              </div>
              
              <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-gift/20 to-gift/10 rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-lg transition-shadow">
                  <Gift className="w-7 h-7 text-gift" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{t('hero.giftSuggestions')}</h3>
              </div>
              
              <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-celebration/20 to-celebration/10 rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-lg transition-shadow">
                  <MessageCircle className="w-7 h-7 text-celebration" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{t('hero.whatsappReminders')}</h3>
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