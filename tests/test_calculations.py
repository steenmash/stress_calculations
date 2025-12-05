from __future__ import annotations
import importlib.util
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CALC_DIR = BASE_DIR / "calculations"


def load_module(calc_dir: Path):
    module_name = "test_" + "_".join(calc_dir.parts[-2:])
    calc_file = calc_dir / "calculation.py"
    spec = importlib.util.spec_from_file_location(module_name, calc_file)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)  # type: ignore[arg-type]
    return module


def pytest_generate_tests(metafunc):
    if "calc_case" in metafunc.fixturenames:
        cases = []
        for category in CALC_DIR.iterdir():
            if not category.is_dir():
                continue
            for calc_dir in category.iterdir():
                if not calc_dir.is_dir():
                    continue
                cases_file = calc_dir / "test_cases.json"
                if not cases_file.exists():
                    continue
                with cases_file.open("r", encoding="utf-8") as f:
                    test_data = json.load(f).get("test_cases", [])
                module = load_module(calc_dir)
                for case in test_data:
                    cases.append((calc_dir, module, case))
        metafunc.parametrize("calc_case", cases)


def test_calculation_outputs(calc_case):
    calc_dir, module, case = calc_case
    result = module.calculate(case["inputs"])
    if "expected_error" in case:
        assert not result.get("success", False)
        assert case["expected_error"] in result.get("error", "")
    else:
        assert result.get("success") is True
        outputs = result.get("outputs", {})
        tolerance = case.get("tolerance", 0.01)
        for key, expected in case["expected_outputs"].items():
            assert key in outputs
            assert abs(outputs[key] - expected) <= tolerance


def test_tree_scan_has_entries():
    from app import scan_calculations

    tree = scan_calculations()
    assert tree, "scan_calculations should find at least one category"
    assert any(cat.get("calculations") for cat in tree)
