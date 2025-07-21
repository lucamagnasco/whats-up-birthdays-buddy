import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key
});

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Hero
    'hero.title': 'Never Miss a',
    'hero.titleHighlight': 'Birthday Again!',
    'hero.description': 'Create groups with friends, share birthdays & gift ideas, and get personalized WhatsApp reminders. Making celebrations memorable, one group at a time.',
    'hero.createGroup': 'Create Your Group',
    'hero.joinGroup': 'Join a Group',
    'hero.groupManagement': 'Group Management',
    'hero.birthdayTracking': 'Birthday Tracking',
    'hero.giftSuggestions': 'Gift Suggestions',
    'hero.whatsappReminders': 'WhatsApp Reminders',
    
    // Features
    'features.title': 'Everything You Need for',
    'features.titleHighlight': 'Perfect Celebrations',
    'features.description': 'From group creation to WhatsApp reminders, we\'ve got every aspect of birthday planning covered.',
    'features.createJoin.title': 'Create & Join Groups',
    'features.createJoin.description': 'Start a birthday group or join with a simple invite link. Perfect for families, friends, or colleagues.',
    'features.tracking.title': 'Birthday Tracking',
    'features.tracking.description': 'Add your birthday and see upcoming celebrations. Never forget an important date again.',
    'features.gifts.title': 'Gift Recommendations',
    'features.gifts.description': 'Share your likes and interests to help friends find the perfect gift for you.',
    'features.whatsapp.title': 'WhatsApp Reminders',
    'features.whatsapp.description': 'Get personalized WhatsApp messages before friends\' birthdays with their gift preferences.',
    'features.sharing.title': 'Easy Sharing',
    'features.sharing.description': 'Share group links with friends and family. One click to join and start celebrating together.',
    'features.mobile.title': 'Mobile Friendly',
    'features.mobile.description': 'Works perfectly on any device. Access your groups and reminders anywhere, anytime.',
    
    // How It Works
    'howItWorks.title': 'How It Works',
    'howItWorks.description': 'Get started in minutes and never miss a birthday celebration again',
    'howItWorks.step1.title': 'Create or Join a Group',
    'howItWorks.step1.description': 'Start a new birthday group or join one using an invite link. Perfect for families, friend circles, or work teams.',
    'howItWorks.step2.title': 'Add Your Details',
    'howItWorks.step2.description': 'Fill in your name, birthday, and things you like. This helps friends know what gifts you\'d appreciate.',
    'howItWorks.step3.title': 'See Friend\'s Likes',
    'howItWorks.step3.description': 'Browse your group members\' profiles to see their birthdays and gift preferences all in one place.',
    'howItWorks.step4.title': 'Get WhatsApp Reminders',
    'howItWorks.step4.description': 'Receive personalized WhatsApp messages before friends\' birthdays with their likes and gift suggestions.',
    'howItWorks.startGroup': 'Start Your First Group',
    
    // CTA
    'cta.title': 'Ready to Never Miss Another Birthday?',
    'cta.description': 'Join thousands of users who are already celebrating smarter with our birthday reminder groups.',
    'cta.getStarted': 'Get Started Free',
    
    // WhatsApp Info
    'whatsapp.title': 'Powered by WhatsApp',
    'whatsapp.description': 'Get birthday reminders directly on WhatsApp with all the gift ideas and personal touches your friends love.',
  },
  es: {
    // Hero
    'hero.title': 'Nunca Olvides un',
    'hero.titleHighlight': 'Cumpleaños!',
    'hero.description': 'Crea grupos con amigos, comparte cumpleaños e ideas de regalos, y recibe recordatorios personalizados por WhatsApp. Haciendo las celebraciones memorables, un grupo a la vez.',
    'hero.createGroup': 'Crear Tu Grupo',
    'hero.joinGroup': 'Unirse a un Grupo',
    'hero.groupManagement': 'Gestión de Grupos',
    'hero.birthdayTracking': 'Seguimiento de Cumpleaños',
    'hero.giftSuggestions': 'Sugerencias de Regalos',
    'hero.whatsappReminders': 'Recordatorios WhatsApp',
    
    // Features
    'features.title': 'Todo lo que Necesitas para',
    'features.titleHighlight': 'Celebraciones Perfectas',
    'features.description': 'Desde la creación de grupos hasta recordatorios por WhatsApp, cubrimos todos los aspectos de la planificación de cumpleaños.',
    'features.createJoin.title': 'Crear y Unirse a Grupos',
    'features.createJoin.description': 'Inicia un grupo de cumpleaños o únete con un simple enlace de invitación. Perfecto para familias, amigos o colegas.',
    'features.tracking.title': 'Seguimiento de Cumpleaños',
    'features.tracking.description': 'Agrega tu cumpleaños y ve las próximas celebraciones. Nunca olvides una fecha importante.',
    'features.gifts.title': 'Recomendaciones de Regalos',
    'features.gifts.description': 'Comparte tus gustos e intereses para ayudar a los amigos a encontrar el regalo perfecto para ti.',
    'features.whatsapp.title': 'Recordatorios WhatsApp',
    'features.whatsapp.description': 'Recibe mensajes personalizados por WhatsApp antes de los cumpleaños de tus amigos con sus preferencias de regalos.',
    'features.sharing.title': 'Compartir Fácil',
    'features.sharing.description': 'Comparte enlaces de grupo con amigos y familia. Un clic para unirse y comenzar a celebrar juntos.',
    'features.mobile.title': 'Amigable con Móviles',
    'features.mobile.description': 'Funciona perfectamente en cualquier dispositivo. Accede a tus grupos y recordatorios en cualquier lugar, en cualquier momento.',
    
    // How It Works
    'howItWorks.title': 'Cómo Funciona',
    'howItWorks.description': 'Comienza en minutos y nunca te pierdas otra celebración de cumpleaños',
    'howItWorks.step1.title': 'Crear o Unirse a un Grupo',
    'howItWorks.step1.description': 'Inicia un nuevo grupo de cumpleaños o únete usando un enlace de invitación. Perfecto para familias, círculos de amigos o equipos de trabajo.',
    'howItWorks.step2.title': 'Agregar Tus Detalles',
    'howItWorks.step2.description': 'Completa tu nombre, cumpleaños y cosas que te gustan. Esto ayuda a los amigos a saber qué regalos te gustarían.',
    'howItWorks.step3.title': 'Ver los Gustos de Amigos',
    'howItWorks.step3.description': 'Navega por los perfiles de los miembros de tu grupo para ver sus cumpleaños y preferencias de regalos en un solo lugar.',
    'howItWorks.step4.title': 'Recibir Recordatorios WhatsApp',
    'howItWorks.step4.description': 'Recibe mensajes personalizados por WhatsApp antes de los cumpleaños de tus amigos con sus gustos y sugerencias de regalos.',
    'howItWorks.startGroup': 'Iniciar Tu Primer Grupo',
    
    // CTA
    'cta.title': '¿Listo para Nunca Perder Otro Cumpleaños?',
    'cta.description': 'Únete a miles de usuarios que ya están celebrando de manera más inteligente con nuestros grupos de recordatorios de cumpleaños.',
    'cta.getStarted': 'Comenzar Gratis',
    
    // WhatsApp Info
    'whatsapp.title': 'Impulsado por WhatsApp',
    'whatsapp.description': 'Recibe recordatorios de cumpleaños directamente en WhatsApp con todas las ideas de regalos y toques personales que tus amigos aman.',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  return context;
};