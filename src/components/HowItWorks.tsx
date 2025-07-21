import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      step: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      details: ["Send invite links to friends", "Easy one-click joining", "Multiple groups supported"],
      color: "primary"
    },
    {
      step: "02", 
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      details: ["Share your birthday", "List your interests", "Update anytime"],
      color: "birthday"
    },
    {
      step: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      details: ["View upcoming birthdays", "See gift ideas", "Plan ahead"],
      color: "gift"
    },
    {
      step: "04",
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
      details: ["Automatic reminders", "Gift recommendations", "Never forget again"],
      color: "celebration"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-6 mb-20">
          <Badge variant="outline" className="px-6 py-2 text-base bg-primary/10 border-primary/20 text-primary">
            Simple Process
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('howItWorks.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="border-0 shadow-elevation hover:shadow-glow transition-all duration-500 bg-gradient-card hover:-translate-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black text-foreground mb-2">{step.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-muted-foreground text-xs">
                      <CheckCircle2 className={`w-4 h-4 text-${step.color} flex-shrink-0`} />
                      <span className="font-medium">{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-20">
          <Button 
            size="lg" 
            className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-birthday hover:shadow-glow transition-all duration-300 group"
            onClick={() => window.location.href = '/auth'}
          >
            <UserPlus className="mr-3 w-5 h-5" />
            {t('howItWorks.startGroup')}
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;