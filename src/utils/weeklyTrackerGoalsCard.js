export const weeklyTrackerGoalsRecipientEmail = 'pkelley@hdcweb.org';

export const buildWeeklyTrackerGoalsCard = ({
  baseUrl = '',
  huddleId = 'monday-weekly-tracker-huddle',
  huddleName = 'Monday Morning Weekly Tracker Huddle',
  recipientEmail = weeklyTrackerGoalsRecipientEmail,
} = {}) => {
  const weeklyTrackerUrl = `${baseUrl}/weekly-tracker?new=priority`;

  return {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
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
          { title: 'Recipient', value: recipientEmail },
          { title: 'Huddle', value: huddleName },
          { title: 'Destination', value: 'Weekly Tracker' },
        ],
      },
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
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Open Weekly Tracker',
        url: weeklyTrackerUrl,
      },
      {
        type: 'Action.Submit',
        title: 'Submit Goals',
        data: {
          action: 'weeklyTrackerGoals.submit',
          huddleId,
          recipientEmail,
        },
      },
    ],
  };
};
