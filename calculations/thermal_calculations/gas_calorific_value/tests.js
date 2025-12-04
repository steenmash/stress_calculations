import { calculate, smokeTest } from './calculation.js';

export function runTests() {
  const results = [];
  const pure = calculate({ CH4: 100, C2H6: 0, C3H8: 0, N2: 0, CO2: 0 });
  results.push({ name: 'Pure methane close to reference', pass: pure.success && Math.abs(pure.results.hv_m3 - 35.8) < 0.2 });

  const mixed = calculate({ CH4: 95, C2H6: 3, C3H8: 1, N2: 1, CO2: 0 });
  results.push({ name: 'Mixture yields density', pass: mixed.success && mixed.results.density > 0 });

  const invalid = calculate({ CH4: 0, C2H6: 0, C3H8: 0, N2: 0, CO2: 0 });
  results.push({ name: 'Rejects empty composition', pass: invalid.success === false });

  results.push({ name: 'Smoke helper', pass: smokeTest() });
  return results;
}
