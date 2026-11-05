import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, onDelete }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    // ÇÖZÜM BURASI: Tıklama başladığında mevcut konumu da aynı yapıyoruz ki
    // sadece dokunup bırakmalarda (kaydırma yokken) mesafe 0 olsun.
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchCurrentX.current;
    
    // Sola kaydırma tetikleyicisi
    if (swipeDistance > 50) {
      setIsRevealed(true);
    } 
    // Sağa kaydırma tetikleyicisi
    else if (swipeDistance < -50) {
      setIsRevealed(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-4 group">
      {/* Arka Plan: Kırmızı Sil Butonu */}
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-2xl">
        <button
          onClick={() => {
            onDelete();
            setIsRevealed(false);
          }}
          className="w-full h-full flex flex-col items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/20 transition-all"
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-semibold tracking-wide">SİL</span>
        </button>
      </div>

      {/* Ön Plan: Orijinal Görev Kartı */}
      <div
        className={`relative w-full transition-transform duration-300 ease-out bg-[#1A1A1A] z-10 ${
          isRevealed ? '-translate-x-24' : 'translate-x-0'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};