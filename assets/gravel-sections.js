/* Additional rectangular zones at a shared gravel depth. */
window.AmountHubGravelSections = (() => {
  const list = document.getElementById('gravelSections');
  const add = document.getElementById('addGravelSection');
  let nextId = 1;
  const rows = () => [...list.querySelectorAll('[data-gravel-section]')];
  function updateCount() {
    document.getElementById('sectionCount').textContent = rows().length ? `${rows().length} additional section${rows().length === 1 ? '' : 's'}` : 'No additional sections';
  }
  function updateUnits() {
    const length = document.getElementById('lengthUnit').value;
    const width = document.getElementById('widthUnit').value;
    rows().forEach(row => {
      row.querySelector('[data-section-length-unit]').textContent = length;
      row.querySelector('[data-section-width-unit]').textContent = width;
    });
  }
  add.addEventListener('click', () => {
    const id = nextId++;
    const row = document.createElement('div');
    row.className = 'section-row'; row.dataset.gravelSection = '';
    row.innerHTML = `<div><label for="gravelSectionLength${id}">Section ${id} length</label><div class="section-input"><input id="gravelSectionLength${id}" data-section-length type="number" min="0" step="any" inputmode="decimal" placeholder="e.g. 2"><span data-section-length-unit></span></div></div><div><label for="gravelSectionWidth${id}">Section ${id} width</label><div class="section-input"><input id="gravelSectionWidth${id}" data-section-width type="number" min="0" step="any" inputmode="decimal" placeholder="e.g. 1.5"><span data-section-width-unit></span></div></div><button type="button" class="remove-section" aria-label="Remove section ${id}">Remove</button>`;
    row.querySelector('.remove-section').addEventListener('click', () => { row.remove(); updateCount(); });
    list.appendChild(row); updateUnits(); updateCount();
    row.querySelector('[data-section-length]').focus();
  });
  document.getElementById('lengthUnit').addEventListener('change', updateUnits);
  document.getElementById('widthUnit').addEventListener('change', updateUnits);
  function totalArea(baseArea, lengthUnit, widthUnit) {
    let area = baseArea;
    for (const row of rows()) {
      const lengthInput = row.querySelector('[data-section-length]');
      const widthInput = row.querySelector('[data-section-width]');
      const length = Number(lengthInput.value), width = Number(widthInput.value);
      if (!lengthInput.value.trim() || !widthInput.value.trim() || !Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) return NaN;
      area += AmountHubUnits.metres(length, lengthUnit) * AmountHubUnits.metres(width, widthUnit);
    }
    return area;
  }
  return {totalArea, count:()=>rows().length, updateUnits};
})();
