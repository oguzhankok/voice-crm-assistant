// ============================================================
// VoiceCRM — Microphone Button Component
// Large, glowing circular button with pulse animation
// ============================================================

import React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MicButtonProps {
  isRecording: boolean;
  disabled: boolean;
  formattedDuration: string;
  onPress: () => void;
  remainingUses: number;
  isPro: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  disabled,
  formattedDuration,
  onPress,
  remainingUses,
  isPro,
}) => {
  const { language } = useLanguage(); // <- EKLENDİ
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status text above button */}
      <div className="text-center min-h-[3rem]">
        {isRecording ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-red-400 font-medium text-sm tracking-wider uppercase animate-pulse">
              ● {language === 'tr' ? 'Kaydediliyor' : 'Recording'}
            </span>
            <span className="text-white text-3xl font-mono font-bold tracking-widest">
              {formattedDuration}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-400 text-sm">
              {disabled
                ? language === 'tr' ? 'Mikrofon kullanılamıyor' : 'Microphone unavailable'
                : language === 'tr' ? 'Kaydetmek için dokunun' : 'Tap to record'}
            </span>
            {!isPro && (
              <span className="text-gray-500 text-xs">
                {remainingUses > 0
                  ? language === 'tr'
                    ? `Bugün ${remainingUses} ücretsiz kullanım hakkınız kaldı`
                    : `${remainingUses} free use${remainingUses !== 1 ? 's' : ''} remaining today`
                  : language === 'tr'
                    ? 'Günlük limit doldu — Pro\'ya yükseltin'
                    : 'Daily limit reached — Upgrade to Pro'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* The Microphone Button */}
      <button
        onClick={onPress}
        disabled={disabled && !isRecording}
        className={`
          relative w-32 h-32 rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-4 focus:ring-blue-500/30
          ${
            isRecording
              ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]'
              : disabled
              ? 'bg-gray-800 border-2 border-gray-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-[#0052FF] to-[#00D2FF] border-2 border-[#00D2FF]/50 shadow-[0_0_60px_rgba(0,82,255,0.4)] hover:shadow-[0_0_80px_rgba(0,82,255,0.6)] hover:scale-105 active:scale-95 cursor-pointer'
          }
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-red-500/60 animate-[ping_1.5s_ease-in-out_infinite]" />
            <span className="absolute inset-[-8px] rounded-full border border-red-500/30 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
            <span className="absolute inset-[-16px] rounded-full border border-red-500/15 animate-[ping_2.5s_ease-in-out_infinite_1s]" />
          </>
        )}

        {/* Glow ring when idle */}
        {!isRecording && !disabled && (
          <span className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-[#0052FF]/20 to-[#00D2FF]/20 animate-[pulse_3s_ease-in-out_infinite]" />
        )}

        {/* Icon */}
        {isRecording ? (
          <Square className="w-10 h-10 text-red-400 fill-red-400 relative z-10" />
        ) : disabled ? (
          <MicOff className="w-10 h-10 text-gray-500 relative z-10" />
        ) : (
          <Mic className="w-12 h-12 text-white relative z-10 drop-shadow-lg" />
        )}
      </button>

      {/* Hint below */}
      {isRecording && (
        <p className="text-gray-400 text-xs animate-pulse">
          {language === 'tr' ? 'Kaydı durdurmak için dokunun' : 'Tap the button to stop recording'}
        </p>
      )}
    </div>
  );
};
