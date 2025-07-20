import { Button } from "@/components/ui/button";
import { Gift, Users, Calendar, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-birthday.jpg";

const Hero = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Never Miss a
                <span className="text-primary block">Birthday Again!</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Create groups with friends, share birthdays & gift ideas, and get 
                personalized WhatsApp reminders. Making celebrations memorable, one group at a time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="celebration" className="text-lg px-8 py-6" onClick={() => window.location.href = '/auth'}>
                <Users className="mr-2" />
                Create Your Group
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => window.location.href = '/auth'}>
                <Calendar className="mr-2" />
                Join a Group
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Group Management</h3>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-birthday/10 rounded-lg flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6 text-birthday" />
                </div>
                <h3 className="font-semibold text-sm">Birthday Tracking</h3>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gift/10 rounded-lg flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6 text-gift" />
                </div>
                <h3 className="font-semibold text-sm">Gift Suggestions</h3>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-celebration/10 rounded-lg flex items-center justify-center mx-auto">
                  <MessageCircle className="w-6 h-6 text-celebration" />
                </div>
                <h3 className="font-semibold text-sm">WhatsApp Reminders</h3>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Birthday celebration with friends"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-celebration rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Gift className="w-12 h-12 text-celebration-foreground" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-birthday rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Calendar className="w-8 h-8 text-birthday-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;