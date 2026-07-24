import {
  buildTeamsWebhookMessage,
  buildWeeklyTrackerGoalsCard,
} from '../../src/utils/weeklyTrackerGoalsCard.js';

const getBaseUrl = (request) => (
  process.env.COMPASS_PUBLIC_URL
  || `https://${request.headers.host}`
);

const getWebhookUrl = () => (
  process.env.TEAMS_WEEKLY_GOALS_WEBHOOK_URL
  || process.env.TEAMS_WEBHOOK_URL
);

const readJsonBody = async (request) => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
  if (typeof request.on !== 'function') return {};

  return new Promise((resolve, reject) => {
    let rawBody = '';
    request.on('data', (chunk) => {
      rawBody += chunk;
    });
    request.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
};

const createCard = ({ baseUrl, huddleId, huddleName, recipientEmail, webhookSafe = false }) => buildWeeklyTrackerGoalsCard({
  baseUrl,
  huddleId,
  huddleName,
  includeInputs: !webhookSafe,
  includeSubmitAction: !webhookSafe,
  recipientEmail,
  version: webhookSafe ? '1.4' : '1.5',
});

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const format = url.searchParams.get('format');
  const baseUrl = getBaseUrl(request);

  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (!['GET', 'POST'].includes(request.method)) {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = request.method === 'POST' ? await readJsonBody(request) : {};
  const recipientEmail = body.recipientEmail || url.searchParams.get('recipient') || '';
  const huddleId = body.huddleId || url.searchParams.get('huddleId') || 'monday-weekly-tracker-huddle';
  const huddleName = body.huddleName || url.searchParams.get('huddleName') || 'Monday Morning Weekly Tracker Huddle';

  if (request.method === 'POST' && !recipientEmail) {
    response.status(400).json({ error: 'A prompt recipient is required.' });
    return;
  }
  const card = createCard({
    baseUrl,
    huddleId,
    huddleName,
    recipientEmail,
    webhookSafe: request.method === 'POST' || format === 'teams-webhook',
  });
  const teamsMessage = buildTeamsWebhookMessage(card);

  if (format === 'teams-webhook') {
    response.status(200).json(teamsMessage);
    return;
  }

  if (format === 'card') {
    response.status(200).json(card);
    return;
  }

  if (request.method === 'POST') {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      response.status(503).json({
        error: 'Teams webhook URL is not configured. Add TEAMS_WEEKLY_GOALS_WEBHOOK_URL in Vercel Environment Variables.',
        requiredEnvVar: 'TEAMS_WEEKLY_GOALS_WEBHOOK_URL',
      });
      return;
    }

    const teamsResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsMessage),
    });
    const teamsBody = await teamsResponse.text();

    if (!teamsResponse.ok) {
      response.status(502).json({
        error: 'Teams webhook rejected the Adaptive Card request.',
        status: teamsResponse.status,
        teamsBody,
      });
      return;
    }

    response.status(200).json({
      card,
      delivery: {
        channel: 'teams_webhook',
        mode: 'teams_webhook_sent',
        recipientEmail,
        teamsStatus: teamsResponse.status,
      },
    });
    return;
  }

  response.status(200).json({
    card,
    delivery: {
      channel: 'teams_adaptive_card',
      mode: 'payload_ready',
      recipientEmail,
    },
  });
}
