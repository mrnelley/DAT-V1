let reportingPeriodCatalog = [];

export const setReportingPeriodCatalog = (periods) => {
  reportingPeriodCatalog = [...(periods || [])].sort((a, b) => a.start.localeCompare(b.start));
};

export const getReportingPeriodCatalog = () => reportingPeriodCatalog;

export const getCurrentReportingPeriodId = (date = new Date()) => (
  `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
);

const parseReportingPeriodId = (value) => {
  const source = String(value || '').trim();
  if (!source) return null;
  const yearFirst = source.match(/^(\d{4})[\s-]*Q([1-4])$/i);
  if (yearFirst) return `${yearFirst[1]}-Q${yearFirst[2]}`;
  const quarterFirst = source.match(/^Q([1-4])[\s-]*(\d{4})$/i);
  return quarterFirst ? `${quarterFirst[2]}-Q${quarterFirst[1]}` : null;
};

export const normalizeReportingPeriodId = (value, fallbackId = getCurrentReportingPeriodId()) => {
  const source = typeof value === 'object' && value
    ? value.reportingPeriodId || value.code || value.period || value.quarter || value.id
    : value;
  const parsedId = parseReportingPeriodId(source);
  const catalogIds = new Set(reportingPeriodCatalog.map((period) => period.id));

  if (parsedId && (!catalogIds.size || catalogIds.has(parsedId))) return parsedId;
  if (catalogIds.has(fallbackId)) return fallbackId;
  return reportingPeriodCatalog.at(-1)?.id || parsedId || fallbackId;
};

export const getReportingPeriod = (value, fallbackId = getCurrentReportingPeriodId()) => {
  if (typeof value === 'object' && value?.start && value?.end) return value;
  const id = normalizeReportingPeriodId(value, fallbackId);
  return reportingPeriodCatalog.find((period) => period.id === id) || null;
};

export const getPreviousReportingPeriod = (value) => {
  const reportingPeriodId = normalizeReportingPeriodId(value);
  const index = reportingPeriodCatalog.findIndex((period) => period.id === reportingPeriodId);
  return index > 0 ? reportingPeriodCatalog[index - 1] : null;
};

export const getReportingPeriodMonths = (value) => {
  const period = getReportingPeriod(value);
  if (!period) return ['Month 1', 'Month 2', 'Month 3'];
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
