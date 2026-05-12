import { curbAppealStatusLabels, initialCurbAppealSubmissions } from '../../src/data/curbAppeal.js';

const getBaseUrl = (request) => (
  process.env.COMPASS_PUBLIC_URL
  || `https://${request.headers.host}`
);

const formatDate = (date) => (
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
);

const buildCard = (submission, baseUrl) => {
  const checklistUrl = `${baseUrl}/curb-appeal/${submission.id}`;

  return {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: 'Compass Quarterly Commitment',
        weight: 'Bolder',
        color: 'Accent',
        size: 'Small',
      },
      {
        type: 'TextBlock',
        text: 'Curb Appeal Checklist',
        weight: 'Bolder',
        size: 'Large',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Please complete the curb appeal checklist for your property before quarter close.',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Property', value: submission.propertyName },
          { title: 'Quarter', value: submission.quarter },
          { title: 'Due Date', value: formatDate(submission.dueDate) },
          { title: 'Property Manager', value: submission.propertyManager.name },
          { title: 'Reviewer', value: submission.reviewer.name },
          { title: 'Status', value: curbAppealStatusLabels[submission.status] || submission.status },
        ],
      },
      {
        type: 'TextBlock',
        text: 'After you submit, Jaime will review the checklist before it is credited toward the quarterly portfolio completion priority.',
        wrap: true,
        spacing: 'Medium',
        isSubtle: true,
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Open Checklist',
        url: checklistUrl,
      },
    ],
  };
};

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const submissionId = url.searchParams.get('submissionId') || 'curb-2026-q2-duke-manor';
  const format = url.searchParams.get('format');
  const submission = initialCurbAppealSubmissions.find((item) => item.id === submissionId);

  if (!submission) {
    response.status(404).json({
      error: 'Submission not found',
      availableSubmissionIds: initialCurbAppealSubmissions.map((item) => item.id),
    });
    return;
  }

  const baseUrl = getBaseUrl(request);
  const card = buildCard(submission, baseUrl);

  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (format === 'card') {
    response.status(200).json(card);
    return;
  }

  response.status(200).json({
    card,
    checklistUrl: `${baseUrl}/curb-appeal/${submission.id}`,
    submission,
  });
}
