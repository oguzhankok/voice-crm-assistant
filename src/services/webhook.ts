// ============================================================
// VoiceCRM — Webhook Service
// Prepares and sends JSON payloads for external integrations
// ============================================================
import { getWebhookUrl } from './supabase';
import { ActionPlan, WebhookPayload } from '../types';

/**
 * Prepare a webhook payload from an ActionPlan
 */
export function prepareWebhookPayload(plan: ActionPlan): WebhookPayload {
  return {
    actionPlanId: plan.id,
    title: plan.title,
    summary: plan.summary,
    clientName: plan.clientName,
    priority: plan.priority,
    tasks: plan.tasks,
    sentAt: new Date().toISOString(),
    source: 'VoiceCRM',
  };
}

/**
 * Send a webhook payload to an external endpoint.
 * Supports Trello, Slack, Google Sheets, or any custom webhook.
 */
export async function sendToWebhook(
  payload: WebhookPayload
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getWebhookUrl();

  if (!webhookUrl || webhookUrl.trim() === '') {
    return {
      success: false,
      message: 'No webhook URL configured. Set one in Settings.',
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        // 'application/json' yerine 'text/plain' kullanarak tarayıcının 
        // CORS OPTIONS (Preflight) engeline takılmasını önlüyoruz.
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Payload sent successfully!',
      };
    } else {
      return {
        success: false,
        message: `Webhook returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to send webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Format payload as a Slack-compatible message
 */
export function formatForSlack(payload: WebhookPayload): object {
  const priorityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  const taskList = payload.tasks
    .map(
      (t, i) =>
        `${i + 1}. ${t.text}${t.dueDate ? ` (Due: ${t.dueDate})` : ''}${
          t.assignedTo ? ` → ${t.assignedTo}` : ''
        }`
    )
    .join('\n');

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${priorityEmoji[payload.priority as keyof typeof priorityEmoji]} ${payload.title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Summary:* ${payload.summary}\n${
            payload.clientName ? `*Client:* ${payload.clientName}\n` : ''
          }*Priority:* ${payload.priority.toUpperCase()}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Tasks:*\n${taskList}`,
        },
      },
    ],
  };
}

/**
 * Format payload for Trello card creation
 */
export function formatForTrello(payload: WebhookPayload): object {
  const description = [
    `**Summary:** ${payload.summary}`,
    payload.clientName ? `**Client:** ${payload.clientName}` : '',
    `**Priority:** ${payload.priority.toUpperCase()}`,
    '',
    '**Tasks:**',
    ...payload.tasks.map(
      (t, i) =>
        `- [ ] ${i + 1}. ${t.text}${t.dueDate ? ` (Due: ${t.dueDate})` : ''}${
          t.assignedTo ? ` → ${t.assignedTo}` : ''
        }`
    ),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    name: payload.title,
    desc: description,
    pos: 'top',
  };
}
