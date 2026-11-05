// ============================================================
// VoiceCRM — Supabase Database & Auth Service
// ============================================================

import { ActionPlan, SubscriptionState } from '../types';
import { supabase } from '../utils/supabaseClient';

const STORAGE_KEYS = {
  SUBSCRIPTION: 'voicecrm_subscription',
  API_KEY: 'voicecrm_gemini_api_key',
  WEBHOOK_URL: 'voicecrm_webhook_url',
} as const;

// ---- AUTH FONKSİYONLARI ----

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    localStorage.removeItem(getSubKey(user.id));
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
/**
 * Google ile Tek Tıkla Giriş / Kayıt
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Kullanıcının Hesabını ve Tüm Verilerini Kalıcı Olarak Siler
 */
export async function deleteCurrentUserAccount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Oturum bulunamadı.');

  // 1. Supabase SQL fonksiyonunu çağırarak auth.users ve ilişkili tüm tabloları sil
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;

  // 2. Yerel oturum ve abonelik önbelleğini temizle
  localStorage.removeItem(`voicecrm_sub_${user.id}`);
  await supabase.auth.signOut();
}

// ---- Action Plans Bulut CRUD (Supabase) ----

/**
 * Fetch all action plans for the authenticated user.
 */
export async function fetchActionPlans(): Promise<ActionPlan[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return []; // Oturum yoksa doğrudan boş liste dön

    const { data, error } = await supabase
      .from('action_plans')
      .select('*')
      .eq('user_id', user.id) // Güvenlik katmanı: doğrudan kullanıcının ID'sini şart koş
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      clientName: row.client_name,
      priority: row.priority,
      tasks: row.tasks || [],
      createdAt: row.created_at,
    }));
  } catch (err: any) {
    console.error('Error fetching from Supabase:', err.message);
    return [];
  }
}

/**
 * Insert a new action plan into Supabase with active user_id.
 */
export async function insertActionPlan(plan: ActionPlan): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Oturum açık değil, kayıt yerelde tutuldu ancak buluta eklenemedi.');
      return;
    }

    const { error } = await supabase
      .from('action_plans')
      .insert([
        {
          id: plan.id,
          user_id: user.id, // RLS kuralını karşılayan kritik alan
          title: plan.title,
          summary: plan.summary,
          client_name: plan.clientName,
          priority: plan.priority,
          tasks: plan.tasks,
        }
      ]);
    if (error) throw error;
  } catch (err: any) {
    console.error('Error inserting to Supabase:', err.message);
  }
}

/**
 * Update an existing action plan in Supabase.
 */
export async function updateActionPlan(updatedPlan: ActionPlan): Promise<void> {
  try {
    const { error } = await supabase
      .from('action_plans')
      .update({
        title: updatedPlan.title,
        summary: updatedPlan.summary,
        client_name: updatedPlan.clientName,
        priority: updatedPlan.priority,
        tasks: updatedPlan.tasks,
        updated_at: new Date().toISOString()
      })
      .eq('id', updatedPlan.id);
    if (error) throw error;
  } catch (err: any) {
    console.error('Error updating Supabase:', err.message);
  }
}

/**
 * Delete an action plan by ID from Supabase.
 */
export async function deleteActionPlan(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('action_plans')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err: any) {
    console.error('Error deleting from Supabase:', err.message);
  }
}

// ---- Subscription & Profile State (Kullanıcı Bazlı İzolasyon) ----

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  tier: 'free',
  isActive: true,
  dailyUsageCount: 0,
  lastUsageDate: '',
  trialEndDate: undefined,
};

function getSubKey(userId: string): string {
  return `voicecrm_sub_${userId}`;
}

export async function fetchSubscription(): Promise<SubscriptionState> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ...DEFAULT_SUBSCRIPTION };

    const userKey = getSubKey(user.id);

    // 1. Supabase'den güncel profil ve kota bilgisini çek
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data && !error) {
      const cloudState: SubscriptionState = {
        tier: (data.tier as any) || 'free',
        isActive: true,
        dailyUsageCount: data.daily_usage_count ?? 0,
        lastUsageDate: data.last_usage_date || '',
        trialEndDate: data.trial_end_date || undefined,
      };
      localStorage.setItem(userKey, JSON.stringify(cloudState));
      return cloudState;
    }

    // 2. Profil yoksa yeni Free profil oluştur
    const initialProfile = {
      id: user.id,
      tier: 'free',
      daily_usage_count: 0,
      last_usage_date: '',
      updated_at: new Date().toISOString(),
    };
    await supabase.from('user_profiles').upsert(initialProfile);

    localStorage.setItem(userKey, JSON.stringify(DEFAULT_SUBSCRIPTION));
    return { ...DEFAULT_SUBSCRIPTION };
  } catch (err) {
    console.warn('Abonelik yükleme hatası:', err);
    return { ...DEFAULT_SUBSCRIPTION };
  }
}

export async function updateSubscription(state: SubscriptionState): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    localStorage.setItem(getSubKey(user.id), JSON.stringify(state));

    await supabase.from('user_profiles').upsert({
      id: user.id,
      tier: state.tier,
      daily_usage_count: state.dailyUsageCount,
      last_usage_date: state.lastUsageDate,
      trial_end_date: state.trialEndDate,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Abonelik kaydedilemedi:', err);
  }
}

export async function incrementDailyUsage(): Promise<SubscriptionState> {
  const { data: { user } } = await supabase.auth.getUser();
  const state = await fetchSubscription();
  const today = new Date().toISOString().split('T')[0];

  if (state.lastUsageDate !== today) {
    state.dailyUsageCount = 1;
    state.lastUsageDate = today;
  } else {
    state.dailyUsageCount += 1;
  }

  if (user) {
    await updateSubscription(state);
  }
  return state;
}

export async function canProcessAudioSync(): Promise<boolean> {
  const state = await fetchSubscription();
  if (state.tier !== 'free') return true;

  const today = new Date().toISOString().split('T')[0];
  if (state.lastUsageDate !== today) return true;

  return state.dailyUsageCount < 1;
}
// ---- Settings ----

export function getApiKey(): string {
  // Öncelik .env dosyasındaki genel anahtardadır
  return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('voicecrm_gemini_api_key') || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
}

export function getWebhookUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.WEBHOOK_URL) || '';
}

export function setWebhookUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.WEBHOOK_URL, url.trim());
}