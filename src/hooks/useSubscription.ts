// ============================================================
// VoiceCRM — Subscription & Paywall Hook
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { SubscriptionState, SubscriptionTier } from '../types';
import {
  fetchSubscription,
  updateSubscription,
  canProcessAudioSync,
  incrementDailyUsage,
} from '../services/supabase';
import { purchaseSubscription, restorePurchases, PRODUCTS } from '../services/revenuecat';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    tier: 'free',
    isActive: true,
    dailyUsageCount: 0,
    lastUsageDate: '',
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Oturum açıldığında veya bileşen yüklendiğinde aboneliği yükle
  const loadSub = useCallback(async () => {
    const state = await fetchSubscription();
    setSubscription(state);
    return state;
  }, []);

  useEffect(() => {
    loadSub();
  }, [loadSub]);

  // canProcess kontrolü doğrudan taze kota üzerinden yapılsın:
  const canProcess = useCallback(async (): Promise<boolean> => {
    return await canProcessAudioSync();
  }, []);

  const recordUsage = useCallback(async (): Promise<boolean> => {
    const allowed = await canProcessAudioSync();
    if (!allowed) {
      setShowPaywall(true);
      return false;
    }
    const updated = await incrementDailyUsage();
    setSubscription(updated);
    return true;
  }, []);

  const triggerPaywall = useCallback(() => {
    setShowPaywall(true);
  }, []);

  const dismissPaywall = useCallback(() => {
    setShowPaywall(false);
    setPurchaseError(null);
  }, []);

  const handlePurchase = useCallback(async (productId: string) => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await purchaseSubscription(productId);

      if (result.success) {
        const newState: SubscriptionState = {
          tier: result.tier,
          isActive: true,
          dailyUsageCount: 0,
          lastUsageDate: '',
          trialEndDate: result.tier === 'annual'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        };
        await updateSubscription(newState);
        setSubscription(newState);
        setShowPaywall(false);
      } else {
        setPurchaseError(result.error || 'Satın alma işlemi tamamlanamadı.');
      }
    } catch (error) {
      setPurchaseError(
        error instanceof Error ? error.message : 'Beklenmedik bir hata oluştu.'
      );
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const result = await restorePurchases();
      if (result.success) {
        const newState: SubscriptionState = {
          tier: result.tier,
          isActive: true,
          dailyUsageCount: 0,
          lastUsageDate: '',
        };
        await updateSubscription(newState);
        setSubscription(newState);
        setShowPaywall(false);
      } else {
        setPurchaseError(result.error || 'Geri yüklenecek aktif abonelik bulunamadı.');
      }
    } catch (error) {
      setPurchaseError(
        error instanceof Error ? error.message : 'Geri yükleme başarısız oldu.'
      );
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const upgradeTier = useCallback(async (tier: SubscriptionTier) => {
    const newState: SubscriptionState = {
      tier,
      isActive: true,
      dailyUsageCount: subscription.dailyUsageCount,
      lastUsageDate: subscription.lastUsageDate,
    };
    await updateSubscription(newState);
    setSubscription(newState);
  }, [subscription]);

  const remainingFreeUses = (() => {
    if (subscription.tier !== 'free') return Infinity;
    const today = new Date().toISOString().split('T')[0];
    if (subscription.lastUsageDate !== today) return 1;
    return Math.max(0, 1 - subscription.dailyUsageCount);
  })();

  return {
    subscription,
    showPaywall,
    isPurchasing,
    purchaseError,
    canProcess,
    recordUsage,
    triggerPaywall,
    dismissPaywall,
    handlePurchase,
    handleRestore,
    upgradeTier,
    remainingFreeUses,
    products: PRODUCTS,
    reloadSubscription: loadSub,
  };
}