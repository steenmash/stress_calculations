from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict

BASE_DIR = Path(__file__).parent
with open(BASE_DIR / "constants.json", "r", encoding="utf-8") as f:
    DATA = json.load(f)
MATERIALS: Dict[str, Dict[str, Any]] = DATA["materials"]
CONSTANTS: Dict[str, Any] = DATA["constants"]

with open(BASE_DIR / "formulas.json", "r", encoding="utf-8") as f:
    FORMULAS = json.load(f)


class ValidationError(Exception):
    """Raised when inputs fail validation."""


def _round(value: float, decimals: int) -> float:
    factor = 10 ** decimals
    return round(value * factor) / factor


def validate_inputs(inputs: Dict[str, Any]) -> None:
    required = ["outer_diameter", "wall_thickness", "length", "quantity", "material"]
    for field in required:
        if field not in inputs:
            raise ValidationError(f"Missing required field: {field}")

    outer_diameter = float(inputs["outer_diameter"])
    wall_thickness = float(inputs["wall_thickness"])
    length = float(inputs["length"])
    quantity = float(inputs["quantity"])

    if outer_diameter <= 0 or outer_diameter > 3000:
        raise ValidationError("Outer diameter must be between 0 and 3000 mm")
    if wall_thickness <= 0 or wall_thickness >= outer_diameter / 2:
        raise ValidationError("Wall thickness must be less than half of the outer diameter")
    if length <= 0:
        raise ValidationError("Length must be positive")
    if quantity <= 0:
        raise ValidationError("Quantity must be positive")

    material = str(inputs["material"])
    if material not in MATERIALS:
        valid_materials = ", ".join(sorted(MATERIALS))
        raise ValidationError(f"Material must be one of: {valid_materials}")


def calculate(inputs: Dict[str, Any]) -> Dict[str, Any]:
    try:
        validate_inputs(inputs)
    except ValidationError as exc:
        return {"success": False, "error": str(exc)}

    outer_diameter_mm = float(inputs["outer_diameter"])
    wall_thickness_mm = float(inputs["wall_thickness"])
    length_m = float(inputs["length"])
    quantity = float(inputs["quantity"])
    material = str(inputs["material"])

    inner_diameter_mm = outer_diameter_mm - 2 * wall_thickness_mm
    outer_diameter_m = outer_diameter_mm / 1000.0
    inner_diameter_m = inner_diameter_mm / 1000.0

    area = CONSTANTS["pi"] / 4 * (outer_diameter_m**2 - inner_diameter_m**2)
    density = float(MATERIALS[material]["density_kg_per_m3"])
    mass_per_meter = area * density
    total_mass = mass_per_meter * length_m * quantity

    return {
        "success": True,
        "inputs": inputs,
        "outputs": {
            "inner_diameter_mm": _round(inner_diameter_mm, 3),
            "mass_per_meter_kg_per_m": _round(mass_per_meter, 3),
            "total_mass_kg": _round(total_mass, 3),
        },
        "formulas": FORMULAS,
        "notes": [
            f"Material density: {density} kg/m³",
            f"Total pipe length: {_round(length_m * quantity, 3)} m",
        ],
    }


if __name__ == "__main__":
    sample = {
        "outer_diameter": 273,
        "wall_thickness": 10,
        "length": 6,
        "quantity": 100,
        "material": "Carbon Steel",
    }
    print(calculate(sample))
