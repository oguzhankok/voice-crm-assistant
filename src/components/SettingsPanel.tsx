// ============================================================
// VoiceCRM — Settings Panel
// API key configuration, subscription management, webhook URL, AI Mode
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Link,
  Crown,
  Shield,
  Trash2,
  Database,
  Brain,   // EKLENDİ: Mod ikonu
  Globe    // EKLENDİ: Dil ikonu
} from 'lucide-react';
import {
  getApiKey,
  setApiKey,
  getWebhookUrl,
  setWebhookUrl,
} from '../services/supabase';
import { signOutUser } from '../services/supabase';
import { LogOut } from 'lucide-react';
import { deleteCurrentUserAccount } from '../services/supabase';
import { useLanguage, Language } from '../context/LanguageContext';
import { clearAllLocalAudio } from '../utils/localAudioStorage';
import { UserX, AlertTriangle, Loader2 } from 'lucide-react';
import { SubscriptionState } from '../types';

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  subscription: SubscriptionState;
  onTriggerPaywall: () => void;
  onClearData: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isVisible,
  onClose,
  subscription,
  onTriggerPaywall,
  onClearData,
}) => {
  const [apiKey, setApiKeyState] = useState('');
  const { language, setLanguage } = useLanguage();
  const [webhookUrl, setWebhookUrlState] = useState('');
  // YENİ EKLENEN STATELER
  const [appMode, setAppMode] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setApiKeyState(getApiKey());
      setWebhookUrlState(getWebhookUrl());
      // LocalStorage'dan mevcut ayarları çekiyoruz
      setAppMode(localStorage.getItem('voicecrm_app_mode') || 'general');
    }
  }, [isVisible]);

  const handleSave = () => {
    setApiKey(apiKey);
    setWebhookUrl(webhookUrl);
    // Yeni ayarları LocalStorage'a kaydediyoruz
    localStorage.setItem('voicecrm_app_mode', appMode);    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      onClearData();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 4000);
    }
  };
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // 1. Cihazdaki yerel ses dosyalarını sil
      await clearAllLocalAudio();
      // 2. Supabase hesabını ve buluttaki tüm verileri yok et
      await deleteCurrentUserAccount();
      // 3. Paneli kapat ve sayfayı tazeleyerek giriş ekranına yönlendir
      setShowDeleteModal(false);
      onClose();
      window.location.reload();
    } catch (err: any) {
      alert('Hesap silinirken bir hata oluştu: ' + (err.message || err));
      setIsDeleting(false);
    }
  };

  if (!isVisible) return null;

  const tierLabel = {
    free: language === 'tr' ? 'Ücretsiz' : 'Free',
    monthly: language === 'tr' ? 'Pro Aylık' : 'Pro Monthly',
    annual: language === 'tr' ? 'Pro Yıllık' : 'Pro Annual',
  }[subscription.tier];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
          {/* Header */}
          <div className="sticky top-0 bg-[#1A1A1A] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-white font-semibold text-lg">{language === 'tr' ? 'Ayarlar' : 'Settings'}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Subscription Status */}
            <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052FF] to-[#00D2FF] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{tierLabel}</h3>
                  <p className="text-gray-500 text-xs">
                    {subscription.tier === 'free'
                      ? language === 'tr'
                        ? `Bugün ${Math.max(0, 1 - subscription.dailyUsageCount)} kullanım hakkı kaldı`
                        : `${Math.max(0, 1 - subscription.dailyUsageCount)} uses remaining today`
                      : language === 'tr' ? 'Sınırsız ses işleme' : 'Unlimited processing'}
                  </p>
                </div>
              </div>
              {subscription.tier === 'free' && (
                <button
                  onClick={onTriggerPaywall}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00D2FF] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {language === 'tr' ? "Pro'ya Yükselt" : 'Upgrade to Pro'}
                </button>
              )}
            </div>

            {/* AI Assistant Mode (YENİ EKLENDİ) */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                  <Brain className="w-4 h-4 text-[#00D2FF]" />
                  {language === 'tr' ? 'Asistan Modu' : 'Assistant Mode'}
                </label>
                <select
                  value={appMode}
                  onChange={(e) => setAppMode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]/30 transition-all cursor-pointer"
                >
                  <option value="general" className="bg-[#1A1A1A]">
                    {language === 'tr' ? 'Genel' : 'General'}
                  </option>
                  <option value="real_estate" className="bg-[#1A1A1A]">
                    {language === 'tr' ? 'Emlak & Gayrimenkul' : 'Real Estate'}
                  </option>
                  <option value="legal" className="bg-[#1A1A1A]">
                    {language === 'tr' ? 'Hukuk & Avukatlık' : 'Legal'}
                  </option>
                  <option value="developer" className="bg-[#1A1A1A]">
                    {language === 'tr' ? 'Yazılım & Proje' : 'Software & Project'}
                  </option>
                </select>
              </div>

              {/* Output Language (Doğrudan LanguageContext'e bağlı) */}
              <div className="flex-1">
                <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 text-[#00D2FF]" />
                  {language === 'tr' ? 'Uygulama ve Çıktı Dili' : 'App & Output Language'}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]/30 transition-all cursor-pointer"
                >
                  <option value="tr" className="bg-[#1A1A1A]">Türkçe</option>
                  <option value="en" className="bg-[#1A1A1A]">English</option>
                </select>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 text-sm font-medium mb-2">
                <Link className="w-4 h-4 text-[#00D2FF]" />
                Webhook URL
                <span className="text-gray-600 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrlState(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF]/30 transition-all"
              />
              <p className="text-gray-600 text-[11px] mt-2">
                Connect to Slack, Trello, Zapier, or any webhook-compatible service.
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                saved
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gradient-to-r from-[#0052FF] to-[#00D2FF] text-white hover:opacity-90'
              }`}
            >
              {saved
                ? (language === 'tr' ? '✓ Ayarlar Kaydedildi' : '✓ Settings Saved')
                : (language === 'tr' ? 'Ayarları Kaydet' : 'Save Settings')}
            </button>

            {/* Data Management */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-3">
                <Database className="w-4 h-4" />
                {language === 'tr' ? 'Veri Yönetimi' : 'Data Management'}
              </h3>

              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Cloud Sync</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      Supabase integration ready
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-gray-600 text-xs">Coming soon</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearData}
                className={`w-full mt-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  showClearConfirm
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  {showClearConfirm
                    ? language === 'tr' ? 'Onaylamak için tekrar dokunun' : 'Click again to confirm deletion'
                    : language === 'tr' ? 'Tüm Planları Temizle' : 'Clear All Action Plans'}
                </span>
              </button>
              <button
                onClick={async () => {
                  await signOutUser();
                  onClose();
                }}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {language === 'tr' ? 'Oturumu Kapat' : 'Log Out'}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/15 transition-all flex items-center justify-center gap-2"
              >
                <UserX className="w-4 h-4" />
                {language === 'tr' ? 'Hesabımı ve Tüm Verilerimi Sil' : 'Delete Account & All Data'}
              </button>
            </div>

            {/* Version info */}
            <p className="text-gray-700 text-[10px] text-center pt-2">
              VoiceCRM v1.0.0 • Built with React + Gemini AI
            </p>

            <div className="h-4" />
          </div>
        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#181818] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-white text-lg font-bold mb-2">
              {language === 'tr' ? 'Hesabınızı Silmek İstiyor Musunuz?' : 'Delete Your Account?'}
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              {language === 'tr' ? (
                <>Bu işlem <strong className="text-red-400">geri alınamaz</strong>. Tüm ses kayıtlarınız, aksiyon planlarınız ve abonelik bilgileriniz kalıcı olarak silinecektir.</>
              ) : (
                <>This action <strong className="text-red-400">cannot be undone</strong>. All your audio recordings, action plans, and subscription details will be permanently removed.</>
              )}
            </p>

            <div className="space-y-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {language === 'tr' ? 'Evet, Hesabımı Kalıcı Olarak Sil' : 'Yes, Permanently Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs transition-colors"
              >
                {language === 'tr' ? 'Vazgeç' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>    
  );
};