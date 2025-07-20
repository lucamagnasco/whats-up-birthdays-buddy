import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Calendar, Heart, MessageSquare, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Create or Join a Group",
      description: "Start a new birthday group or join one using an invite link. Perfect for families, friend circles, or work teams.",
      details: ["Send invite links to friends", "Easy one-click joining", "Multiple groups supported"],
      color: "primary"
    },
    {
      icon: Calendar,
      step: "02", 
      title: "Add Your Details",
      description: "Fill in your name, birthday, and things you like. This helps friends know what gifts you'd appreciate.",
      details: ["Share your birthday", "List your interests", "Update anytime"],
      color: "birthday"
    },
    {
      icon: Heart,
      step: "03",
      title: "See Friend's Likes",
      description: "Browse your group members' profiles to see their birthdays and gift preferences all in one place.",
      details: ["View upcoming birthdays", "See gift ideas", "Plan ahead"],
      color: "gift"
    },
    {
      icon: MessageSquare,
      step: "04",
      title: "Get WhatsApp Reminders",
      description: "Receive personalized WhatsApp messages before friends' birthdays with their likes and gift suggestions.",
      details: ["Automatic reminders", "Gift recommendations", "Never forget again"],
      color: "celebration"
    }
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and never miss a birthday celebration again
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-full bg-${step.color}/10 flex items-center justify-center`}>
                          <step.icon className={`w-8 h-8 text-${step.color}`} />
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1 font-bold">
                          Step {step.step}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-bold">{step.title}</CardTitle>
                      <CardDescription className="text-lg">{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                            <ArrowRight className="w-4 h-4 text-primary" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''} flex justify-center`}>
                  <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-${step.color}/20 to-${step.color}/5 flex items-center justify-center`}>
                    <div className={`w-32 h-32 rounded-full bg-${step.color}/10 flex items-center justify-center`}>
                      <step.icon className={`w-16 h-16 text-${step.color}`} />
                    </div>
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex justify-center my-8">
                  <ArrowRight className="w-8 h-8 text-muted-foreground transform rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button size="lg" variant="celebration" className="text-lg px-8 py-6">
            <UserPlus className="mr-2" />
            Start Your First Group
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;