from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict

BASE_DIR = Path(__file__).parent
with open(BASE_DIR / "constants.json", "r", encoding="utf-8") as f:
    DATA = json.load(f)
CONSTANTS: Dict[str, Any] = DATA["constants"]

with open(BASE_DIR / "formulas.json", "r", encoding="utf-8") as f:
    FORMULAS = json.load(f)


class ValidationError(Exception):
    """Raised when inputs fail validation."""


def _round(value: float, decimals: int) -> float:
    factor = 10 ** decimals
    return round(value * factor) / factor


def validate_inputs(inputs: Dict[str, Any]) -> None:
    required = ["flow_rate_m3_per_h", "hole_diameter_mm", "hole_count", "discharge_coefficient"]
    for field in required:
        if field not in inputs:
            raise ValidationError(f"Missing required field: {field}")

    flow = float(inputs["flow_rate_m3_per_h"])
    diameter = float(inputs["hole_diameter_mm"])
    count = int(inputs["hole_count"])
    mu = float(inputs["discharge_coefficient"])

    if flow <= 0:
        raise ValidationError("Flow rate must be positive")
    if diameter <= 0:
        raise ValidationError("Hole diameter must be positive")
    if count <= 0:
        raise ValidationError("Number of holes must be positive")
    if mu <= 0 or mu > 1:
        raise ValidationError("Discharge coefficient must be between 0 and 1")


def calculate(inputs: Dict[str, Any]) -> Dict[str, Any]:
    try:
        validate_inputs(inputs)
    except ValidationError as exc:
        return {"success": False, "error": str(exc)}

    flow_m3_per_s = float(inputs["flow_rate_m3_per_h"]) / 3600.0
    hole_diameter_m = float(inputs["hole_diameter_mm"]) / 1000.0
    hole_count = int(inputs["hole_count"])
    mu = float(inputs["discharge_coefficient"])

    area_single = CONSTANTS["pi"] * (hole_diameter_m ** 2) / 4
    total_area = area_single * hole_count
    velocity = flow_m3_per_s / total_area
    head_m = (velocity / mu) ** 2 / (2 * CONSTANTS["g_m_per_s2"])

    return {
        "success": True,
        "inputs": inputs,
        "outputs": {
            "velocity_m_per_s": _round(velocity, 4),
            "liquid_height_m": _round(head_m, 4),
            "liquid_height_mm": _round(head_m * 1000.0, 2),
        },
        "formulas": FORMULAS,
        "notes": [
            f"Total discharge area: {_round(total_area, 6)} m²",
            "Gravity constant assumes standard Earth gravity",
        ],
    }


if __name__ == "__main__":
    sample = {
        "flow_rate_m3_per_h": 50,
        "hole_diameter_mm": 10,
        "hole_count": 20,
        "discharge_coefficient": 0.62,
    }
    print(calculate(sample))
