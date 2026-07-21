const periodThemes = {
  '2026-Q2': 'Choose Your Hard',
  '2026-Q3': 'Elevate & Accelerate',
};

const toIsoDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const buildReportingPeriod = (year, quarterNumber) => {
  const id = `${year}-Q${quarterNumber}`;
  const start = new Date(year, (quarterNumber - 1) * 3, 1);
  const end = new Date(year, quarterNumber * 3, 0);

  return {
    code: `Q${quarterNumber}-${year}`,
    end: toIsoDate(end),
    id,
    label: `Q${quarterNumber} ${year}`,
    quarterNumber,
    start: toIsoDate(start),
    theme: periodThemes[id] || 'Quarterly operating plan',
    year,
  };
};

const baseReportingPeriods = Array.from({ length: 4 }, (_, yearIndex) => 2025 + yearIndex)
  .flatMap((year) => Array.from({ length: 4 }, (_, quarterIndex) => (
    buildReportingPeriod(year, quarterIndex + 1)
  )));

export const getCurrentReportingPeriodId = (date = new Date()) => (
  `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
);

export const getReportingPeriodPhase = (period, date = new Date()) => {
  const today = toIsoDate(date);
  if (period.end < today) return 'closed';
  if (period.start > today) return 'planning';
  return 'current';
};

export const reportingPeriods = baseReportingPeriods.map((period) => ({
  ...period,
  phase: getReportingPeriodPhase(period),
}));

const reportingPeriodsById = new Map(reportingPeriods.map((period) => [period.id, period]));

const parseReportingPeriodId = (value) => {
  const source = String(value || '').trim();
  if (!source) return null;

  const yearFirst = source.match(/^(\d{4})[\s-]*Q([1-4])$/i);
  if (yearFirst) return `${yearFirst[1]}-Q${yearFirst[2]}`;

  const quarterFirst = source.match(/^Q([1-4])[\s-]*(\d{4})$/i);
  if (quarterFirst) return `${quarterFirst[2]}-Q${quarterFirst[1]}`;

  return null;
};

export const normalizeReportingPeriodId = (value, fallbackId = getCurrentReportingPeriodId()) => {
  const source = typeof value === 'object' && value
    ? value.reportingPeriodId || value.period || value.quarter || value.id
    : value;
  const parsedId = parseReportingPeriodId(source);

  if (parsedId && reportingPeriodsById.has(parsedId)) return parsedId;
  if (reportingPeriodsById.has(fallbackId)) return fallbackId;
  return reportingPeriods[0].id;
};

export const getReportingPeriod = (value, fallbackId = getCurrentReportingPeriodId()) => (
  reportingPeriodsById.get(normalizeReportingPeriodId(value, fallbackId))
);

export const getPreviousReportingPeriod = (value) => {
  const reportingPeriodId = normalizeReportingPeriodId(value);
  const index = reportingPeriods.findIndex((period) => period.id === reportingPeriodId);
  return index > 0 ? reportingPeriods[index - 1] : null;
};

export const getReportingPeriodMonths = (value) => {
  const period = getReportingPeriod(value);
  return Array.from({ length: 3 }, (_, index) => new Date(
    period.year,
    (period.quarterNumber - 1) * 3 + index,
    1,
  ).toLocaleDateString('en-US', { month: 'long' }));
};

export const normalizeReportingPeriodRecord = (record, fallbackId = getCurrentReportingPeriodId()) => {
  const reportingPeriodId = normalizeReportingPeriodId(record, fallbackId);
  const normalized = { ...record, reportingPeriodId };
  delete normalized.period;
  delete normalized.quarter;

  return normalized;
};

export const recordMatchesReportingPeriod = (record, reportingPeriodId) => (
  normalizeReportingPeriodId(record) === normalizeReportingPeriodId(reportingPeriodId)
);
