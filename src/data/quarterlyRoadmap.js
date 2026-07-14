const statusOptions = ['Steady', 'Watch', 'Alert', 'Complete', 'Rolled Into Next Quarter', 'Adopted Into Next Quarter', 'Paused'];

const quarterThemes = {
  '2026-Q2': 'Choose Your Hard',
  '2026-Q3': 'Elevate & Accelerate',
};

const toIsoDate = (date) => date.toISOString().slice(0, 10);

export const getQuarterMeta = (date = new Date()) => {
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  const year = date.getFullYear();
  const start = new Date(year, (quarter - 1) * 3, 1);
  const end = new Date(year, quarter * 3, 0);
  const key = `${year}-Q${quarter}`;

  return {
    end: toIsoDate(end),
    id: key.toLowerCase(),
    key,
    quarter: `Q${quarter} ${year}`,
    quarterNumber: quarter,
    start: toIsoDate(start),
    statusOptions,
    theme: quarterThemes[key] || 'Quarterly operating plan',
    year,
  };
};

export const getQuarterTransitionState = (date = new Date()) => {
  const meta = getQuarterMeta(date);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const start = new Date(`${meta.start}T00:00:00`);
  const end = new Date(`${meta.end}T00:00:00`);
  const daysUntilEnd = Math.ceil((end - today) / 86400000);
  const daysSinceStart = Math.floor((today - start) / 86400000);

  if (daysUntilEnd >= 0 && daysUntilEnd <= 14) {
    return {
      label: 'Quarter close',
      mode: 'closing',
      guidance: 'Wrap up current priorities, mark carry-forward work, and prepare the next quarter plan.',
    };
  }

  if (daysSinceStart >= 0 && daysSinceStart <= 10) {
    return {
      label: 'Quarter setup',
      mode: 'setting',
      guidance: 'ELT should stage Enterprise Priorities and OLT can draft weekly priorities against the available plan.',
    };
  }

  return {
    label: 'Active quarter',
    mode: 'active',
    guidance: 'Teams can update priorities, workplans, weekly tasks, and stucks normally.',
  };
};

export const activeRoadmap = getQuarterMeta();
