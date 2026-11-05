import React, { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  isRecording: boolean;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina ekranlar için netlik ayarı
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      if (!isRecording) {
        // Kayıt yoksa dümdüz ince bir çizgi göster
        ctx.beginPath();
        ctx.moveTo(0, canvas.offsetHeight / 2);
        ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      phaseRef.current += 0.15; // Dalganın akış hızı

      // 3 farklı katmanda (farklı renk ve opaklıkta) dalga çizerek derinlik yaratıyoruz
      const waves = [
        { amplitude: 18, frequency: 0.04, opacity: 0.4, color: '#0052FF' }, // Ana Mavi
        { amplitude: 12, frequency: 0.06, opacity: 0.6, color: '#00D2FF' }, // Açık Mavi/Cyan
        { amplitude: 8, frequency: 0.03, opacity: 0.2, color: '#FFFFFF' }   // Beyaz Işıltı
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = wave.opacity;
        ctx.lineWidth = 2;

        for (let x = 0; x < canvas.offsetWidth; x++) {
          // Doğal bir ses dalgası formu için sinüs dalgası kurgusu
          // Kenarlara doğru sönümlenmesi (fade) için çarpım ekliyoruz
          const normalization = Math.sin((x / canvas.offsetWidth) * Math.PI);
          const y =
            canvas.offsetHeight / 2 +
            Math.sin(x * wave.frequency + phaseRef.current) *
              wave.amplitude *
              normalization *
              (0.6 + Math.random() * 0.4); // Ses dalgalanması efekti için hafif gürültü (noise)

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    if (isRecording) {
      render();
    } else {
      // Kayıt bitince son bir kez hareketsiz çizgiyi çiz
      render();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]);

  return (
    <div className="w-full h-16 flex items-center justify-center px-4 overflow-hidden my-2">
      <canvas ref={canvasRef} className="w-full h-full opacity-80" />
    </div>
  );
};