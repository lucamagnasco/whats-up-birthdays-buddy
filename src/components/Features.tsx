import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Gift, MessageCircle, Link, Smartphone } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Create & Join Groups",
      description: "Start a birthday group or join with a simple invite link. Perfect for families, friends, or colleagues.",
      color: "primary",
      highlights: ["Easy invite links", "Group management", "Member roles"]
    },
    {
      icon: Calendar,
      title: "Birthday Tracking",
      description: "Add your birthday and see upcoming celebrations. Never forget an important date again.",
      color: "birthday",
      highlights: ["Upcoming birthdays", "Birthday calendar", "Age tracking"]
    },
    {
      icon: Gift,
      title: "Gift Recommendations",
      description: "Share your likes and interests to help friends find the perfect gift for you.",
      color: "gift",
      highlights: ["Personal interests", "Gift ideas", "Wishlist sharing"]
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Reminders",
      description: "Get personalized WhatsApp messages before friends' birthdays with their gift preferences.",
      color: "celebration",
      highlights: ["Auto reminders", "Gift suggestions", "Personal messages"]
    },
    {
      icon: Link,
      title: "Easy Sharing",
      description: "Share group links with friends and family. One click to join and start celebrating together.",
      color: "accent",
      highlights: ["One-click joining", "Social sharing", "Quick setup"]
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Works perfectly on any device. Access your groups and reminders anywhere, anytime.",
      color: "secondary",
      highlights: ["Responsive design", "Mobile optimized", "Cross-platform"]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Everything You Need for
            <span className="text-primary block">Perfect Celebrations</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From group creation to WhatsApp reminders, we've got every aspect of birthday planning covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${feature.color}/10 flex items-center justify-center`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 justify-center">
                  {feature.highlights.map((highlight, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;