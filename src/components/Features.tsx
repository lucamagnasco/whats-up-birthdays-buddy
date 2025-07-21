import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Gift, MessageCircle, Link, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Features = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Users,
      title: t('features.createJoin.title'),
      description: t('features.createJoin.description'),
      color: "primary",
      highlights: ["Easy invite links", "Group management", "Member roles"]
    },
    {
      icon: Calendar,
      title: t('features.tracking.title'),
      description: t('features.tracking.description'),
      color: "birthday",
      highlights: ["Upcoming birthdays", "Birthday calendar", "Age tracking"]
    },
    {
      icon: Gift,
      title: t('features.gifts.title'),
      description: t('features.gifts.description'),
      color: "gift",
      highlights: ["Personal interests", "Gift ideas", "Wishlist sharing"]
    },
    {
      icon: MessageCircle,
      title: t('features.whatsapp.title'),
      description: t('features.whatsapp.description'),
      color: "celebration",
      highlights: ["Auto reminders", "Gift suggestions", "Personal messages"]
    },
    {
      icon: Link,
      title: t('features.sharing.title'),
      description: t('features.sharing.description'),
      color: "accent",
      highlights: ["One-click joining", "Social sharing", "Quick setup"]
    },
    {
      icon: Smartphone,
      title: t('features.mobile.title'),
      description: t('features.mobile.description'),
      color: "secondary",
      highlights: ["Responsive design", "Mobile optimized", "Cross-platform"]
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-muted/10 to-background relative overflow-hidden">
      {/* Athletic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(hsl(var(--border))_1px,transparent_1px)] bg-[size:50px_50px] opacity-30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-6 mb-20">
          <Badge variant="outline" className="px-6 py-2 text-base bg-primary/10 border-primary/20 text-primary">
            Power Features
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
            {t('features.title')}
            <span className="bg-gradient-to-r from-primary via-birthday to-gift bg-clip-text text-transparent block mt-2">
              {t('features.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('features.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-elevation hover:shadow-glow transition-all duration-500 hover:-translate-y-3 bg-gradient-card group">
              <CardHeader className="text-center pb-4">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-${feature.color}/20 to-${feature.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-card`}>
                  <feature.icon className={`w-10 h-10 text-${feature.color}`} />
                </div>
                <CardTitle className="text-2xl font-black text-foreground mb-3">{feature.title}</CardTitle>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 justify-center">
                  {feature.highlights.map((highlight, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-medium px-3 py-1 bg-muted/50">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-foreground">1,247+</div>
            <div className="text-muted-foreground font-medium">Active Groups</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-foreground">15,892</div>
            <div className="text-muted-foreground font-medium">Members</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-foreground">98.2%</div>
            <div className="text-muted-foreground font-medium">Uptime</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-black text-foreground">4.9/5</div>
            <div className="text-muted-foreground font-medium">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;