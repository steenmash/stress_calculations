const heatingValues = {
  CH4: 35.8,
  C2H6: 65.0,
  C3H8: 93.0,
  N2: 0.0,
  CO2: 0.0
};

const molarMass = {
  CH4: 16.043,
  C2H6: 30.07,
  C3H8: 44.097,
  N2: 28.014,
  CO2: 44.01
};

export function calculate(inputs) {
  const fractions = normalize(inputs);
  if (!fractions.valid) return { success: false, error: fractions.message };

  const hv_vol = Object.entries(fractions.values).reduce((sum, [key, x]) => sum + x * heatingValues[key], 0);
  const molarMassMix = Object.entries(fractions.values).reduce((sum, [key, x]) => sum + x * molarMass[key], 0);
  const density = molarMassMix / 22.414;
  const hv_mass = density > 0 ? hv_vol / density : 0;

  return {
    success: true,
    results: {
      hv_m3: hv_vol,
      hv_kwh: hv_vol / 3.6,
      density,
      hv_mass
    },
    units: {
      hv_m3: 'MJ/m³',
      hv_kwh: 'kWh/m³',
      density: 'kg/m³',
      hv_mass: 'MJ/kg'
    }
  };
}

function normalize(inputs) {
  const sum = Object.values(inputs).reduce((acc, val) => acc + Number(val || 0), 0);
  if (sum <= 0) return { valid: false, message: 'Provide at least one component.' };
  const values = {};
  for (const key of Object.keys(inputs)) {
    values[key] = Number(inputs[key] || 0) / sum;
  }
  return { valid: true, values };
}

export function smokeTest() {
  const pure = calculate({ CH4: 100, C2H6: 0, C3H8: 0, N2: 0, CO2: 0 });
  return pure.success && Math.abs(pure.results.hv_m3 - 35.8) < 0.2;
}
