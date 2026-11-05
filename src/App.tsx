// ============================================================
// VoiceCRM — Main Application Entry
// AI Voice Assistant & CRM Tool
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useActionPlans } from './hooks/useActionPlans';
import { useSubscription } from './hooks/useSubscription';
import { processAudioWithGemini, generateDemoActionPlan } from './services/gemini';
import { getApiKey, fetchSubscription } from './services/supabase';
import { SwipeableCard } from './components/SwipeableCard';
import { Header } from './components/Header';
import { MicButton } from './components/MicButton';
import { ActionPlanCard } from './components/ActionPlanCard';
import { PaywallModal } from './components/PaywallModal';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { supabase } from './utils/supabaseClient';
import { AuthModal } from './components/AuthModal';
import { saveLocalAudio } from './utils/localAudioStorage';
import { User } from '@supabase/supabase-js';
import { useLanguage } from './context/LanguageContext';
import { EmptyState } from './components/EmptyState';
import { Filter, Sparkles, Search, X } from 'lucide-react';
import { VoiceWaveform } from './components/VoiceWaveform';


type FilterType = 'all' | 'high' | 'medium' | 'low';

export default function App() {
  // ---- Hooks ----
  const { language, t } = useLanguage();
  const recorder = useAudioRecorder();
  const actionPlans = useActionPlans();
  const subscription = useSubscription();
  const isProcessingRef = useRef(false);

  // ---- Local State ----
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('voicecrm_visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('voicecrm_visited', 'true');
    }
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (!session?.user) {
        actionPlans.clearPlans();
        setShowAuthModal(true);
      }
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setCurrentUser(session?.user ?? null);
        if (session?.user) {
          setShowAuthModal(false);
          // 1. Yeni kullanıcının planlarını çek
          actionPlans.refreshPlans();
          // 2. Yeni kullanıcının Supabase'deki gerçek abonelik ve kullanım kotasını yükle
          await subscription.reloadSubscription();
        } else {
          // Çıkış yapıldığında ekranı ve kartları temizle
          actionPlans.clearPlans();
          setShowAuthModal(true);
        }
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  // ---- Handlers ----

  /**
   * Handle mic button press — toggle recording
   */
  const handleMicPress = useCallback(async () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
      return;
    }

    const allowed = await subscription.canProcess();
    if (!allowed) {
      subscription.triggerPaywall();
      return;
    }

    const started = await recorder.startRecording();
    if (!started) {
      setProcessError(
        'Could not access the microphone. Please allow microphone permission in your browser settings and try again.'
      );
    }
  }, [recorder, subscription]);

  
  /**
   * Process recorded audio after recording stops (Kilitli & Tekil Tetikleme)
   */
  useEffect(() => {
    if (
      !recorder.isRecording &&
      recorder.audioBlob &&
      recorder.audioBlob.size > 0 &&
      !isProcessingRef.current
    ) {
      isProcessingRef.current = true;
      processRecordedAudio(recorder.audioBlob).finally(() => {
        isProcessingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.isRecording, recorder.audioBlob]);

  const processRecordedAudio = async (audioBlob: Blob) => {
    const apiKey = getApiKey();

    // DÜZELTME: Fonksiyon async olduğu için await ekliyoruz
    const allowed = await subscription.recordUsage();
    if (!allowed) {
      recorder.resetRecording();
      return;
    }

    setIsProcessing(true);
    setProcessError(null);

    try {
      let response;

      if (!apiKey) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        response = generateDemoActionPlan();
      } else {
        response = await processAudioWithGemini(audioBlob, apiKey, language);
      }

      // Sesi doğrudan fonksiyona gönderiyoruz (tek çağrı):
      await actionPlans.createFromGeminiResponse(response, audioBlob);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while processing your audio.';
      setProcessError(message);
    } finally {
      setIsProcessing(false);
      recorder.resetRecording();
    }
    
  };

  const handleDismissError = useCallback(() => {
    setProcessError(null);
  }, []);

  const handleClearData = useCallback(() => {
    actionPlans.plans.forEach((plan) => actionPlans.deletePlan(plan.id));
  }, [actionPlans]);

  // ---- Filtered Plans ----
  // YENİ HALİ (Hem öncelik hem metin araması yapar)
  const filteredPlans = actionPlans.plans.filter((plan) => {
    // 1. Öncelik Kontrolü
    const matchesFilter = activeFilter === 'all' || plan.priority === activeFilter;
    
    // 2. Metin Araması Kontrolü (Başlıkta arar, istersen plan.description vb. alanları da ekleyebilirsin)
    const matchesSearch = plan.title
      ? plan.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesFilter && matchesSearch;
  });
  const isPro = subscription.subscription.tier !== 'free';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <Header
        isPro={isPro}
        onSettingsPress={() => setShowSettings(true)}
        planCount={actionPlans.plans.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full flex flex-col">
        {/* Mic Section */}
        {/* Arama Çubuğu (Search Bar) */}
        {actionPlans.plans.length > 0 && (
          <div className="px-4 mb-3 flex-shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'tr'
                    ? 'Planlarda ara (örn: Sözleşme, Tapu...)'
                    : 'Search plans (e.g. Contract, Meeting...)'
                }
                className="w-full bg-white/[0.03] border border-white/5 focus:border-white/10 focus:bg-white/[0.06] rounded-xl text-sm pl-10 pr-10 py-2.5 text-white placeholder-gray-500 outline-none transition-all"
              />
              {/* Eğer arama çubuğu doluysa temizleme (X) butonu göster */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
        <section className="py-8 px-4 flex-shrink-0">
          <MicButton
            isRecording={recorder.isRecording}
            disabled={recorder.permissionDenied}
            formattedDuration={recorder.formattedDuration}
            onPress={handleMicPress}
            remainingUses={subscription.remainingFreeUses}
            isPro={isPro}
          />
          {/* YENİ: Ses Dalgası Görselleştirmesi */}
          <VoiceWaveform isRecording={recorder.isRecording} />
        </section>

        {/* Demo mode hint */}
        {!getApiKey() && actionPlans.plans.length === 0 && !showOnboarding && (
          <div className="px-4 mb-4">
            <div className="bg-gradient-to-r from-[#0052FF]/10 to-[#00D2FF]/10 border border-[#0052FF]/20 rounded-xl p-3 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#00D2FF] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-300 text-sm font-medium">Demo Mode Active</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  No API key configured. Recordings will generate sample action plans.
                  Add your Gemini API key in Settings for real AI processing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {actionPlans.plans.length > 0 && (
          <div className="px-4 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-600" />
              {(['all', 'high', 'medium', 'low'] as const).map((filter) => {
                const isActive = activeFilter === filter;
                const dotColor = {
                  all: '',
                  high: 'bg-red-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500',
                }[filter];
                const count =
                  filter === 'all'
                    ? actionPlans.plans.length
                    : actionPlans.plans.filter((p) => p.priority === filter).length;

                // DİLE GÖRE ETİKET SÖZLÜĞÜ:
                const filterLabel = {
                  all: language === 'tr' ? 'Tümü' : 'All',
                  high: language === 'tr' ? 'Yüksek' : 'High',
                  medium: language === 'tr' ? 'Orta' : 'Medium',
                  low: language === 'tr' ? 'Düşük' : 'Low',
                }[filter];

                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                      }
                    `}
                  >
                    {filter !== 'all' && (
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    )}
                    {/* ESKİ: filter.charAt(0).toUpperCase() + filter.slice(1) */}
                    {filterLabel}
                    <span className={`text-[10px] ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Plans List */}
        <section className="flex-1 px-4 pb-8 overflow-y-auto">
          {actionPlans.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-4 animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-16 h-4 rounded-full bg-white/10" />
                    <div className="w-20 h-4 rounded-full bg-white/5" />
                  </div>
                  <div className="h-4 bg-white/10 rounded-full w-3/4 mb-2" />
                  <div className="h-3 bg-white/5 rounded-full w-full mb-1" />
                  <div className="h-3 bg-white/5 rounded-full w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredPlans.length === 0 ? (
            activeFilter !== 'all' ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-sm">
                  {language === 'tr'
                    ? `${activeFilter === 'high' ? 'Yüksek' : activeFilter === 'medium' ? 'Orta' : 'Düşük'} öncelikli plan bulunamadı`
                    : `No ${activeFilter} priority plans found`}
                </p>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <div className="space-y-3">
              {filteredPlans.map((plan) => (
                // SwipeableCard'ı burada çağırıyoruz ve key'i ona veriyoruz.
                // Silme fonksiyonunu da bu sarmalayıcıya yönlendiriyoruz.
                <SwipeableCard
                  key={plan.id}
                  onDelete={() => actionPlans.deletePlan(plan.id)}
                >
                  <ActionPlanCard
                    plan={plan}
                    onToggleTask={actionPlans.toggleTask}
                    // onDelete'i ActionPlanCard'dan silebilirsin ya da 
                    // hata vermemesi için boş bir fonksiyon gönderebilirsin.
                    // Çünkü silme işlemi artık SwipeableCard tarafından yönetiliyor.
                    onDelete={() => {}} 
                    completionPercentage={actionPlans.getCompletionPercentage(plan)}
                  />
                </SwipeableCard>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Processing Overlay */}
      <ProcessingOverlay
        isProcessing={isProcessing}
        error={processError}
        onDismissError={handleDismissError}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isVisible={subscription.showPaywall}
        isPurchasing={subscription.isPurchasing}
        purchaseError={subscription.purchaseError}
        onDismiss={subscription.dismissPaywall}
        onPurchase={subscription.handlePurchase}
        onRestore={subscription.handleRestore}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        subscription={subscription.subscription}
        onTriggerPaywall={() => {
          setShowSettings(false);
          subscription.triggerPaywall();
        }}
        onClearData={handleClearData}
      />
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal && !currentUser}
        onSuccess={() => setShowAuthModal(false)}
      />

      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-sm mx-6 bg-[#1A1A1A] rounded-3xl p-8 border border-white/10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#00D2FF] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(0,82,255,0.3)]">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-3">
              {language === 'tr' ? "VoiceCRM'e Hoş Geldiniz" : 'Welcome to VoiceCRM'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              {language === 'tr'
                ? 'Sesli notlarınızı yapay zeka ile aksiyon planlarına dönüştürün.'
                : 'Convert your voice notes into structured action plans powered by AI.'}
            </p>
            <p className="text-gray-500 text-xs leading-relaxed mb-6">
              {language === 'tr'
                ? 'Emlak danışmanları, avukatlar ve saha satış profesyonelleri için tasarlandı.'
                : 'Built for real estate agents, lawyers, and field sales professionals.'}
            </p>

            <div className="space-y-2 mb-6">
              {[
                language === 'tr'
                  ? '🎙️  Notlarınızı kaydetmek için mikrofona dokunun'
                  : '🎙️  Tap the mic to record your notes',
                language === 'tr'
                  ? '🤖  Yapay zeka görevleri ve öncelikleri çıkarsın'
                  : '🤖  AI extracts tasks & priorities',
                language === 'tr'
                  ? '📋  Eylemlerinizi takip edin ve tamamlayın'
                  : '📋  Track and complete your action items',
                language === 'tr'
                  ? '🔗  WhatsApp, Telegram veya Takvime aktarın'
                  : '🔗  Export to WhatsApp, Telegram & Calendar',
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/[0.03] rounded-xl px-4 py-2.5 text-left"
                >
                  <p className="text-gray-300 text-sm">{item}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowOnboarding(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00D2FF] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
            >
              {language === 'tr' ? 'Hemen Başlayın' : 'Get Started'}
            </button>

            <p className="text-gray-600 text-[10px] mt-3">
              {language === 'tr'
                ? 'Ücretsiz planda günlük 1 ses kaydı hakkı dahildir'
                : 'Free tier includes 1 recording per day'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
