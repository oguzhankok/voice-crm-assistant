// ============================================================
// VoiceCRM — Action Plan Card Component
// Modern card with priority indicator and task list
// ============================================================

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Send,
  User,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowUpRight,
  Copy,
  Check,
} from 'lucide-react';
import { ActionPlan } from '../types';
import { shareToWhatsApp, shareToTelegram, addToGoogleCalendar } from '../utils/shareUtils';
import { Share2, Play, Pause } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useEffect } from 'react';
import { getLocalAudioUrl } from '../utils/localAudioStorage';
import { prepareWebhookPayload, sendToWebhook } from '../services/webhook';

interface ActionPlanCardProps {
  plan: ActionPlan;
  onToggleTask: (planId: string, taskId: string) => void;
  onDelete: (planId: string) => void;
  completionPercentage: number;
}

const PRIORITY_CONFIG = {
  high: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.15)]',
    label: 'HIGH',
  },
  medium: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-500',
    glow: 'shadow-[0_0_12px_rgba(234,179,8,0.15)]',
    label: 'MEDIUM',
  },
  low: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    dot: 'bg-green-500',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.15)]',
    label: 'LOW',
  },
};

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({
  plan,
  onToggleTask,
  onDelete,
  completionPercentage,
}) => {
  const { language } = useLanguage(); // <- EKLENDİ
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [webhookSending, setWebhookSending] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(plan.audioUri || null);

  useEffect(() => {
  let active = true;
  // Sayfa yenilendiğinde (plan.audioUri boşken) cihaz hafızasından çek
  getLocalAudioUrl(plan.id).then((url) => {
    if (active && url) setAudioUrl(url);
  });
  return () => {
    active = false;
  };
}, [plan.id]);

  const priority = PRIORITY_CONFIG[plan.priority];
  const completedCount = plan.tasks.filter((t) => t.completed).length;
  const totalTasks = plan.tasks.length;

  const handleWebhookSend = async () => {
    // Çift tıklamayı engellemek için buton durumunu güncelliyoruz
    if (webhookSending) return;
    setWebhookSending(true);
    
    // Veriyi hazırlıyoruz
    const payload = prepareWebhookPayload(plan);

    // Sadece kopyalamak yerine artık dışarı fırlatıyoruz
    const result = await sendToWebhook(payload);

    setWebhookSending(false);

    if (result.success) {
      // Başarılı olursa kopyalama animasyonunu (Check ikonu) tetikleyebiliriz
      setWebhookCopied(true);
      setTimeout(() => setWebhookCopied(false), 3000);
      alert('Başarıyla gönderildi!'); // İstersen buraya projendeki Toast bildirimini koyabilirsin
    } else {
      // Hata durumunda kullanıcıyı uyar (Örn: Ayarlara URL girilmemişse)
      alert(`Hata: ${result.message}`);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(plan.id);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const createdDate = new Date(plan.createdAt).toLocaleDateString(
    language === 'tr' ? 'tr-TR' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );

  return (
    <div
      className={`
        bg-[#1A1A1A] rounded-2xl border ${priority.border} ${priority.glow}
        overflow-hidden transition-all duration-300
      `}
    >
      {/* Priority bar at top */}
      <div className={`h-1 ${priority.dot}`} />

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Priority badge + client */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider
                  ${priority.bg} ${priority.color} ${priority.border} border
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
              {plan.clientName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <User className="w-2.5 h-2.5" />
                  {plan.clientName}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-white font-semibold text-base leading-tight mb-1 truncate">
              {plan.title}
            </h3>

            {/* Summary */}
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
              {plan.summary}
            </p>
          </div>

          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Task progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPercentage === 100
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-[#0052FF] to-[#00D2FF]'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-gray-500 text-xs font-medium whitespace-nowrap">
            {completedCount}/{totalTasks} {language === 'tr' ? 'görev' : 'tasks'}
          </span>
          <span className="text-gray-600 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {createdDate}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-white/5">
          {/* Tasks list */}
          <div className="p-4 space-y-2">
            {/* ESKİ: Tasks */}
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              {language === 'tr' ? 'GÖREVLER' : 'TASKS'}
            </h4>
            {plan.tasks.length === 0 ? (
              <p className="text-gray-600 text-sm italic">
                {language === 'tr' ? 'Görev bulunamadı' : 'No tasks generated'}
              </p>
            ) : (
              plan.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onToggleTask(plan.id, task.id)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left
                    ${
                      task.completed
                        ? 'bg-white/[0.02] opacity-60'
                        : 'bg-white/[0.03] hover:bg-white/[0.06]'
                    }
                  `}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        task.completed
                          ? 'text-gray-500 line-through'
                          : 'text-white'
                      }`}
                    >
                      {task.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                      {task.assignedTo && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                          <ArrowUpRight className="w-3 h-3" />
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Action buttons Grid */}
          <div className="p-4 pt-0 space-y-3">
            {/* 4 Eşit Butonlu Grid (Webhook, WhatsApp, Telegram, Takvim) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Webhook Butonu */}
              <button
                onClick={handleWebhookSend}
                disabled={webhookSending}
                className={`
                  h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border
                  ${
                    webhookCopied
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                  }
                `}
              >
                {webhookCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'tr' ? 'Gönderildi' : 'Sent'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Webhook</span>
                  </>
                )}
              </button>

              {/* WhatsApp Butonu */}
              <button
                onClick={() => shareToWhatsApp(plan)}
                className="h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              {/* Telegram Butonu */}
              <button
                onClick={() => shareToTelegram(plan)}
                className="h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/20 hover:bg-[#229ED9]/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              {/* Takvim Butonu */}
              <button
                onClick={() => addToGoogleCalendar(plan)}
                className="h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'tr' ? 'Takvim' : 'Calendar'}</span>
              </button>
            </div>

            {/* Alt Kontrol Çubuğu: Ses Oynatıcı + Kopyala + Sil */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
              {/* Sol: Ses Dinleme Alanı */}
              <div className="flex-1 min-w-0">
                {audioUrl ? (
                  <audio
                    controls
                    src={audioUrl}
                    className="h-8 w-full max-w-[220px] opacity-80 hover:opacity-100 transition-opacity"
                  />
                ) : (
                <span className="text-[11px] text-gray-500 italic">
                  {language === 'tr' ? 'Ses kaydı yok' : 'No audio recording'}
                </span>                )}
              </div>

              {/* Sağ: İkincil Araçlar */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    const payload = prepareWebhookPayload(plan);
                    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
                  }}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                  title={language === 'tr' ? 'JSON Kopyala' : 'Copy JSON'}
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDelete}
                  className={`
                    p-2.5 rounded-xl transition-colors
                    ${
                      showDeleteConfirm
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400'
                    }
                  `}
                  title={
                    showDeleteConfirm
                      ? (language === 'tr' ? 'Onaylamak için tekrar tıkla' : 'Click again to confirm')
                      : (language === 'tr' ? 'Planı sil' : 'Delete plan')
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
