import { ActionPlan } from '../types';

/**
 * Aksiyon planını WhatsApp/Telegram için okunabilir bir mesaj metnine dönüştürür.
 */
export function formatPlanForSharing(plan: ActionPlan): string {
  const taskList = plan.tasks
    .map((t, idx) => `${t.completed ? '✅' : '▫️'} ${idx + 1}. ${t.text}`)
    .join('\n');

  return `📌 *VoiceCRM Aksiyon Planı*\n\n` +
         `👤 *Müşteri:* ${plan.clientName || 'Belirtilmedi'}\n` +
         `📝 *Özet:* ${plan.summary}\n\n` +
         `📋 *Görevler:*\n${taskList}\n\n` +
         `⚡ _VoiceCRM ile ses kaydından oluşturuldu._`;
}

/**
 * Tek tıkla WhatsApp sohbetine aktarır.
 */
export function shareToWhatsApp(plan: ActionPlan): void {
  const text = formatPlanForSharing(plan);
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/**
 * Tek tıkla Telegram'a aktarır.
 */
export function shareToTelegram(plan: ActionPlan): void {
  const text = formatPlanForSharing(plan);
  const url = `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/**
 * Plandaki ilk görevi veya teslim tarihini Google Takvim etkinliğine dönüştürür.
 */
export function addToGoogleCalendar(plan: ActionPlan): void {
  const title = `VoiceCRM: ${plan.clientName ? plan.clientName + ' - ' : ''}${plan.title}`;
  const details = formatPlanForSharing(plan);
  
  // Varsayılan olarak bugünden yarına 1 saatlik etkinlik açar
  const startDate = new Date();
  startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&details=${encodeURIComponent(details)}&dates=${formatTime(startDate)}/${formatTime(endDate)}`;

  window.open(url, '_blank');
}