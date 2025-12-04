import { calculate, smokeTest } from './calculation.js';

export function runTests() {
  const results = [];
  const base = calculate({ flowRate: 100 });
  results.push({ name: 'Returns table', pass: base.success && base.results.table.length > 0 });
  const classification = base.results.table.some((row) => row.band === 'liquid' || row.band === 'gas');
  results.push({ name: 'Bands assigned', pass: classification });
  const invalid = calculate({ flowRate: 0 });
  results.push({ name: 'Rejects zero flow', pass: invalid.success === false });
  results.push({ name: 'Smoke helper', pass: smokeTest() });
  return results;
}
