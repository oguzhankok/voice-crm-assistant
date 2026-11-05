import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'tr' | 'en';

export const translations = {
  tr: {
    // Auth & Giriş
    welcome: 'VoiceCRM\'e Hoş Geldiniz',
    auth_subtitle: 'Sesli notlarınızı yapay zeka ile görevlere dönüştürün.',
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    email: 'E-posta',
    password: 'Şifre',
    google_continue: 'Google ile Devam Et',
    or_email: 'veya e-posta ile',
    no_account: 'Hesabınız yok mu? Kayıt olun',
    have_account: 'Zaten hesabınız var mı? Giriş yapın',
    logout: 'Oturumu Kapat',
    
    // Header & Filtreler
    plans_count: 'plan',
    all: 'Tümü',
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    search_placeholder: 'Planlarda ara (örn: Sözleşme, Tapu...)...',
    
    // Kartlar & Görevler
    tasks: 'GÖREVLER',
    no_tasks: 'Görev bulunamadı',
    no_audio: 'Ses kaydı yok',
    send_webhook: 'Webhook',
    copied: 'Kopyalandı',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    calendar: 'Takvim',
    confirm_delete: 'Silmek için tekrar bas',
    
    // Ayarlar
    settings_title: 'Ayarlar',
    subscription_status: 'Abonelik Durumu',
    upgrade_pro: 'Pro\'ya Yükselt',
    assistant_mode: 'Asistan Modu',
    output_language: 'Uygulama ve Çıktı Dili',
    save_settings: 'Ayarları Kaydet',
    saved: '✓ Kaydedildi',
    delete_account_btn: 'Hesabımı ve Tüm Verilerimi Sil',
    delete_modal_title: 'Hesabınızı Silmek İstiyor Musunuz?',
    delete_modal_desc: 'Bu işlem geri alınamaz. Tüm ses kayıtlarınız, aksiyon planlarınız ve abonelik bilgileriniz kalıcı olarak silinecektir.',
    delete_modal_confirm: 'Evet, Hesabımı Kalıcı Olarak Sil',
    cancel: 'Vazgeç',
    
    // Mikrofon
    tap_to_record: 'Kayda başlamak için dokunun',
    recording: 'Dinleniyor...',
    processing: 'Yapay zeka planı hazırlıyor...',
  },
  en: {
    // Auth
    welcome: 'Welcome to VoiceCRM',
    auth_subtitle: 'Turn your voice notes into structured tasks with AI.',
    login: 'Log In',
    register: 'Sign Up',
    email: 'Email',
    password: 'Password',
    google_continue: 'Continue with Google',
    or_email: 'or with email',
    no_account: 'Don\'t have an account? Sign up',
    have_account: 'Already have an account? Log in',
    logout: 'Log Out',
    
    // Header & Filters
    plans_count: 'plans',
    all: 'All',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    search_placeholder: 'Search plans (e.g. Contract, Meeting...)...',
    
    // Cards & Tasks
    tasks: 'TASKS',
    no_tasks: 'No tasks found',
    no_audio: 'No audio recording',
    send_webhook: 'Webhook',
    copied: 'Copied',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    calendar: 'Calendar',
    confirm_delete: 'Click again to confirm',
    
    // Settings
    settings_title: 'Settings',
    subscription_status: 'Subscription Status',
    upgrade_pro: 'Upgrade to Pro',
    assistant_mode: 'Assistant Mode',
    output_language: 'App & Output Language',
    save_settings: 'Save Settings',
    saved: '✓ Saved',
    delete_account_btn: 'Delete Account & All Data',
    delete_modal_title: 'Delete Your Account?',
    delete_modal_desc: 'This action cannot be undone. All your audio recordings, action plans, and subscription details will be permanently removed.',
    delete_modal_confirm: 'Yes, Permanently Delete My Account',
    cancel: 'Cancel',
    
    // Mic
    tap_to_record: 'Tap to record',
    recording: 'Listening...',
    processing: 'AI is generating action plan...',
  },
} as const;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['tr']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('voicecrm_language') as Language;
    if (saved === 'tr' || saved === 'en') return saved;
    return navigator.language.startsWith('tr') ? 'tr' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('voicecrm_language', lang);
  };

  const t = (key: keyof typeof translations['tr']): string => {
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
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};