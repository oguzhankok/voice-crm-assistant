// ============================================================
// VoiceCRM — Action Plans State Hook
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveLocalAudio } from '../utils/localAudioStorage';
import { ActionPlan, Task, GeminiActionPlanResponse } from '../types';
import {
  fetchActionPlans,
  insertActionPlan,
  updateActionPlan,
  deleteActionPlan as deleteFromStorage,
} from '../services/supabase'; // Tamamen senin hazırladığın servisi kullanıyor

export function useActionPlans() {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verileri bulut servisinden çekme fonksiyonu
  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    const stored = await fetchActionPlans();
    setPlans(stored);
    setIsLoading(false);
  }, []);
  const clearPlans = useCallback(() => {
    setPlans([]);
  }, []);

  // Mount anında yükle
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  /**
   * Create a new ActionPlan from a Gemini API response
   */
  /**
   * Create a new ActionPlan from a Gemini API response
   */
  const createFromGeminiResponse = useCallback(
    async (response: GeminiActionPlanResponse, audioBlob?: Blob): Promise<ActionPlan> => {
      const planId = uuidv4();
      let audioUri: string | undefined = undefined;

      // Sesi cihaz hafızasına kaydet ve kartta anında çalabilmesi için URL üret
      if (audioBlob) {
        await saveLocalAudio(planId, audioBlob);
        audioUri = URL.createObjectURL(audioBlob);
      }

      const newPlan: ActionPlan = {
        id: planId,
        title: response.title,
        summary: response.summary,
        clientName: response.clientName,
        priority: response.priority,
        tasks: response.tasks.map((t) => ({
          id: t.id || uuidv4(),
          text: t.text,
          dueDate: t.dueDate,
          assignedTo: t.assignedTo,
          completed: false,
        })),
        createdAt: new Date().toISOString(),
        audioUri,
      };

      // Arayüze anında yansıt
      setPlans((prev) => [newPlan, ...prev]);
      // Buluta kaydet
      await insertActionPlan(newPlan);
      
      return newPlan;
    },
    []
  );

  /**
   * Toggle a task's completed status
   */
  const toggleTask = useCallback((planId: string, taskId: string) => {
    setPlans((prev) => {
      const updated = prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          tasks: plan.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      });

      const updatedPlan = updated.find((p) => p.id === planId);
      if (updatedPlan) updateActionPlan(updatedPlan);

      return updated;
    });
  }, []);

  /**
   * Delete an action plan
   */
  const deletePlan = useCallback((planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    deleteFromStorage(planId);
  }, []);

  /**
   * Update a task within a plan
   */
  const updateTask = useCallback((planId: string, updatedTask: Task) => {
    setPlans((prev) => {
      const updated = prev.map((plan) => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          tasks: plan.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
        };
      });

      const updatedPlan = updated.find((p) => p.id === planId);
      if (updatedPlan) updateActionPlan(updatedPlan);

      return updated;
    });
  }, []);

  /**
   * Get plans filtered by priority
   */
  const getPlansByPriority = useCallback(
    (priority: 'high' | 'medium' | 'low') => {
      return plans.filter((p) => p.priority === priority);
    },
    [plans]
  );

  /**
   * Get completion percentage for a plan
   */
  const getCompletionPercentage = useCallback((plan: ActionPlan): number => {
    if (!plan.tasks || plan.tasks.length === 0) return 100;
    const completed = plan.tasks.filter((t) => t.completed).length;
    return Math.round((completed / plan.tasks.length) * 100);
  }, []);

  return {
    plans,
    isLoading,
    createFromGeminiResponse,
    toggleTask,
    deletePlan,
    updateTask,
    getPlansByPriority,
    getCompletionPercentage,
    refreshPlans: loadPlans,
    clearPlans, 
  };
}