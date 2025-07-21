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
    'features.createJoin.highlights': 'Easy invite links,Group management,Member roles',
    'features.tracking.title': 'Birthday Tracking',
    'features.tracking.description': 'Add your birthday and see upcoming celebrations. Never forget an important date again.',
    'features.tracking.highlights': 'Upcoming birthdays,Birthday calendar,Age tracking',
    'features.gifts.title': 'Gift Recommendations',
    'features.gifts.description': 'Share your likes and interests to help friends find the perfect gift for you.',
    'features.gifts.highlights': 'Personal interests,Gift ideas,Wishlist sharing',
    'features.whatsapp.title': 'WhatsApp Reminders',
    'features.whatsapp.description': 'Get personalized WhatsApp messages before friends\' birthdays with their gift preferences.',
    'features.whatsapp.highlights': 'Auto reminders,Gift suggestions,Personal messages',
    'features.sharing.title': 'Easy Sharing',
    'features.sharing.description': 'Share group links with friends and family. One click to join and start celebrating together.',
    'features.sharing.highlights': 'One-click joining,Social sharing,Quick setup',
    'features.mobile.title': 'Mobile Friendly',
    'features.mobile.description': 'Works perfectly on any device. Access your groups and reminders anywhere, anytime.',
    'features.mobile.highlights': 'Responsive design,Mobile optimized,Cross-platform',
    
    // How It Works
    'howItWorks.title': 'How It Works',
    'howItWorks.description': 'Get started in minutes and never miss a birthday celebration again',
    'howItWorks.step1.title': 'Create or Join a Group',
    'howItWorks.step1.description': 'Start a new birthday group or join one using an invite link. Perfect for families, friend circles, or work teams.',
    'howItWorks.step1.details': 'Send invite links to friends,Easy one-click joining,Multiple groups supported',
    'howItWorks.step2.title': 'Add Your Details',
    'howItWorks.step2.description': 'Fill in your name, birthday, and things you like. This helps friends know what gifts you\'d appreciate.',
    'howItWorks.step2.details': 'Share your birthday,List your interests,Update anytime',
    'howItWorks.step3.title': 'See Friend\'s Likes',
    'howItWorks.step3.description': 'Browse your group members\' profiles to see their birthdays and gift preferences all in one place.',
    'howItWorks.step3.details': 'View upcoming birthdays,See gift ideas,Plan ahead',
    'howItWorks.step4.title': 'Get WhatsApp Reminders',
    'howItWorks.step4.description': 'Receive personalized WhatsApp messages before friends\' birthdays with their likes and gift suggestions.',
    'howItWorks.step4.details': 'Automatic reminders,Gift recommendations,Never forget again',
    'howItWorks.startGroup': 'Start Your First Group',
    
    // CTA
    'cta.title': 'Ready to Never Miss Another Birthday?',
    'cta.description': 'Join thousands of users who are already celebrating smarter with our birthday reminder groups.',
    'cta.getStarted': 'Get Started Free',
    'cta.createGroupTitle': 'Create Your Group',
    'cta.createGroupDesc': 'Start fresh with family or friends',
    'cta.addBirthdaysTitle': 'Add Birthdays',
    'cta.addBirthdaysDesc': 'Everyone shares their special day',
    'cta.getRemindersTitle': 'Get Reminders',
    'cta.getRemindersDesc': 'Never miss a celebration again',
    'cta.joinExistingGroup': 'Join Existing Group',
    'cta.footer': 'Free to use • No credit card required • Set up in under 2 minutes',
    
    // WhatsApp Info
    'whatsapp.title': 'Powered by WhatsApp',
    'whatsapp.description': 'Get birthday reminders directly on WhatsApp with all the gift ideas and personal touches your friends love.',
    'whatsapp.howItWorksTitle': 'How WhatsApp Reminders Work',
    'whatsapp.howItWorksDesc': 'Our system sends you personalized messages before your friends\' birthdays, including their gift preferences and ideas to make shopping easier.',
    'whatsapp.timelyTitle': 'Timely Reminders',
    'whatsapp.timelyDesc': 'Get notified 3 days and 1 day before birthdays',
    'whatsapp.giftSuggestionsTitle': 'Gift Suggestions',
    'whatsapp.giftSuggestionsDesc': 'Includes friend\'s likes and interests for easy gift shopping',
    'whatsapp.privacyTitle': 'Privacy Focused',
    'whatsapp.privacyDesc': 'Only you receive reminders about your friends',
    'whatsapp.sampleTitle': 'Sample WhatsApp Message',
    'whatsapp.sampleDesc': 'Here\'s what you\'ll receive',
    'whatsapp.setupTitle': 'Setting Up WhatsApp Reminders',
    'whatsapp.setupDesc': 'To receive WhatsApp reminders, you\'ll need to provide your WhatsApp number when joining a group. We use WhatsApp\'s Business API to send messages securely and reliably.',
    'whatsapp.securePrivate': 'Secure & Private',
    'whatsapp.officialAPI': 'Official WhatsApp API',
    'whatsapp.instantDelivery': 'Instant Delivery',
    'whatsapp.instantDeliveryBadge': 'Instant delivery',
    'whatsapp.giftIdeasBadge': 'Gift ideas included',
    'whatsapp.perfectTimingBadge': 'Perfect timing',
    
    // Index page dialog
    'index.joinTitle': 'Join',
    'index.joinDesc': 'Please fill in your details to join the group',
    'index.yourName': 'Your Name',
    'index.yourNamePlaceholder': 'Enter your full name',
    'index.yourBirthday': 'Your Birthday',
    'index.thingsYouLike': 'Things You Like',
    'index.thingsYouLikePlaceholder': 'Coffee, books, sports, music, etc.',
    'index.thingsYouLikeHelp': 'This helps others choose gifts for you',
    'index.giftWishes': 'Gift Wishes',
    'index.giftWishesPlaceholder': 'Specific things you need or want as gifts...',
    'index.giftWishesHelp': 'Tell your friends what you specifically need or want',
    'index.whatsappNumber': 'WhatsApp Number',
    'index.whatsappPlaceholder': '+541188889999',
    'index.whatsappHelp': 'Required for birthday reminders! Include country and zone code for WhatsApp notifications: +5411AAAABBBB',
    'index.whatsappExample': 'Example: +541188889999, +447123456789',
    'index.joinGroup': 'Join Group',
    'index.signIn': 'Sign In',
    
    // Common
    'common.powerFeatures': 'Power Features',
    'common.simpleProcess': 'Simple Process',
  },
  es: {
    // Hero
    'hero.title': 'Nunca mas te olvides de un',
    'hero.titleHighlight': 'Cumpleaños!',
    'hero.description': 'Dejaste de usar facebook y te olvidas de los cumpleaños?? Crea grupos con amigos y recibí recordatorios de whatsapp con gustos y lista de deseos personalizados.',
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
    'features.createJoin.highlights': 'Enlaces de invitación fáciles,Gestión de grupos,Roles de miembros',
    'features.tracking.title': 'Seguimiento de Cumpleaños',
    'features.tracking.description': 'Agrega tu cumpleaños y ve las próximas celebraciones. Nunca olvides una fecha importante.',
    'features.tracking.highlights': 'Próximos cumpleaños,Calendario de cumpleaños,Seguimiento de edad',
    'features.gifts.title': 'Recomendaciones de Regalos',
    'features.gifts.description': 'Comparte tus gustos e intereses para ayudar a los amigos a encontrar el regalo perfecto para ti.',
    'features.gifts.highlights': 'Intereses personales,Ideas de regalos,Compartir lista de deseos',
    'features.whatsapp.title': 'Recordatorios WhatsApp',
    'features.whatsapp.description': 'Recibe mensajes personalizados por WhatsApp antes de los cumpleaños de tus amigos con sus preferencias de regalos.',
    'features.whatsapp.highlights': 'Recordatorios automáticos,Sugerencias de regalos,Mensajes personales',
    'features.sharing.title': 'Compartir Fácil',
    'features.sharing.description': 'Comparte enlaces de grupo con amigos y familia. Un clic para unirse y comenzar a celebrar juntos.',
    'features.sharing.highlights': 'Unirse con un clic,Compartir en redes sociales,Configuración rápida',
    'features.mobile.title': 'Amigable con Móviles',
    'features.mobile.description': 'Funciona perfectamente en cualquier dispositivo. Accede a tus grupos y recordatorios en cualquier lugar, en cualquier momento.',
    'features.mobile.highlights': 'Diseño responsivo,Optimizado para móviles,Multiplataforma',
    
    // How It Works
    'howItWorks.title': 'Cómo Funciona',
    'howItWorks.description': 'Comienza en minutos y nunca te pierdas otra celebración de cumpleaños',
    'howItWorks.step1.title': 'Crear o Unirse a un Grupo',
    'howItWorks.step1.description': 'Inicia un nuevo grupo de cumpleaños o únete usando un enlace de invitación. Perfecto para familias, círculos de amigos o equipos de trabajo.',
    'howItWorks.step1.details': 'Enviar enlaces de invitación a amigos,Unirse fácil con un clic,Múltiples grupos soportados',
    'howItWorks.step2.title': 'Agregar Tus Detalles',
    'howItWorks.step2.description': 'Completa tu nombre, cumpleaños y cosas que te gustan. Esto ayuda a los amigos a saber qué regalos te gustarían.',
    'howItWorks.step2.details': 'Comparte tu cumpleaños,Lista tus intereses,Actualiza en cualquier momento',
    'howItWorks.step3.title': 'Ver los Gustos de Amigos',
    'howItWorks.step3.description': 'Navega por los perfiles de los miembros de tu grupo para ver sus cumpleaños y preferencias de regalos en un solo lugar.',
    'howItWorks.step3.details': 'Ver próximos cumpleaños,Ver ideas de regalos,Planificar con anticipación',
    'howItWorks.step4.title': 'Recibir Recordatorios WhatsApp',
    'howItWorks.step4.description': 'Recibe mensajes personalizados por WhatsApp antes de los cumpleaños de tus amigos con sus gustos y sugerencias de regalos.',
    'howItWorks.step4.details': 'Recordatorios automáticos,Recomendaciones de regalos,Nunca olvides de nuevo',
    'howItWorks.startGroup': 'Iniciar Tu Primer Grupo',
    
    // CTA
    'cta.title': '¿Listo para Nunca Perder Otro Cumpleaños?',
    'cta.description': 'Únete a miles de usuarios que ya están celebrando de manera más inteligente con nuestros grupos de recordatorios de cumpleaños.',
    'cta.getStarted': 'Comenzar Gratis',
    'cta.createGroupTitle': 'Crear Tu Grupo',
    'cta.createGroupDesc': 'Comenzar desde cero con familia o amigos',
    'cta.addBirthdaysTitle': 'Agregar Cumpleaños',
    'cta.addBirthdaysDesc': 'Todos comparten su día especial',
    'cta.getRemindersTitle': 'Recibir Recordatorios',
    'cta.getRemindersDesc': 'Nunca te pierdas una celebración de nuevo',
    'cta.joinExistingGroup': 'Unirse a Grupo Existente',
    'cta.footer': 'Gratis para usar • Sin tarjeta de crédito requerida • Configurar en menos de 2 minutos',
    
    // WhatsApp Info
    'whatsapp.title': 'Impulsado por WhatsApp',
    'whatsapp.description': 'Recibe recordatorios de cumpleaños directamente en WhatsApp con todas las ideas de regalos y toques personales que tus amigos aman.',
    'whatsapp.howItWorksTitle': 'Cómo Funcionan los Recordatorios de WhatsApp',
    'whatsapp.howItWorksDesc': 'Nuestro sistema te envía mensajes personalizados antes de los cumpleaños de tus amigos, incluyendo sus preferencias de regalos e ideas para hacer las compras más fáciles.',
    'whatsapp.timelyTitle': 'Recordatorios Oportunos',
    'whatsapp.timelyDesc': 'Recibe notificaciones 3 días y 1 día antes de los cumpleaños',
    'whatsapp.giftSuggestionsTitle': 'Sugerencias de Regalos',
    'whatsapp.giftSuggestionsDesc': 'Incluye los gustos e intereses del amigo para facilitar las compras de regalos',
    'whatsapp.privacyTitle': 'Enfocado en la Privacidad',
    'whatsapp.privacyDesc': 'Solo tú recibes recordatorios sobre tus amigos',
    'whatsapp.sampleTitle': 'Mensaje de WhatsApp de Muestra',
    'whatsapp.sampleDesc': 'Esto es lo que recibirás',
    'whatsapp.setupTitle': 'Configurar Recordatorios de WhatsApp',
    'whatsapp.setupDesc': 'Para recibir recordatorios de WhatsApp, necesitarás proporcionar tu número de WhatsApp al unirte a un grupo. Usamos la API de WhatsApp Business para enviar mensajes de forma segura y confiable.',
    'whatsapp.securePrivate': 'Seguro y Privado',
    'whatsapp.officialAPI': 'API Oficial de WhatsApp',
    'whatsapp.instantDelivery': 'Entrega Instantánea',
    'whatsapp.instantDeliveryBadge': 'Entrega instantánea',
    'whatsapp.giftIdeasBadge': 'Ideas de regalos incluidas',
    'whatsapp.perfectTimingBadge': 'Momento perfecto',
    
    // Index page dialog
    'index.joinTitle': 'Unirse a',
    'index.joinDesc': 'Por favor completa tus datos para unirte al grupo',
    'index.yourName': 'Tu Nombre',
    'index.yourNamePlaceholder': 'Ingresa tu nombre completo',
    'index.yourBirthday': 'Tu Cumpleaños',
    'index.thingsYouLike': 'Cosas que te Gustan',
    'index.thingsYouLikePlaceholder': 'Café, libros, deportes, música, etc.',
    'index.thingsYouLikeHelp': 'Esto ayuda a otros a elegir regalos para ti',
    'index.giftWishes': 'Lista de Deseos',
    'index.giftWishesPlaceholder': 'Cosas específicas que necesitas o quieres como regalos...',
    'index.giftWishesHelp': 'Dile a tus amigos qué necesitas o quieres específicamente',
    'index.whatsappNumber': 'Número de WhatsApp',
    'index.whatsappPlaceholder': '+541188889999',
    'index.whatsappHelp': '¡Requerido para recordatorios de cumpleaños! Incluye código de país y zona para notificaciones de WhatsApp: +5411AAAABBBB',
    'index.whatsappExample': 'Ejemplo: +541188889999, +447123456789',
    'index.joinGroup': 'Unirse al Grupo',
    'index.signIn': 'Iniciar Sesión',
    
    // Common
    'common.powerFeatures': 'Características Poderosas',
    'common.simpleProcess': 'Proceso Simple',
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