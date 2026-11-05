// ============================================================
// VoiceCRM — RevenueCat Integration Service
// ============================================================

import { SubscriptionTier } from '../types';

export const PRODUCTS = {
  MONTHLY: {
    id: 'voicecrm_pro_monthly',
    title: 'Pro Monthly',
    price: '$3.99', // Eski: $9.99
    period: 'month',
    description: 'Billed monthly. Cancel anytime.',
  },
  ANNUAL: {
    id: 'voicecrm_pro_annual',
    title: 'Pro Annual',
    price: '$24.99', // Eski: $59.99
    period: 'year',
    monthlyEquivalent: '$2.08/mo', // Eski: $4.99/mo
    description: 'Billed annually. 7-day free trial included.',
  },
} as const;

export interface PurchaseResult {
  success: boolean;
  tier: SubscriptionTier;
  expiresAt?: string;
  error?: string;
}

/**
 * RevenueCat SDK Başlatıcı (Capacitor mobil çıktısında aktifleşir)
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  console.log(`[RevenueCat] SDK Hazırlandı. Kullanıcı: ${userId || 'Anonim'}`);
  // Mobilde: Purchases.configure({ apiKey: '...', appUserID: userId });
}

/**
 * Abonelik Satın Alma
 */
export async function purchaseSubscription(
  productId: string,
  _userId?: string
): Promise<PurchaseResult> {
  console.log(`[RevenueCat] Satın alma başlatıldı: ${productId}`);

  // Simülasyon: Satın alma başarılı kabul edilir (Canlı mobilde Google/Apple modalı açılır)
  const tier: SubscriptionTier = productId.includes('annual') ? 'annual' : 'monthly';
  const expiresAt = new Date();
  if (tier === 'annual') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  return {
    success: true,
    tier,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Satın Alımları Geri Yükle (Restore)
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  console.log('[RevenueCat] Satın alımlar geri yükleniyor...');
  return {
    success: false,
    tier: 'free',
    error: 'Aktif bir abonelik bulunamadı.',
  };
}