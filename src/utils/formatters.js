export const formatPercent = (value) => `${Math.round(value)}%`;

export const formatCompact = (value) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }).format(new Date(value));

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
