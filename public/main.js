const treeContainer = document.getElementById('tree');
const inputContainer = document.getElementById('input-form');
const resultContainer = document.getElementById('results-content');
const formulaView = document.getElementById('formula-view');
let currentSelection = null;

function renderTree(categories) {
  treeContainer.innerHTML = '';
  categories.forEach((category) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'category';
    const heading = document.createElement('h3');
    heading.textContent = `📁 ${category.title}`;
    wrapper.appendChild(heading);

    category.calculations.forEach((calc) => {
      const btn = document.createElement('button');
      btn.textContent = `📄 ${calc.title}`;
      btn.onclick = () => selectCalculation(category.id, calc.id, btn);
      wrapper.appendChild(btn);
    });
    treeContainer.appendChild(wrapper);
  });
}

async function loadTree() {
  const response = await fetch('/api/tree');
  const data = await response.json();
  renderTree(data);
}

function clearActiveButtons() {
  treeContainer.querySelectorAll('button').forEach((btn) => btn.classList.remove('active'));
}

async function selectCalculation(categoryId, calcId, button) {
  clearActiveButtons();
  button.classList.add('active');
  currentSelection = { categoryId, calcId };
  resultContainer.textContent = 'No results yet.';
  formulaView.textContent = 'Formulas will appear here.';

  const configRes = await fetch(`/api/config?category=${categoryId}&calculation=${calcId}`);
  if (!configRes.ok) {
    inputContainer.textContent = 'Unable to load configuration.';
    return;
  }
  const config = await configRes.json();
  buildForm(config);
  renderFormulas(config.title);
}

function buildForm(config) {
  inputContainer.innerHTML = '';
  const desc = document.createElement('p');
  desc.textContent = config.description || '';
  inputContainer.appendChild(desc);

  const form = document.createElement('div');
  config.input_form.forEach((field) => {
    const row = document.createElement('div');
    row.className = 'form-row';
    const label = document.createElement('label');
    label.textContent = `${field.label}${field.unit ? ` (${field.unit})` : ''}`;
    const input = document.createElement(field.type === 'select' ? 'select' : 'input');
    input.name = field.field;
    input.placeholder = field.placeholder || '';
    if (field.type === 'select') {
      field.options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt.label || opt;
        input.appendChild(option);
      });
      if (field.default) input.value = field.default;
    } else {
      input.type = 'number';
      if (field.default !== undefined) input.value = field.default;
    }
    row.appendChild(label);
    row.appendChild(input);
    form.appendChild(row);
  });

  const button = document.createElement('button');
  button.id = 'calculate-btn';
  button.textContent = 'Calculate';
  button.onclick = () => submitCalculation(config, form);
  form.appendChild(button);
  inputContainer.appendChild(form);
}

function renderFormulas(title) {
  formulaView.innerHTML = `<h3>${title}</h3><p>Formulas from configuration file will render after calculation.</p>`;
}

async function submitCalculation(config, formContainer) {
  if (!currentSelection) return;
  const formInputs = {};
  formContainer.querySelectorAll('input, select').forEach((el) => {
    const key = el.name;
    formInputs[key] = el.type === 'number' ? Number(el.value) : el.value;
  });

  const payload = {
    category: currentSelection.categoryId,
    calculation: currentSelection.calcId,
    inputs: formInputs,
  };

  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.success) {
    resultContainer.textContent = `Error: ${result.error}`;
    return;
  }
  const lines = [];
  for (const [key, value] of Object.entries(result.outputs)) {
    lines.push(`${key}: ${value}`);
  }
  resultContainer.textContent = lines.join('\n');
  formulaView.textContent = JSON.stringify(result.formulas, null, 2);
  if (window.MathJax) {
    window.MathJax.typesetPromise();
  }
}

loadTree();
