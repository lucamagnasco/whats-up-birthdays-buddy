import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, Gift, Smartphone, Shield, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WhatsAppInfo = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-gradient-to-br from-celebration/5 to-birthday/5 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center items-center gap-4 mb-4">
            <MessageCircle className="w-12 h-12 text-celebration" />
            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
              {t('whatsapp.title')}
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('whatsapp.description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">{t('whatsapp.howItWorksTitle')}</h3>
              <p className="text-lg text-muted-foreground">
                {t('whatsapp.howItWorksDesc')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border">
                <Clock className="w-6 h-6 text-birthday mt-1" />
                <div>
                  <h4 className="font-semibold">{t('whatsapp.timelyTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('whatsapp.timelyDesc')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border">
                <Gift className="w-6 h-6 text-gift mt-1" />
                <div>
                  <h4 className="font-semibold">{t('whatsapp.giftSuggestionsTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('whatsapp.giftSuggestionsDesc')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">{t('whatsapp.privacyTitle')}</h4>
                  <p className="text-sm text-muted-foreground">{t('whatsapp.privacyDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-gradient-to-br from-card to-muted/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-celebration/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-celebration" />
              </div>
              <CardTitle className="text-xl">{t('whatsapp.sampleTitle')}</CardTitle>
              <CardDescription>{t('whatsapp.sampleDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-celebration/10 p-4 rounded-lg border-l-4 border-celebration">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-celebration" />
                  <span className="text-sm font-medium text-celebration">Birthday Buddy</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">🎉 Birthday Alert!</p>
                  <p><strong>Sarah's birthday</strong> is tomorrow (March 15th)!</p>
                  <p><strong>She loves:</strong> Coffee, books, yoga, plants, cooking</p>
                  <p><strong>Gift ideas:</strong> A nice coffee blend, bestselling novel, or a small succulent plant</p>
                  <p className="text-xs text-muted-foreground mt-2">Don't forget to wish her happy birthday! 🎂</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {t('whatsapp.instantDeliveryBadge')}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Gift className="w-3 h-3 mr-1" />
                  {t('whatsapp.giftIdeasBadge')}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {t('whatsapp.perfectTimingBadge')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card/50 rounded-2xl p-8 border">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-foreground">{t('whatsapp.setupTitle')}</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('whatsapp.setupDesc')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-6">
              <Badge variant="outline" className="px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                {t('whatsapp.securePrivate')}
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('whatsapp.officialAPI')}
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                {t('whatsapp.instantDelivery')}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppInfo;