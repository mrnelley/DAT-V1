export const buildWeeklyTrackerGoalsCard = ({
  baseUrl = '',
  huddleId = 'monday-weekly-tracker-huddle',
  huddleName = 'Monday Morning Weekly Tracker Huddle',
  includeInputs = true,
  includeSubmitAction = true,
  recipientEmail = '',
  version = '1.5',
} = {}) => {
  const weeklyTrackerUrl = `${baseUrl}/weekly-tracker?new=priority`;
  const body = [
    {
      type: 'TextBlock',
      text: 'HDC Compass',
      weight: 'Bolder',
      color: 'Accent',
      size: 'Small',
    },
    {
      type: 'TextBlock',
      text: 'Input your Weekly Tracker goals',
      weight: 'Bolder',
      size: 'Large',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: `Please enter the priorities you plan to advance before ${huddleName}.`,
      wrap: true,
    },
    {
      type: 'FactSet',
      facts: [
        { title: 'Recipient', value: recipientEmail || 'Not assigned' },
        { title: 'Huddle', value: huddleName },
        { title: 'Destination', value: 'Weekly Tracker' },
      ],
    },
  ];

  if (includeInputs) {
    body.push(
      {
        type: 'Input.Text',
        id: 'weeklyPriority1',
        label: 'Weekly Priority 1',
        placeholder: 'What change-the-business work will you move this week?',
        isMultiline: true,
      },
      {
        type: 'Input.Text',
        id: 'weeklyPriority2',
        label: 'Weekly Priority 2',
        placeholder: 'Optional second weekly priority',
        isMultiline: true,
      },
      {
        type: 'Input.Text',
        id: 'supportNeeded',
        label: 'Support or decisions needed',
        placeholder: 'Name any help, decision, or blocker that should be raised in huddle.',
        isMultiline: true,
      },
    );
  }

  const actions = [
    {
      type: 'Action.OpenUrl',
      title: 'Open Weekly Tracker',
      url: weeklyTrackerUrl,
    },
  ];

  if (includeSubmitAction) {
    actions.push({
      type: 'Action.Submit',
      title: 'Submit Goals',
      data: {
        action: 'weeklyTrackerGoals.submit',
        huddleId,
        recipientEmail,
      },
    });
  }

  return {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version,
    body,
    actions,
  };
};

export const buildTeamsWebhookMessage = (card) => ({
  type: 'message',
  attachments: [
    {
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: card,
    },
  ],
});
