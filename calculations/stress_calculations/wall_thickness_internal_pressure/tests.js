import { calculate, smokeTest } from './calculation.js';

export function runTests() {
  const results = [];

  // Standard calculation
  const standard = calculate({
    diameter: 1000,
    pressure: 1,
    material: 'Carbon Steel',
    grade: 'SA-516 Gr.60',
    temperature: 20,
    corrosionAllowance: 3,
    weldCoefficient: 1
  });
  results.push({ name: 'Standard case', pass: standard.success && Math.abs(standard.results.thickness - 8.5) < 0.3 });

  // Invalid pressure
  const invalid = calculate({ diameter: 1000, pressure: -1, weldCoefficient: 1 });
  results.push({ name: 'Invalid pressure rejected', pass: invalid.success === false });

  // Smoke helper
  results.push({ name: 'Smoke test helper', pass: smokeTest() });

  return results;
}
