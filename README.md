# Engineering Calculations SPA (Python prototype)

This project is a single-page application that serves self-contained engineering calculations. A lightweight Python HTTP server scans the `calculations` directory to build the navigation tree and executes calculation modules on demand.

## Running the server
```
python app.py
```
The server listens on port 8000 and serves the SPA from the `public` directory.

## API endpoints
- `GET /api/tree` – returns the category and calculation tree derived from the folder structure.
- `GET /api/config?category=<cat>&calculation=<calc>` – returns the UI configuration for a calculation.
- `POST /api/calculate` – executes the calculation with JSON payload `{category, calculation, inputs}`.

## Current calculations
Two sample self-contained calculations are implemented to illustrate the pattern:
- Technological: Pipe Mass
- Hydraulic: Liquid Height Above Distributor Plate

Each calculation folder contains its own logic, constants, formulas, test cases, UI configuration, and README.

## Testing
Pytest is used for automated checks.
```
python -m pytest
```
