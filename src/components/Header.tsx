// ============================================================
// VoiceCRM — Header Component
// ============================================================

import React from 'react';
import { Settings, Crown, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  isPro: boolean;
  onSettingsPress: () => void;
  planCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isPro,
  onSettingsPress,
  planCount,
}) => {
  const { language } = useLanguage(); // <- EKLENDİ
  return (
    <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052FF] to-[#00D2FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">
              VoiceCRM
            </h1>
            <p className="text-gray-500 text-[10px] leading-tight">
              {language === 'tr' ? 'Yapay Zeka Destekli Aksiyon Planları' : 'AI-Powered Action Plans'}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Plan count badge */}
          {planCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-[11px] font-medium">
              {planCount} {language === 'tr' ? 'plan' : `plan${planCount !== 1 ? 's' : ''}`}
            </span>
          )}

          {/* Pro badge */}
          {isPro && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#0052FF]/20 to-[#00D2FF]/20 border border-[#0052FF]/30 text-[#00D2FF] text-[10px] font-bold">
              <Crown className="w-3 h-3" />
              PRO
            </span>
          )}

          {/* Settings */}
          <button
            onClick={onSettingsPress}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4.5 h-4.5 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
