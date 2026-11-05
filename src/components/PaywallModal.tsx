// ============================================================
// VoiceCRM — Paywall Bottom Sheet Modal
// ============================================================

import React from 'react';
import {
  X,
  Crown,
  Zap,
  Infinity,
  Shield,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';
import { PRODUCTS } from '../services/revenuecat';
import { useLanguage } from '../context/LanguageContext';

interface PaywallModalProps {
  isVisible: boolean;
  isPurchasing: boolean;
  purchaseError: string | null;
  onDismiss: () => void;
  onPurchase: (productId: string) => void;
  onRestore: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isVisible,
  isPurchasing,
  purchaseError,
  onDismiss,
  onPurchase,
  onRestore,
}) => {
  const { language } = useLanguage();

  if (!isVisible) return null;

  const features = [
    {
      icon: Infinity,
      text:
        language === 'tr'
          ? 'Günlük sınırsız ses kaydı'
          : 'Unlimited voice recordings per day',
    },
    {
      icon: Zap,
      text:
        language === 'tr'
          ? 'Gemini ile öncelikli yapay zeka işleme'
          : 'Priority AI processing with Gemini',
    },
    {
      icon: Shield,
      text:
        language === 'tr'
          ? 'Supabase ile bulut yedekleme ve senkronizasyon'
          : 'Cloud backup & sync with Supabase',
    },
    {
      icon: Sparkles,
      text:
        language === 'tr'
          ? 'WhatsApp, Telegram ve Takvim entegrasyonu'
          : 'Advanced CRM & Calendar integrations',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#1A1A1A] to-[#111] rounded-t-3xl animate-[slideUp_0.4s_ease-out] max-h-[90vh] overflow-y-auto"
        style={{
          boxShadow: '0 -20px 60px rgba(0, 82, 255, 0.15)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#00D2FF] mb-4 shadow-[0_0_40px_rgba(0,82,255,0.3)]">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {language === 'tr' ? "VoiceCRM Pro'ya Yükseltin" : 'Upgrade to VoiceCRM Pro'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
              {language === 'tr'
                ? 'Sınırsız sesli aksiyon planı oluşturun, üretkenliğinizi zirveye taşıyın.'
                : 'Unlock unlimited voice-to-action conversions and supercharge your productivity.'}
            </p>
          </div>

          {/* Daily limit warning */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 text-center">
            <p className="text-red-400 text-sm font-medium">
              {language === 'tr'
                ? '⚡ Günlük ücretsiz kullanım limitiniz doldu'
                : "⚡ You've reached your free daily limit"}
            </p>
            <p className="text-red-400/60 text-xs mt-1">
              {language === 'tr'
                ? 'Ücretsiz kullanıcılar günde 1 ses kaydı işleyebilir'
                : 'Free users can process 1 recording per day'}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-[#00D2FF]" />
                </div>
                <span className="text-gray-300 text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing options */}
          <div className="space-y-3 mb-6">
            {/* Annual Plan (Best Value) */}
            <button
              onClick={() => onPurchase(PRODUCTS.ANNUAL.id)}
              disabled={isPurchasing}
              className="w-full relative overflow-hidden rounded-2xl border-2 border-[#0052FF] bg-gradient-to-r from-[#0052FF]/10 to-[#00D2FF]/10 p-4 text-left transition-all hover:border-[#00D2FF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Best Value badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#0052FF] to-[#00D2FF] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                {language === 'tr' ? 'En Avantajlı' : 'Best Value'}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base">
                    {language === 'tr' ? 'Yıllık Pro' : PRODUCTS.ANNUAL.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">
                      {PRODUCTS.ANNUAL.price}
                    </span>
                    <span className="text-gray-400 text-sm">
                      /{language === 'tr' ? 'yıl' : PRODUCTS.ANNUAL.period}
                    </span>
                  </div>
                  <p className="text-[#00D2FF] text-xs mt-1 font-medium">
                    {PRODUCTS.ANNUAL.monthlyEquivalent} • {language === 'tr' ? '%50 Tasarruf' : 'Save 50%'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/30">
                    {language === 'tr' ? '7 GÜN ÜCRETSİZ DENE' : '7-DAY FREE TRIAL'}
                  </div>
                  {isPurchasing ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 text-blue-400" />
                  )}
                </div>
              </div>
            </button>

            {/* Monthly Plan */}
            <button
              onClick={() => onPurchase(PRODUCTS.MONTHLY.id)}
              disabled={isPurchasing}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base">
                    {language === 'tr' ? 'Aylık Pro' : PRODUCTS.MONTHLY.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">
                      {PRODUCTS.MONTHLY.price}
                    </span>
                    <span className="text-gray-400 text-sm">
                      /{language === 'tr' ? 'ay' : PRODUCTS.MONTHLY.period}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    {language === 'tr'
                      ? 'İstediğiniz zaman iptal edebilirsiniz'
                      : PRODUCTS.MONTHLY.description}
                  </p>
                </div>
                {isPurchasing ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                )}
              </div>
            </button>
          </div>

          {/* Error message */}
          {purchaseError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-center">
              <p className="text-red-400 text-sm">{purchaseError}</p>
            </div>
          )}

          {/* Restore purchases */}
          <div className="text-center">
            <button
              onClick={onRestore}
              disabled={isPurchasing}
              className="text-gray-500 text-xs hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              {language === 'tr' ? 'Satın Alımları Geri Yükle' : 'Restore Purchases'}
            </button>
          </div>

          {/* Legal text */}
          <p className="text-gray-600 text-[10px] text-center mt-4 leading-relaxed">
            {language === 'tr'
              ? 'Ödeme Google Play veya App Store hesabınızdan tahsil edilecektir. Abonelik, dönem sonundan en az 24 saat önce iptal edilmediği sürece otomatik yenilenir. İstediğiniz zaman hesap ayarlarınızdan iptal edebilirsiniz.'
              : 'Payment will be charged to your account. Subscription auto-renews unless cancelled at least 24 hours before the end of the current period. Cancel anytime in your account settings.'}
          </p>

          {/* Bottom safe area */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};