// ============================================================
// VoiceCRM — Empty State Component
// ============================================================

import React from 'react';
import { Mic, ArrowUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const EmptyState: React.FC = () => {
  const { language } = useLanguage();

  const sampleHints =
    language === 'tr'
      ? [
          '"Ahmet Bey ile Çankaya projesindeki daire için görüştüm..."',
          '"Cuma gününe kadar sözleşme revizesini avukata iletmem gerekiyor..."',
          '"Yeni gelen potansiyel müşteriyle yarın 14:00\'te toplantı ayarla..."',
        ]
      : [
          '"I just met with Sarah Johnson about the Oak Lane property..."',
          '"Need to follow up with the Martinez contract by Friday..."',
          '"Schedule a demo call with the new lead from the conference..."',
        ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0052FF]/10 to-[#00D2FF]/10 border border-[#0052FF]/20 flex items-center justify-center">
          <Mic className="w-10 h-10 text-[#00D2FF]/40" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00D2FF] flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/30">
          <ArrowUp className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-white font-semibold text-lg mb-2 text-center">
        {language === 'tr' ? 'Henüz Bir Plan Yok' : 'No Action Plans Yet'}
      </h3>
      <p className="text-gray-500 text-sm text-center max-w-xs leading-relaxed">
        {language === 'tr'
          ? 'Yukarıdaki mikrofon butonuna dokunup notlarınızı konuşun. Yapay zeka bunları görevlere bölünmüş aksiyon planlarına dönüştürecektir.'
          : 'Tap the microphone button above and speak your notes. Our AI will convert them into structured action plans with tasks.'}
      </p>

      {/* Example hints */}
      <div className="mt-6 space-y-2 w-full max-w-xs">
        <p className="text-gray-600 text-[11px] font-medium uppercase tracking-wider text-center mb-3">
          {language === 'tr' ? 'Şunun gibi cümleler deneyin:' : 'Try saying something like:'}
        </p>
        {sampleHints.map((hint, i) => (
          <div
            key={i}
            className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5"
          >
            <p className="text-gray-500 text-xs italic">{hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
};