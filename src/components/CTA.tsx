import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Gift, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CTA = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 via-birthday/10 to-celebration/10">
      <div className="container mx-auto px-4">
        <Card className="border-0 shadow-elevation bg-gradient-card overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
                  {t('cta.title')}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t('cta.description')}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 py-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">Create Your Group</h3>
                  <p className="text-sm text-muted-foreground">Start fresh with family or friends</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-birthday/10 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-birthday" />
                  </div>
                  <h3 className="font-semibold">Add Birthdays</h3>
                  <p className="text-sm text-muted-foreground">Everyone shares their special day</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-gift/10 rounded-full flex items-center justify-center mx-auto">
                    <Gift className="w-8 h-8 text-gift" />
                  </div>
                  <h3 className="font-semibold">Get Reminders</h3>
                  <p className="text-sm text-muted-foreground">Never miss a celebration again</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-birthday hover:shadow-glow transition-all duration-300 group" onClick={() => window.location.href = '/auth'}>
                  <Users className="mr-2" />
                  {t('cta.getStarted')}
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => window.location.href = '/auth'}>
                  <Calendar className="mr-2" />
                  Join Existing Group
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Free to use • No credit card required • Set up in under 2 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTA;