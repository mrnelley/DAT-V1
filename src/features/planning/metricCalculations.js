// Reusable arithmetic only. Definitions, populations and approvals are separate records.
const finite = value => typeof value === 'number' && Number.isFinite(value);
const pending = reason => ({ value: null, status: 'pending', reason });
// Target attainment is not a pace/risk assessment or a pillar status.
export function meetsTarget(actual, target) {
  if (!finite(actual) || !target || target.definitionPending || !finite(target.value)) return null;
  switch (target.operator) {
    case 'gt': return actual > target.value;
    case 'gte': return actual >= target.value;
    case 'lt': return actual < target.value;
    case 'lte': return actual <= target.value;
    case 'range': return finite(target.upper) && target.upper >= target.value
      ? actual >= target.value && actual <= target.upper : null;
    default: return null;
  }
}
export function calculateMetric(type, input = {}) {
  if (type === 'reported') return finite(input.value)
    ? { value: input.value, status: 'recorded' } : pending('A recorded value is required');
  if (type === 'ratio' || type === 'percentage') {
    if (!finite(input.numerator) || !finite(input.denominator)) return pending('Both counts are required');
    if (input.denominator <= 0) return pending('Denominator must be positive');
    return { value: input.numerator / input.denominator * (type === 'percentage' ? 100 : 1), status: 'calculated' };
  }
  if (type === 'growth') {
    if (!finite(input.current) || !finite(input.baseline)) return pending('Current and baseline values are required');
    if (input.baseline <= 0) return pending('Growth needs a positive baseline');
    return { value: (input.current - input.baseline) / input.baseline * 100, status: 'calculated' };
  }
  if (type === 'sum' || type === 'mean') {
    if (!Array.isArray(input.values) || !input.values.length || !input.values.every(finite)) return pending('Complete numeric observations are required');
    const total = input.values.reduce((a, b) => a + b, 0);
    return { value: type === 'mean' ? total / input.values.length : total, status: 'calculated' };
  }
  if (type === 'weightedMean') {
    if (!Array.isArray(input.values) || !input.values.length || !Array.isArray(input.weights)
      || input.weights.length !== input.values.length || !input.values.every(finite)
      || !input.weights.every(value => finite(value) && value >= 0)) return pending('Values and nonnegative weights must match');
    const weight = input.weights.reduce((a, b) => a + b, 0);
    if (!weight) return pending('At least one positive weight is required');
    return { value: input.values.reduce((total, value, i) => total + value * input.weights[i], 0) / weight, status: 'calculated' };
  }
  return pending('An approved calculation definition is required');
}
