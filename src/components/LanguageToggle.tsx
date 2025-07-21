import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  variant?: 'fixed' | 'inline';
  className?: string;
}

const LanguageToggle = ({ variant = 'fixed', className = '' }: LanguageToggleProps) => {
  const { language, setLanguage } = useLanguage();

  const baseClasses = "z-50 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20";
  const variantClasses = variant === 'fixed' 
    ? "fixed top-4 right-4" 
    : "";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      <Globe className="w-4 h-4 mr-2" />
      {language === 'en' ? 'ES' : 'EN'}
    </Button>
  );
};

export default LanguageToggle;