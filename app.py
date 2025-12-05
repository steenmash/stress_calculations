from __future__ import annotations
import importlib.util
import json
from http import HTTPStatus
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
CALC_DIR = BASE_DIR / "calculations"


def scan_calculations() -> List[Dict[str, object]]:
    tree: List[Dict[str, object]] = []
    if not CALC_DIR.exists():
        return tree

    for category_dir in sorted(p for p in CALC_DIR.iterdir() if p.is_dir()):
        calculations = []
        for calc_dir in sorted(p for p in category_dir.iterdir() if p.is_dir()):
            calc_file = calc_dir / "calculation.py"
            config_file = calc_dir / "ui_config.json"
            if calc_file.exists():
                title = calc_dir.name.replace("_", " ")
                description = ""
                if config_file.exists():
                    try:
                        with config_file.open("r", encoding="utf-8") as f:
                            ui_config = json.load(f)
                            title = ui_config.get("title", title)
                            description = ui_config.get("description", "")
                    except json.JSONDecodeError:
                        description = ""
                calculations.append(
                    {
                        "id": calc_dir.name,
                        "title": title,
                        "description": description,
                        "path": str(calc_dir.relative_to(CALC_DIR)),
                    }
                )
        tree.append(
            {
                "id": category_dir.name,
                "title": category_dir.name.replace("_", " "),
                "calculations": calculations,
            }
        )
    return tree


def load_calculation(category: str, calculation: str):
    calc_path = CALC_DIR / category / calculation / "calculation.py"
    if not calc_path.exists():
        return None
    module_name = f"calc_{category}_{calculation}".replace("-", "_")
    spec = importlib.util.spec_from_file_location(module_name, calc_path)
    if spec is None or spec.loader is None:
        return None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[arg-type]
    return module


def read_ui_config(category: str, calculation: str):
    config_path = CALC_DIR / category / calculation / "ui_config.json"
    if not config_path.exists():
        return None
    with config_path.open("r", encoding="utf-8") as f:
        return json.load(f)


class CalculationHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/tree":
            tree = scan_calculations()
            self._send_json(tree)
            return

        if parsed.path == "/api/config":
            params = parse_qs(parsed.query)
            category = params.get("category", [None])[0]
            calculation = params.get("calculation", [None])[0]
            if category and calculation:
                config = read_ui_config(category, calculation)
                if config is not None:
                    self._send_json(config)
                    return
            self._send_json({"error": "Configuration not found"}, status=HTTPStatus.NOT_FOUND)
            return

        super().do_GET()

    def do_POST(self):
        if self.path != "/api/calculate":
            self.send_error(HTTPStatus.NOT_FOUND.value, "Endpoint not found")
            return

        length = int(self.headers.get("Content-Length", "0"))
        payload = self.rfile.read(length)
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON"}, status=HTTPStatus.BAD_REQUEST)
            return

        category = data.get("category")
        calculation = data.get("calculation")
        inputs = data.get("inputs", {})
        if not category or not calculation:
            self._send_json({"error": "category and calculation are required"}, status=HTTPStatus.BAD_REQUEST)
            return

        module = load_calculation(category, calculation)
        if module is None or not hasattr(module, "calculate"):
            self._send_json({"error": "Calculation module not found"}, status=HTTPStatus.NOT_FOUND)
            return

        result = module.calculate(inputs)  # type: ignore[attr-defined]
        self._send_json(result)

    def _send_json(self, data, status: HTTPStatus = HTTPStatus.OK):
        encoded = json.dumps(data).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def serve(host: str = "0.0.0.0", port: int = 8000):
    httpd = HTTPServer((host, port), CalculationHandler)
    print(f"Serving on http://{host}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    serve()
