import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import WhatsAppInfo from "@/components/WhatsAppInfo";
import CTA from "@/components/CTA";
import LanguageToggle from "@/components/LanguageToggle";

const Index = () => {
  return (
    <div className="min-h-screen">
      <LanguageToggle />
      <Hero />
      <Features />
      <HowItWorks />
      <WhatsAppInfo />
      <CTA />
    </div>
  );
};

export default Index;
