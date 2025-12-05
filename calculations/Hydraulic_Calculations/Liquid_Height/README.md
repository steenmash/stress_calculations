# Liquid Height Above Distributor Plate

Determines the velocity through perforated distributor plates and the resulting hydraulic head using classical orifice equations.

## Inputs
- Flow rate (m³/h)
- Hole diameter (mm)
- Number of holes (pcs)
- Discharge coefficient μ (0–1)

## Outputs
- Velocity through holes (m/s)
- Liquid height (m and mm)

## Validation
- Positive flow, hole diameter, and hole count are required.
- Discharge coefficient must be between 0 and 1.

## Notes
- Uses standard gravity (9.81 m/s²).
- Each calculation uses only files in this folder.
