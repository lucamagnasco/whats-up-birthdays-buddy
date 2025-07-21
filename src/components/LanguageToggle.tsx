import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border border-border hover:bg-accent"
    >
      <Globe className="w-4 h-4 mr-2" />
      {language === 'en' ? 'ES' : 'EN'}
    </Button>
  );
};

export default LanguageToggle;