// ============================================================
// VoiceCRM — Core Type Definitions
// ============================================================

export interface Task {
  id: string;
  text: string;
  dueDate?: string;
  assignedTo?: string;
  completed: boolean;
}

export interface ActionPlan {
  id: string;
  title: string;
  summary: string;
  clientName?: string;
  priority: 'high' | 'medium' | 'low';
  tasks: Task[];
  createdAt: string;
  audioUri?: string;
}

export interface GeminiActionPlanResponse {
  title: string;
  summary: string;
  clientName?: string;
  priority: 'high' | 'medium' | 'low';
  tasks: Array<{
    id: string;
    text: string;
    dueDate?: string;
    assignedTo?: string;
  }>;
}

export type SubscriptionTier = 'free' | 'monthly' | 'annual';

export interface SubscriptionState {
  tier: SubscriptionTier;
  isActive: boolean;
  dailyUsageCount: number;
  lastUsageDate: string;
  trialEndDate?: string;
}

export interface RecordingState {
  isRecording: boolean;
  recordingDuration: number;
  audioUri: string | null;
  audioBlob: Blob | null;
  permissionGranted: boolean;
  permissionDenied: boolean;
}

export type AppScreen = 'home' | 'plans' | 'settings';

export interface WebhookPayload {
  actionPlanId: string;
  title: string;
  summary: string;
  clientName?: string;
  priority: string;
  tasks: Task[];
  sentAt: string;
  source: 'VoiceCRM';
}
