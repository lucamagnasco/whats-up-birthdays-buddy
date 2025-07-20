import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Gift, ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 via-birthday/10 to-celebration/10">
      <div className="container mx-auto px-4">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-card to-muted/20 overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                  Ready to Make Every
                  <span className="text-primary block">Birthday Special?</span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join thousands of groups already using Birthday Buddy to celebrate 
                  their friends and family. Start your group today!
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
                <Button size="lg" variant="celebration" className="text-lg px-8 py-6 shadow-lg">
                  <Users className="mr-2" />
                  Create Your Group Now
                  <ArrowRight className="ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
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