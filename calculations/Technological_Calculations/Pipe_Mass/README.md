# Pipe Mass Calculation

Calculates the inner diameter, mass per meter, and total mass of cylindrical pipes based on geometry and material density. Each pipe calculation is fully self-contained in this folder.

## Inputs
- Outer diameter (mm)
- Wall thickness (mm)
- Length per pipe (m)
- Quantity (pcs)
- Material (Carbon Steel, Stainless Steel, Brass, Bronze)

## Outputs
- Inner diameter (mm)
- Mass per meter (kg/m)
- Total mass (kg)

## Validation
- All inputs are required.
- Outer diameter must be greater than twice the wall thickness and below 3000 mm.
- Length and quantity must be positive.
- Material must exist in the local materials list.

## Notes
- Units are metric; area uses meters internally for consistent density units.
- Formulas are stored in `formulas.json` and rendered in the UI via MathJax.
