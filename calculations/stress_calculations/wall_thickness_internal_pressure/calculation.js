export function calculate(inputs) {
  const validation = validateInputs(inputs);
  if (!validation.valid) {
    return { success: false, error: validation.message };
  }

  const materialDb = allowableStressDb[inputs.material];
  const gradeData = materialDb?.[inputs.grade];
  if (!gradeData) {
    return { success: false, error: 'Selected material/grade is not available in database.' };
  }

  const allowableStress = interpolateStress(gradeData.temperatures, gradeData.allowable_stress, inputs.temperature);
  const diameter = inputs.diameter;
  const pressure = inputs.pressure;
  const phi = inputs.weldCoefficient;
  const c = inputs.corrosionAllowance || 0;

  const thickness = (pressure * diameter) / (2 * allowableStress * phi - pressure);
  const totalThickness = thickness + c;
  const outerDiameter = diameter + 2 * totalThickness;
  const allowablePressure = (2 * allowableStress * phi * thickness) / (diameter + thickness);
  const safetyMargin = ((totalThickness - thickness) / thickness) * 100;

  return {
    success: true,
    results: {
      allowableStress,
      thickness,
      totalThickness,
      outerDiameter,
      allowablePressure,
      safetyMargin
    },
    units: {
      allowableStress: 'MPa',
      thickness: 'mm',
      totalThickness: 'mm',
      outerDiameter: 'mm',
      allowablePressure: 'MPa',
      safetyMargin: '%'
    }
  };
}

function validateInputs(inputs) {
  if (!inputs.diameter || !inputs.pressure) {
    return { valid: false, message: 'Diameter and pressure are required.' };
  }
  if (inputs.pressure < 0) {
    return { valid: false, message: 'Pressure must be non-negative.' };
  }
  if (inputs.weldCoefficient <= 0 || inputs.weldCoefficient > 1.05) {
    return { valid: false, message: 'Weld coefficient must be between 0 and 1.' };
  }
  return { valid: true };
}

const allowableStressDb = {
  'Carbon Steel': {
    'SA-516 Gr.60': { temperatures: [-29, 20, 50, 100, 150, 200, 250, 300, 350, 400], allowable_stress: [117, 117, 117, 117, 115, 108, 98, 86, 71, 54] },
    'SA-516 Gr.70': { temperatures: [-29, 20, 50, 100, 150, 200, 250, 300], allowable_stress: [138, 138, 138, 138, 136, 129, 118, 105] }
  },
  'Stainless Steel': {
    'SA-240 TP304': { temperatures: [-200, 20, 100, 200, 300, 400, 500], allowable_stress: [138, 138, 114, 103, 95, 89, 83] },
    'SA-240 TP316': { temperatures: [-196, 20, 100, 200, 300, 400, 500], allowable_stress: [146, 146, 122, 111, 103, 97, 92] }
  }
};

function interpolateStress(temps, values, target) {
  if (target <= temps[0]) return values[0];
  if (target >= temps[temps.length - 1]) return values[values.length - 1];
  for (let i = 0; i < temps.length - 1; i++) {
    if (target >= temps[i] && target <= temps[i + 1]) {
      const t0 = temps[i];
      const t1 = temps[i + 1];
      const v0 = values[i];
      const v1 = values[i + 1];
      const ratio = (target - t0) / (t1 - t0);
      return v0 + ratio * (v1 - v0);
    }
  }
  return values[values.length - 1];
}

export function smokeTest() {
  const base = calculate({
    diameter: 1000,
    pressure: 1,
    material: 'Carbon Steel',
    grade: 'SA-516 Gr.60',
    temperature: 20,
    corrosionAllowance: 3,
    weldCoefficient: 1
  });
  return base.success && Math.abs(base.results.thickness - 8.547) < 0.2;
}
