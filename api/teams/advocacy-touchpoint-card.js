const getBaseUrl = (request) => (
  process.env.COMPASS_PUBLIC_URL
  || `https://${request.headers.host}`
);

const cardSeed = {
  changedBy: 'Nina',
  id: 'touch-lha-20260617',
  nextStep: 'Send coalition debrief and confirm June convening role.',
  partnerId: 'partner-lancaster-housing-alliance',
  partnerName: 'Lancaster Housing Alliance',
  targetDate: 'Jun 28, 2026',
  touchDate: 'Jun 17, 2026',
};

const buildCard = (baseUrl) => ({
  $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.5',
  body: [
    {
      type: 'TextBlock',
      text: 'HDC Compass Advocacy',
      weight: 'Bolder',
      color: 'Accent',
      size: 'Small',
    },
    {
      type: 'TextBlock',
      text: 'Advocacy touchpoint updated',
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
    },
    {
      type: 'FactSet',
      facts: [
        { title: 'Partner', value: cardSeed.partnerName },
        { title: 'Touch date', value: cardSeed.touchDate },
        { title: 'Next step', value: cardSeed.nextStep },
        { title: 'Target date', value: cardSeed.targetDate },
        { title: 'Changed by', value: cardSeed.changedBy },
      ],
    },
    {
      type: 'TextBlock',
      text: 'This card is generated from the advocacy activity log. Relationship stewardship remains in Salesforce.',
      wrap: true,
      spacing: 'Medium',
      isSubtle: true,
    },
  ],
  actions: [
    {
      type: 'Action.OpenUrl',
      title: 'Open Partner Profile',
      url: `${baseUrl}/dashboard/me#${cardSeed.partnerId}`,
    },
    {
      type: 'Action.OpenUrl',
      title: 'Open Dana Calendar',
      url: `${baseUrl}/dashboard/me?calendar=1`,
    },
  ],
});

export default function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const format = url.searchParams.get('format');
  const baseUrl = getBaseUrl(request);
  const card = buildCard(baseUrl);

  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (format === 'card') {
    response.status(200).json(card);
    return;
  }

  response.status(200).json({
    card,
    source: cardSeed,
  });
}
