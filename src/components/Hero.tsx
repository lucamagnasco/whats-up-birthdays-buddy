import { Button } from "@/components/ui/button";
import { Gift, Users, Calendar, MessageCircle, ArrowRight, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/messi-celebration.jpg";

const Hero = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5 flex items-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-50"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary">Made for Celebrations</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[0.9] tracking-tight flex items-center gap-6">
                <div>
                  {t('hero.title')}
                  <span className="bg-gradient-to-r from-primary via-birthday to-gift bg-clip-text text-transparent block mt-2">
                    {t('hero.titleHighlight')}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <img 
                    src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop&crop=face" 
                    alt="Celebration moment"
                    className="w-24 h-24 rounded-full object-cover shadow-elevation border-4 border-white/50"
                  />
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
                onClick={() => window.location.href = '/auth'}
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

          {/* Right Image */}
          <div className="relative animate-scale-in">
            <div className="relative rounded-3xl overflow-hidden shadow-elevation bg-gradient-to-br from-white to-gray-50">
              <img 
                src={heroImage} 
                alt="Messi celebration with teammates"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-celebration to-birthday rounded-full flex items-center justify-center shadow-elevation animate-bounce">
              <Gift className="w-10 h-10 text-white" />
            </div>
            
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-gift to-primary rounded-full flex items-center justify-center shadow-elevation animate-pulse">
              <Calendar className="w-8 h-8 text-white" />
            </div>

            {/* Performance Metrics Style */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-card">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-foreground">Active Groups</span>
              </div>
              <div className="text-2xl font-black text-foreground mt-1">1,247</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;