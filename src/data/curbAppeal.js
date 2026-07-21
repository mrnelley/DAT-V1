import { users } from './mockData.js';
import { portfolioProperties } from './propertyPortfolio.js';

export const curbAppealChecklistTemplate = {
  id: 'curb-appeal-quarterly',
  title: 'Curb Appeal Checklist',
  cadence: 'Quarterly',
  dueDay: 30,
  dueLabel: 'Due by quarter close',
  schedule: {
    pmPromptDay: 1,
    reminderDay: 15,
    dueDay: 30,
    reviewerPrompt: 'On submission',
    channel: 'Microsoft Teams Adaptive Cards',
  },
  sections: [
    {
      id: 'landscaping',
      title: 'Landscaping',
      items: [
        'Well-maintained lawns, trees, and shrubs.',
        'Regular mowing, trimming, and weeding/snow removal being done.',
        'Seasonal flowers and plants for color and variety.',
        'Mulched beds to keep the soil tidy and retain moisture.',
      ],
    },
    {
      id: 'exterior-maintenance',
      title: 'Exterior Maintenance',
      items: [
        'Fresh looking paint on building exteriors, railings, and doors.',
        'Cleaned and repaired any siding or stucco.',
        'Replace any broken or damaged windows.',
        'Clean and repair gutters and downspouts.',
        'Walkways are free and clear of tripping hazards and look good.',
        'Blinds are in good condition in all resident units.',
      ],
    },
    {
      id: 'lighting',
      title: 'Lighting',
      items: [
        'Adequate outdoor lighting in walkways, entrances, and common areas.',
        'All emergency lighting is functional.',
        'All exterior light fixtures are clean and in working condition.',
      ],
    },
    {
      id: 'entrances-exits',
      title: 'Entrances and Exits',
      items: [
        'Clean and inviting main entrance with well-maintained doors and hardware.',
        'Visible and clearly marked unit numbers.',
        'Secure and functional intercom or access system.',
      ],
    },
    {
      id: 'signage',
      title: 'Signage',
      items: [
        'Clear and professional signage indicating the apartment complex name and address.',
        'Directional signs for parking, office, and amenities.',
      ],
    },
    {
      id: 'parking',
      title: 'Parking Area',
      items: [
        'Well-marked parking spots.',
        'Regular cleaning and sweeping of the parking lot.',
        'Adequate lighting for safety.',
        'Consider landscaping and greenery in parking lot islands.',
      ],
    },
    {
      id: 'amenities',
      title: 'Amenities',
      items: [
        'Clean and well-maintained common areas such as pools, gyms, and lounges.',
        'Arrange outdoor seating and gathering areas with comfortable furniture.',
        'Regular cleaning and inspections of amenities.',
      ],
    },
    {
      id: 'trash-recycling',
      title: 'Trash and Recycling',
      items: [
        'Clearly marked and well-maintained trash and recycling areas.',
        'Regular trash removal to prevent overflow and odors.',
      ],
    },
    {
      id: 'exterior-decor',
      title: 'Exterior Decor',
      items: [
        'Thoughtful use of exterior decorations like hanging plants, outdoor artwork, or seasonal decorations.',
        'Ensure decorations are in good condition and not cluttering the space.',
      ],
    },
    {
      id: 'security-safety',
      title: 'Security and Safety',
      items: [
        'Visible security measures are functioning according to scope.',
        'Clearly marked emergency exits and fire escape routes.',
      ],
    },
    {
      id: 'mailboxes',
      title: 'Mailboxes',
      items: [
        'Well-organized and labeled mailboxes for easy access.',
        'Regular maintenance and cleaning of the mailbox area.',
      ],
    },
    {
      id: 'cleanliness',
      title: 'Overall Cleanliness',
      items: [
        'Regular cleaning of common areas and windows.',
        'Regular pressure washing of exterior surfaces to remove dirt and grime.',
        'Offices are organized and inviting with neat bulletin boards.',
      ],
    },
    {
      id: 'communication',
      title: 'Communication',
      items: [
        'Easily accessible contact information for property management or maintenance issues.',
        'Regular communication with residents about upcoming maintenance or events posted in public areas.',
      ],
    },
  ].map((section) => ({
    ...section,
    items: section.items.map((label, index) => ({
      id: `${section.id}-${index + 1}`,
      label,
    })),
  })),
};

export const curbAppealPropertyManagers = [
  {
    id: 'pm-wendy-smith',
    name: 'Wendy Smith',
    initials: 'WS',
    role: 'Property Manager',
    department: 'Property Management',
    teams: ['Property Management'],
  },
  {
    id: 'pm-carlos-rivera',
    name: 'Carlos Rivera',
    initials: 'CR',
    role: 'Property Manager',
    department: 'Property Management',
    teams: ['Property Management'],
  },
  {
    id: 'pm-tanya-brooks',
    name: 'Tanya Brooks',
    initials: 'TB',
    role: 'Property Manager',
    department: 'Property Management',
    teams: ['Property Management'],
  },
  {
    id: 'pm-lena-park',
    name: 'Lena Park',
    initials: 'LP',
    role: 'Property Manager',
    department: 'Property Management',
    teams: ['Property Management'],
  },
];

const checklistItems = curbAppealChecklistTemplate.sections.flatMap((section) => (
  section.items.map((item) => ({ ...item, sectionId: section.id, sectionTitle: section.title }))
));

const responseFor = (item, property, seed, status) => {
  if (status === 'scheduled') {
    return { itemId: item.id, value: '', comments: '', correctionDate: '' };
  }

  if ((seed + item.id.length) % 11 === 0) {
    return {
      itemId: item.id,
      value: 'needs_correction',
      comments: `${property.propertyName}: follow-up needed for ${item.sectionTitle.toLowerCase()}.`,
      correctionDate: '2026-05-24',
    };
  }

  if ((seed + item.id.length) % 7 === 0) {
    return { itemId: item.id, value: 'na', comments: 'Not applicable for this property this month.', correctionDate: '' };
  }

  return { itemId: item.id, value: 'good', comments: '', correctionDate: '' };
};

const statuses = [
  'approved',
  'submitted_pending_review',
  'needs_follow_up',
  'scheduled',
  'scheduled',
  'approved',
  'submitted_pending_review',
  'scheduled',
];

export const initialCurbAppealSubmissions = portfolioProperties.map((property, index) => {
  const status = statuses[index % statuses.length];
  const propertyManager = curbAppealPropertyManagers[index % curbAppealPropertyManagers.length];
  const submittedAt = ['submitted_pending_review', 'needs_follow_up', 'approved'].includes(status) ? '2026-05-12T09:18:00' : null;
  const reviewedAt = status === 'approved' ? '2026-05-12T10:04:00' : null;

  return {
    id: `curb-2026-q2-${property.id}`,
    checklistTemplateId: curbAppealChecklistTemplate.id,
    reportingPeriodId: '2026-Q2',
    dueDate: '2026-06-30',
    scheduledPromptDate: '2026-04-01',
    reminderDate: '2026-06-15',
    propertyId: property.id,
    propertyName: property.propertyName,
    propertyAddress: property.address,
    propertyManager,
    reviewer: users[3],
    status,
    submittedAt,
    reviewedAt,
    creditedAt: status === 'approved' ? reviewedAt : null,
    reviewNote: status === 'needs_follow_up' ? 'Please add correction timing for exterior maintenance and lighting before approval.' : '',
    responses: checklistItems.map((item) => responseFor(item, property, index, status)),
  };
});

export const curbAppealStatusLabels = {
  scheduled: 'Prompt Scheduled',
  draft: 'Draft',
  submitted_pending_review: 'Pending Jaime Review',
  needs_follow_up: 'Needs Follow-up',
  approved: 'Approved and Credited',
};

export const curbAppealStatusColors = {
  scheduled: 'default',
  draft: 'warning',
  submitted_pending_review: 'warning',
  needs_follow_up: 'error',
  approved: 'success',
};
