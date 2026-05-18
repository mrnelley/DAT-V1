export const statusColorMap = {
  on_track: 'success.main',
  at_risk: 'warning.main',
  off_track: 'error.main',
  complete: 'success.main',
  no_data: 'text.secondary',
  neutral: 'primary.main',
};

export const statusLabels = {
  on_track: 'Steady',
  at_risk: 'Watch',
  off_track: 'Alert',
  complete: 'Completed',
  no_data: 'No Data',
  neutral: 'Neutral',
};

export const getStatusFromPercent = (percent) => {
  if (percent >= 80) return 'on_track';
  if (percent >= 50) return 'at_risk';
  return 'off_track';
};

export const getGaugeStatus = (value, yellow, green) => {
  if (value >= green) return 'on_track';
  if (value >= yellow) return 'at_risk';
  return 'off_track';
};
