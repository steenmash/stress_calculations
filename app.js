const navContainer = document.getElementById('navigation');
const area = document.getElementById('calculation-area');
const statusEl = document.getElementById('status-indicator');
const runTestsBtn = document.getElementById('run-tests');

let manifest = null;
let activeCalc = null;
let modulesCache = new Map();

async function init() {
  manifest = await loadManifest();
  renderNavigation();
  attachTestRunner();
  if (manifest?.nodes?.[0]?.calculations?.[0]) {
    loadCalculation(manifest.nodes[0].calculations[0]);
  }
}

async function loadManifest() {
  try {
    const res = await fetch('calculations/index.json');
    if (!res.ok) throw new Error('Unable to load manifest');
    return await res.json();
  } catch (err) {
    area.innerHTML = `<div class="placeholder">${err.message}</div>`;
    return null;
  }
}

function renderNavigation() {
  if (!manifest) return;
  navContainer.innerHTML = '';
  manifest.nodes.forEach((node) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-node';
    const header = document.createElement('div');
    header.className = 'node-header';
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = '📂';
    const title = document.createElement('span');
    title.textContent = node.name;
    header.append(icon, title);
    header.addEventListener('click', () => toggleList(list, icon));
    const list = document.createElement('ul');
    list.className = 'nav-calculation';
    node.calculations.forEach((calc) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'nav-link';
      link.textContent = beautifyId(calc.id);
      link.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveLink(link);
        loadCalculation(calc);
      });
      item.appendChild(link);
      list.appendChild(item);
    });
    wrapper.append(header, list);
    navContainer.appendChild(wrapper);
  });
}

function toggleList(list, icon) {
  const isHidden = list.style.display === 'none';
  list.style.display = isHidden ? 'block' : 'none';
  icon.textContent = isHidden ? '📂' : '📁';
}

function setActiveLink(link) {
  document.querySelectorAll('.nav-link').forEach((lnk) => lnk.classList.remove('active'));
  link.classList.add('active');
}

async function loadCalculation(calc) {
  if (!calc?.path) return;
  statusEl.textContent = 'Loading…';
  try {
    const [config, formulas] = await Promise.all([
      fetch(`${calc.path}/config.json`).then((r) => r.json()),
      fetch(`${calc.path}/formulas.json`).then((r) => r.json())
    ]);
    const module = await loadModule(calc.path);
    activeCalc = { meta: calc, config, formulas, module };
    renderCalculation(config, formulas, module, calc.path);
    statusEl.textContent = 'Ready';
  } catch (err) {
    area.innerHTML = `<div class="placeholder">${err.message}</div>`;
    statusEl.textContent = 'Error';
  }
}

async function loadModule(path) {
  if (modulesCache.has(path)) return modulesCache.get(path);
  const module = await import(`./${path}/calculation.js`);
  modulesCache.set(path, module);
  return module;
}

function renderCalculation(config, formulas, module, path) {
  area.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'calculation-header';
  const titleWrap = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = config.name;
  const meta = document.createElement('div');
  meta.className = 'calculation-meta';
  meta.textContent = `${config.description}`;
  titleWrap.append(h2, meta);

  const badge = document.createElement('span');
  badge.className = 'chip';
  badge.textContent = `v${config.version}`;
  header.append(titleWrap, badge);

  const form = document.createElement('form');
  form.className = 'section';
  const grid = document.createElement('div');
  grid.className = 'grid';
  config.inputs.forEach((input) => {
    const field = document.createElement('div');
    field.className = 'form-field';
    const label = document.createElement('label');
    label.textContent = input.label;
    const small = document.createElement('small');
    small.textContent = input.required ? 'Required' : 'Optional';
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    let control;
    if (input.type === 'select') {
      control = document.createElement('select');
      input.options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        control.appendChild(option);
      });
      control.value = input.default;
    } else {
      control = document.createElement('input');
      control.type = input.type || 'number';
      if (input.default !== undefined) control.value = input.default;
      if (input.min !== undefined) control.min = input.min;
      if (input.max !== undefined) control.max = input.max;
    }
    control.name = input.id;
    control.required = Boolean(input.required);
    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = input.unit || '';
    inputGroup.append(control, unit);
    field.append(label, small, inputGroup);
    grid.appendChild(field);
  });

  form.appendChild(grid);
  const actions = document.createElement('div');
  actions.className = 'actions';
  const calculateBtn = document.createElement('button');
  calculateBtn.className = 'primary';
  calculateBtn.textContent = 'Calculate';
  calculateBtn.type = 'button';
  calculateBtn.addEventListener('click', () => handleCalculate(form, config, module));
  const resetBtn = document.createElement('button');
  resetBtn.className = 'secondary';
  resetBtn.textContent = 'Reset';
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => resetForm(form, config));
  actions.append(calculateBtn, resetBtn);
  form.appendChild(actions);

  area.append(header, form);

  const resultsSection = document.createElement('div');
  resultsSection.className = 'section';
  resultsSection.id = 'results';
  const resultsTitle = document.createElement('h3');
  resultsTitle.textContent = 'Results';
  const resultsPlaceholder = document.createElement('div');
  resultsPlaceholder.className = 'placeholder';
  resultsPlaceholder.textContent = 'Run a calculation to see results.';
  resultsSection.append(resultsTitle, resultsPlaceholder);

  const formulasSection = renderFormulas(formulas);
  formulasSection.classList.add('section');

  area.append(resultsSection, formulasSection);
  MathJax.typesetPromise?.();
}

function resetForm(form, config) {
  config.inputs.forEach((input) => {
    const control = form.querySelector(`[name="${input.id}"]`);
    if (!control) return;
    if (input.default !== undefined) control.value = input.default;
  });
}

function handleCalculate(form, config, module) {
  const payload = {};
  config.inputs.forEach((input) => {
    const el = form.querySelector(`[name="${input.id}"]`);
    if (!el) return;
    if (input.type === 'select') {
      payload[input.id] = el.value;
    } else {
      const value = Number(el.value);
      payload[input.id] = Number.isNaN(value) ? undefined : value;
    }
  });

  const result = module.calculate(payload);
  renderResults(result, config.outputs);
  MathJax.typesetPromise?.();
}

function renderResults(result, outputs) {
  const resultsSection = document.getElementById('results');
  resultsSection.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = 'Results';
  resultsSection.appendChild(title);
  if (!result.success) {
    const error = document.createElement('div');
    error.className = 'badge-danger chip';
    error.textContent = result.error || 'Invalid inputs';
    resultsSection.appendChild(error);
    return;
  }

  const table = document.createElement('table');
  table.className = 'results-table';
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th>Parameter</th><th>Value</th>';
  table.appendChild(headerRow);

  outputs.forEach((out) => {
    const valueData = result.results[out.id];
    if (Array.isArray(valueData)) {
      const wrapperRow = document.createElement('tr');
      const label = document.createElement('td');
      label.colSpan = 2;
      label.innerHTML = `<strong>${out.label}</strong>`;
      wrapperRow.appendChild(label);
      table.appendChild(wrapperRow);

      const subRow = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 2;
      cell.appendChild(renderVelocityTable(valueData));
      subRow.appendChild(cell);
      table.appendChild(subRow);
      return;
    }

    const row = document.createElement('tr');
    const label = document.createElement('td');
    label.textContent = `${out.label}${out.unit ? ` (${out.unit})` : ''}`;
    const value = document.createElement('td');
    value.className = 'value';
    const num = valueData;
    const precision = out.precision ?? 3;
    value.textContent = typeof num === 'number' ? num.toFixed(precision) : formatTable(num);
    row.append(label, value);
    table.appendChild(row);
  });

  resultsSection.appendChild(table);
}

function formatTable(entry) {
  if (!entry) return '-';
  if (Array.isArray(entry) || entry.table) return JSON.stringify(entry);
  if (typeof entry === 'object' && entry.table === undefined) return JSON.stringify(entry);
  return String(entry);
}

function renderVelocityTable(rows) {
  const table = document.createElement('table');
  table.className = 'results-table';
  const header = document.createElement('tr');
  header.innerHTML = '<th>Diameter (mm)</th><th>Velocity (m/s)</th>';
  table.appendChild(header);
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    const dCell = document.createElement('td');
    dCell.textContent = row.diameter;
    const vCell = document.createElement('td');
    vCell.textContent = row.velocity.toFixed(3);
    if (row.band === 'gas') vCell.classList.add('chip');
    if (row.band === 'liquid') vCell.classList.add('badge-success');
    tr.append(dCell, vCell);
    table.appendChild(tr);
  });
  return table;
}

function renderFormulas(formulas) {
  const wrapper = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Formulas';
  wrapper.appendChild(title);
  Object.values(formulas).forEach((f) => {
    if (!f.display) return;
    const block = document.createElement('div');
    block.className = 'formula-block';
    const latex = document.createElement('div');
    latex.innerHTML = `$$${f.latex}$$`;
    const desc = document.createElement('p');
    desc.textContent = f.description;
    block.append(latex, desc);
    wrapper.appendChild(block);
  });
  return wrapper;
}

function beautifyId(id) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function attachTestRunner() {
  runTestsBtn.addEventListener('click', async () => {
    if (!manifest) return;
    statusEl.textContent = 'Running tests…';
    const allResults = [];
    for (const node of manifest.nodes) {
      for (const calc of node.calculations) {
        const module = await loadModule(calc.path);
        try {
          const tests = await import(`./${calc.path}/tests.js`);
          const results = tests.runTests();
          allResults.push({ calc: calc.id, results });
        } catch (err) {
          allResults.push({ calc: calc.id, error: err.message });
        }
      }
    }
    renderTestReport(allResults);
    statusEl.textContent = 'Ready';
  });
}

function renderTestReport(payload) {
  const section = document.createElement('div');
  section.className = 'section';
  const title = document.createElement('h3');
  title.textContent = 'Smoke Tests';
  section.appendChild(title);

  payload.forEach((entry) => {
    const heading = document.createElement('div');
    heading.className = 'calculation-meta';
    heading.textContent = beautifyId(entry.calc);
    section.appendChild(heading);

    if (entry.error) {
      const badge = document.createElement('div');
      badge.className = 'badge-danger chip';
      badge.textContent = entry.error;
      section.appendChild(badge);
      return;
    }

    const list = document.createElement('ul');
    entry.results.forEach((r) => {
      const li = document.createElement('li');
      li.textContent = `${r.pass ? '✅' : '❌'} ${r.name}`;
      list.appendChild(li);
    });
    section.appendChild(list);
  });

  area.appendChild(section);
}

init();
