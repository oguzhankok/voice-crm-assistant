// ============================================================
// VoiceCRM — Processing Overlay / Skeleton Loader
// ============================================================

import React from 'react';
import { Loader2, Brain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProcessingOverlayProps {
  isProcessing: boolean;
  error: string | null;
  onDismissError: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  isProcessing,
  error,
  onDismissError,
}) => {
  const { language } = useLanguage();

  if (!isProcessing && !error) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-sm mx-6">
        {isProcessing ? (
          <div className="bg-[#1A1A1A] rounded-3xl p-8 border border-white/10 text-center shadow-2xl">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00D2FF] animate-spin opacity-30"
                style={{ animationDuration: '3s' }}
              />
              <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <Brain className="w-8 h-8 text-[#00D2FF] animate-pulse"/>
              </div>
            </div>

            <h3 className="text-white font-semibold text-lg mb-2">
              {language === 'tr' ? 'Ses İşleniyor...' : 'Processing Audio...'}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {language === 'tr'
                ? 'Yapay zeka kaydınızı analiz ediyor ve aksiyon planınızı oluşturuyor'
                : 'Our AI is analyzing your recording and creating a structured action plan'}
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="h-3 bg-white/10 rounded-full w-3/4 mb-2 animate-pulse" />
                <div className="h-2 bg-white/5 rounded-full w-full animate-pulse" />
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-2 bg-white/10 rounded-full flex-1 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-2 bg-white/10 rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6">
              <Loader2 className="w-4 h-4 text-[#00D2FF] animate-spin"/>
              <span className="text-gray-500 text-xs">
                {language === 'tr' ? 'Gemini AI ile Güçlendirildi' : 'Powered by Gemini AI'}
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-[#1A1A1A] rounded-3xl p-8 border border-red-500/20 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              {language === 'tr' ? 'İşlem Hatası' : 'Processing Error'}
            </h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={onDismissError}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            >
              {language === 'tr' ? 'Kapat' : 'Dismiss'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};