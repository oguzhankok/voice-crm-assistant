// ============================================================
// VoiceCRM — Gemini API Service
// ============================================================

import { GeminiActionPlanResponse } from '../types';

// DÜZELTME: Geçerli ve güncel Gemini Flash modeli
const MODEL_PRIORITY = [
  'gemini-3.8-flash',       // 1. Tercih: Google'ın önerdiği en güncel ve stabil model
  'gemini-3.6-flash',       // 2. Tercih: Kota durumunda devreye girecek stabil yedek
  'gemini-3.5-flash-lite',  // 3. Tercih: Yüksek kotalı lite model
];

export type AppMode = 'general' | 'real_estate' | 'legal' | 'developer';

export const getSystemPrompt = (mode: AppMode, targetLang: 'tr' | 'en') => {
  let persona = '';

  switch (mode) {
    case 'real_estate':
      persona = 'You are an expert Real Estate CRM Assistant. Focus on properties, buyers, sellers, and listings.';
      break;
    case 'legal':
      persona = 'You are an expert Legal Assistant. Focus on clients, lawsuits, contracts, and court dates.';
      break;
    case 'developer':
      persona = 'You are an expert Agile Project Manager for a freelance software developer. Focus on web, mobile, and game development.';
      break;
    case 'general':
    default:
      persona = 'You are an expert CRM coordinator. Convert spoken notes into structured, actionable plans.';
      break;
  }

  const langInstruction =
    targetLang === 'tr'
      ? 'CRITICAL TRANSLATION RULE: Translate the transcription and generate ALL outputs (title, summary, tasks text) STRICTLY AND EXCLUSIVELY IN TURKISH.'
      : 'CRITICAL TRANSLATION RULE: Generate ALL outputs (title, summary, tasks text) STRICTLY AND EXCLUSIVELY IN ENGLISH.';

  const instructions = `
CRITICAL INSTRUCTIONS:
1. Extract the core subject/topic and create a clear, concise title.
2. Write a 1-2 sentence summary of the key points discussed.
3. Identify any client or contact names mentioned.
4. Assess priority based on urgency cues ("high", "medium", "low").
5. Break down all actionable items into discrete tasks with estimated due dates (YYYY-MM-DD) if urgency is mentioned.
6. If a person is mentioned as responsible, set them as assignedTo.
7. ${langInstruction}

You MUST respond with ONLY a valid, minified JSON object matching this schema. No markdown, no code fences:
{
  "title": "string",
  "summary": "string",
  "clientName": "string or omit",
  "priority": "high" | "medium" | "low",
  "tasks": [
    {
      "id": "task_1",
      "text": "description",
      "dueDate": "YYYY-MM-DD or omit",
      "assignedTo": "name or omit"
    }
  ]
}
If the audio is unclear, return priority "low" and an empty tasks array.`;

  return `${persona}\n\n${instructions}`;
};

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getAudioMimeType(blob: Blob): string {
  if (blob.type && blob.type.startsWith('audio/')) {
    // DÜZELTME: Codec parametrelerini kırparak Gemini'nin kabul ettiği saf mime tipini alıyoruz
    return blob.type.split(';')[0];
  }
  return 'audio/webm';
}

export class GeminiServiceError extends Error {
  public statusCode?: number;
  public rawResponse?: string;

  constructor(message: string, statusCode?: number, rawResponse?: string) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
    this.rawResponse = rawResponse;
  }
}

export async function processAudioWithGemini(
  audioBlob: Blob,
  apiKey: string,
  targetLang: 'tr' | 'en' = 'tr'
): Promise<GeminiActionPlanResponse> {
  if (!apiKey || apiKey.trim() === '') {
    throw new GeminiServiceError('Gemini API key is not configured.');
  }

  if (!audioBlob || audioBlob.size === 0) {
    throw new GeminiServiceError('No audio data to process.');
  }

  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = getAudioMimeType(audioBlob);
  const currentMode: AppMode = (localStorage.getItem('voicecrm_app_mode') as AppMode) || 'general';

  // DÜZELTME: Dinamik prompt doğrudan seçilen mod ve aktif dille üretilir
  const systemPrompt = getSystemPrompt(currentMode, targetLang);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          { text: 'Extract the action plan from this audio. Return ONLY the raw JSON object.' },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    },
  };

  let lastErrorMsg = '';

  for (const model of MODEL_PRIORITY) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // 503 (Yoğunluk) veya 429 (Kota) hatası gelirse bir sonraki yedek modele geç
      if (response.status === 503 || response.status === 429) {
        console.warn(`[Gemini] ${model} meşgul (HTTP ${response.status}). Yedek modele geçiliyor...`);
        lastErrorMsg = await response.text();
        // Sunucuya nefes aldırmak için yarım saniye bekle
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new GeminiServiceError(
          `Gemini API error (${response.status}): ${errorBody}`,
          response.status,
          errorBody
        );
      }

      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        throw new GeminiServiceError('Empty response from Gemini.');
      }

      let cleanedText = textContent.trim();
      if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
      if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
      if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
      cleanedText = cleanedText.trim();

      const parsed: GeminiActionPlanResponse = JSON.parse(cleanedText);

      return {
        title: parsed.title || 'Untitled Action Plan',
        summary: parsed.summary || 'No summary available.',
        priority: ['high', 'medium', 'low'].includes(parsed.priority) ? parsed.priority : 'medium',
        clientName: parsed.clientName,
        tasks: Array.isArray(parsed.tasks)
          ? parsed.tasks.map((task, index) => ({
              id: task.id || `task_${index + 1}`,
              text: task.text || 'Unnamed task',
              dueDate: task.dueDate || undefined,
              assignedTo: task.assignedTo || undefined,
            }))
          : [],
      };
    } catch (err: any) {
      if (err instanceof GeminiServiceError && err.statusCode !== 503 && err.statusCode !== 429) {
        throw err;
      }
      lastErrorMsg = err.message || 'Model connection error';
    }
  }

  // Eğer 3 model de 503 dönerse (çok nadir) son çare olarak hata fırlat
  throw new GeminiServiceError(
    'Yapay zeka sunucuları anlık yoğunluk yaşıyor. Lütfen birkaç saniye sonra tekrar deneyin.',
    503,
    lastErrorMsg
    );
}

export function generateDemoActionPlan(): GeminiActionPlanResponse {
  return {
    title: 'Örnek Görüşme Notu',
    summary: 'Müşteri ile yapılan görüşmede teslim tarihleri ve sözleşme şartları ele alındı.',
    priority: 'high',
    tasks: [
      { id: 'task_1', text: 'Sözleşme taslağını incele ve revizeleri ilet' },
      { id: 'task_2', text: 'Müşteriyi yarın 15:00\'te tekrar ara' },
    ],
  };
}