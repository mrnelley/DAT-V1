import { buildWeeklyTrackerGoalsCard, weeklyTrackerGoalsRecipientEmail } from '../../src/utils/weeklyTrackerGoalsCard.js';

const getBaseUrl = (request) => (
  process.env.COMPASS_PUBLIC_URL
  || `https://${request.headers.host}`
);

export default function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const recipientEmail = url.searchParams.get('recipient') || weeklyTrackerGoalsRecipientEmail;
  const huddleId = url.searchParams.get('huddleId') || 'monday-weekly-tracker-huddle';
  const huddleName = url.searchParams.get('huddleName') || 'Monday Morning Weekly Tracker Huddle';
  const format = url.searchParams.get('format');
  const baseUrl = getBaseUrl(request);
  const card = buildWeeklyTrackerGoalsCard({
    baseUrl,
    huddleId,
    huddleName,
    recipientEmail,
  });

  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (format === 'card') {
    response.status(200).json(card);
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
