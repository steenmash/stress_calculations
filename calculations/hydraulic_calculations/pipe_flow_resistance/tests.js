import { calculate, smokeTest } from './calculation.js';

export function runTests() {
  const results = [];
  const waterCase = calculate({ flowRate: 100, diameter: 0.1, length: 100, fluid: 'water', temperature: 20, pressure: 101.3, roughness: 0.0001 });
  results.push({ name: 'Water run returns success', pass: waterCase.success && waterCase.results.pressureDrop > 0 });

  const laminar = calculate({ flowRate: 1, diameter: 0.05, length: 10, fluid: 'water', temperature: 20, pressure: 101.3, roughness: 0.0001 });
  results.push({ name: 'Laminar friction handles low Re', pass: laminar.success && laminar.results.frictionFactor > 0 });

  const invalid = calculate({ flowRate: 0, diameter: 0.1, length: 10, fluid: 'water', temperature: 20, pressure: 101.3, roughness: 0.0001 });
  results.push({ name: 'Rejects zero flow', pass: invalid.success === false });

  results.push({ name: 'Smoke helper', pass: smokeTest() });
  return results;
}
