const diametersMm = [20, 25, 32, 40, 50, 65, 80, 100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000];

export function calculate(inputs) {
  const q = Number(inputs.flowRate);
  if (!q || q <= 0) {
    return { success: false, error: 'Flow rate must be positive.' };
  }
  const qMs = q / 3600; // m3/s
  const table = diametersMm.map((d) => {
    const D = d / 1000;
    const velocity = (4 * qMs) / (Math.PI * Math.pow(D, 2));
    return { diameter: d, velocity, band: classifyBand(velocity) };
  });

  return { success: true, results: { table }, units: { table: 'm/s' } };
}

function classifyBand(v) {
  if (v >= 10 && v <= 15) return 'gas';
  if (v >= 0.8 && v <= 1.5) return 'liquid';
  return 'neutral';
}

export function smokeTest() {
  const res = calculate({ flowRate: 100 });
  return res.success && res.results.table.length === diametersMm.length;
}
