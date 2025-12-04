# Engineering Calculations Web Application

Single-page, client-side engineering toolkit covering stress, hydraulic, thermal, and process quick checks. Calculations are auto-listed from the `calculations/` directory and rendered dynamically with MathJax for formula display.

## Getting Started
1. Serve the folder (e.g., `python -m http.server 8000`).
2. Open `http://localhost:8000` in your browser.
3. Choose a calculation from the left navigation and input values.
4. Click **Calculate** to see results and formulas.
5. Use **Run Smoke Tests** to execute lightweight module tests in the browser.

## Structure
- `index.html` – Layout shell and MathJax setup.
- `styles.css` – Dark, two-column SPA styling.
- `app.js` – Navigation, auto-discovery, rendering, and smoke test harness.
- `calculations/` – Node folders containing calculation configs, formulas, logic, and tests.
- `data/` – Property reference JSON for materials and fluids.

## Notes
- Calculation modules export `calculate(inputs)` and optionally `smokeTest()`.
- Config files drive the UI and output formatting; formulas are surfaced using LaTeX strings.
- The smoke test runner loads `tests.js` for each calculation and reports simple pass/fail badges.
