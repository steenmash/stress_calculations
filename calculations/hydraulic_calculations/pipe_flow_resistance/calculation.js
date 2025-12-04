export function calculate(inputs) {
  const validation = validate(inputs);
  if (!validation.valid) return { success: false, error: validation.message };

  const diameter = inputs.diameter;
  const area = Math.PI * Math.pow(diameter, 2) / 4;
  const volumetricFlow = inputs.flowRate / 3600; // m3/s
  const velocity = volumetricFlow / area;

  const fluidProps = getFluidProperties(inputs.fluid, inputs.temperature, inputs.pressure);
  const reynolds = (fluidProps.density * velocity * diameter) / fluidProps.viscosity;
  const frictionFactor = computeFrictionFactor(reynolds, inputs.roughness);
  const pressureDrop = frictionFactor * (inputs.length / diameter) * 0.5 * fluidProps.density * Math.pow(velocity, 2);

  return {
    success: true,
    results: {
      density: fluidProps.density,
      viscosity: fluidProps.viscosity,
      velocity,
      reynolds,
      frictionFactor,
      pressureDrop
    },
    units: {
      density: 'kg/m³',
      viscosity: 'Pa·s',
      velocity: 'm/s',
      reynolds: '',
      frictionFactor: '',
      pressureDrop: 'Pa'
    }
  };
}

function validate(inputs) {
  if (!inputs.flowRate || !inputs.diameter || !inputs.length) {
    return { valid: false, message: 'Flow rate, diameter, and length are required.' };
  }
  if (inputs.flowRate <= 0 || inputs.diameter <= 0 || inputs.length <= 0) {
    return { valid: false, message: 'Inputs must be positive.' };
  }
  return { valid: true };
}

function getFluidProperties(fluid, temperature, pressure) {
  const T = temperature;
  switch (fluid) {
    case 'air': {
      const density = (pressure * 1000) / (287.05 * (T + 273.15));
      const viscosity = 1.716e-5 * Math.pow((T + 273.15) / 273.15, 1.5) * (273.15 + 110.4) / ((T + 273.15) + 110.4);
      return { density, viscosity };
    }
    case 'diesel': {
      const density = 830 * (1 - 0.0008 * (T - 15));
      const viscosity = 3.5e-3 * Math.pow(0.9, (T - 20) / 10);
      return { density, viscosity };
    }
    case 'water':
    default: {
      const density = 1000 * (1 - ((T + 288.9414) * Math.pow(T - 3.9863, 2)) / (508929.2 * (T + 68.12963)));
      const viscosity = 2.414e-5 * Math.pow(10, 247.8 / (T + 133.15));
      return { density, viscosity };
    }
  }
}

function computeFrictionFactor(reynolds, roughness) {
  if (reynolds < 2300) return 64 / reynolds;
  return Math.pow(-2 * Math.log10(roughness / 3.7 + 5.74 / Math.pow(reynolds, 0.9)), -2);
}

export function smokeTest() {
  const result = calculate({
    flowRate: 100,
    diameter: 0.1,
    length: 100,
    fluid: 'water',
    temperature: 20,
    pressure: 101.3,
    roughness: 0.0001
  });
  return result.success && result.results.pressureDrop > 0;
}
