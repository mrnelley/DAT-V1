import { getReportingPeriod } from './reportingPeriods';

export const roadmapStatusOptions = ['Steady', 'Watch', 'Alert', 'Complete', 'Rolled Into Next Quarter', 'Adopted Into Next Quarter', 'Paused'];

export const getQuarterMeta = (date = new Date()) => {
  const period = getReportingPeriod(`${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`);

  return {
    ...period,
    key: period.id,
    statusOptions: roadmapStatusOptions,
  };
};

export const getQuarterTransitionState = (periodOrDate = new Date(), referenceDate = new Date()) => {
  const meta = periodOrDate instanceof Date
    ? getQuarterMeta(periodOrDate)
    : getReportingPeriod(periodOrDate);
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const start = new Date(`${meta.start}T00:00:00`);
  const end = new Date(`${meta.end}T00:00:00`);
  const daysUntilEnd = Math.ceil((end - today) / 86400000);
  const daysSinceStart = Math.floor((today - start) / 86400000);

  if (daysUntilEnd < 0) {
    return {
      label: 'Quarter closed',
      mode: 'closed',
      guidance: 'Review final results and carry-forward decisions from this completed reporting period.',
    };
  }

  if (daysSinceStart < 0) {
    return {
      label: 'Planning period',
      mode: 'planning',
      guidance: 'Stage priorities, targets, and ownership before this reporting period begins.',
    };
  }

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
