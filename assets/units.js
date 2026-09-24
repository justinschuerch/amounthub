/* Shared measurement handling for the five landscape and concrete tools. */
window.AmountHubUnits = (() => {
  const $ = id => document.getElementById(id);
  const metres = (value, unit) => unit === 'cm' ? value / 100 : unit === 'in' ? value * 0.0254 : unit === 'ft' ? value * 0.3048 : value;
  const number = value => { const places = Math.abs(value) >= 100 ? 2 : Math.abs(value) >= 1 ? 4 : 6; return Number(value.toFixed(places)).toString(); };
  const densityMetric = (value, system) => system === 'imperial' ? value * 0.0005932764213 : value;
  const densityForDisplay = (value, system) => system === 'imperial' ? value / 0.0005932764213 : value;

  function switchSystem(next) {
    const current = $('imperialBtn').classList.contains('active') ? 'imperial' : 'metric';
    if (next === current) return;
    const fields = ['length', 'width', 'depth'].map(id => {
      const input = $(id), select = $(id + 'Unit');
      const raw = input.value.trim();
      return { input, select, metres: raw !== '' && Number.isFinite(Number(raw)) ? metres(Number(raw), select.value) : null };
    });
    const extraMeasurements = [...document.querySelectorAll('[data-gravel-section]')].map(row => ['length','width'].map(kind => { const input = row.querySelector('[data-section-' + kind + ']'); const raw = input.value.trim(); const unit = $(kind + 'Unit').value; return {input, metres: raw !== '' && Number.isFinite(Number(raw)) ? metres(Number(raw),unit) : null}; }));
    const bag = $('bagSize');
    const bagLitres = bag && bag.value.trim() !== '' ? Number(bag.value) * (current === 'metric' ? 1 : 28.3168466) : null;
    const custom = $('customDensity');
    const previousDensity = custom && custom.value.trim() !== '' ? densityMetric(Number(custom.value), current) : null;
    $('metricBtn').classList.toggle('active', next === 'metric');
    $('imperialBtn').classList.toggle('active', next === 'imperial');
    $('metricBtn').setAttribute('aria-pressed', String(next === 'metric'));
    $('imperialBtn').setAttribute('aria-pressed', String(next === 'imperial'));
    fields.forEach(({input, select, metres: measured}, index) => {
      const depth = index === 2;
      select.innerHTML = next === 'metric'
        ? (depth ? '<option value="cm">cm</option><option value="m">m</option>' : '<option value="m">m</option><option value="cm">cm</option>')
        : (depth ? '<option value="in">in</option><option value="ft">ft</option>' : '<option value="ft">ft</option><option value="in">in</option>');
      if (measured !== null) input.value = number(measured / (next === 'metric' ? (depth ? 0.01 : 1) : (depth ? 0.0254 : 0.3048)));
    });
    extraMeasurements.forEach(pair => pair.forEach(({input, metres: measured}, index) => { if (measured !== null) input.value = number(measured / (next === 'metric' ? 1 : 0.3048)); }));
    if (window.AmountHubGravelSections) window.AmountHubGravelSections.updateUnits();
    if (bag) { $('bagSizeLabel').textContent = next === 'metric' ? 'Bag size (litres)' : 'Bag size (ft³)'; if (bagLitres !== null && Number.isFinite(bagLitres)) bag.value = number(bagLitres / (next === 'metric' ? 1 : 28.3168466)); }
    if (custom) {
      const label = $('customDensityLabel');
      label.textContent = next === 'metric' ? 'Supplier density (tonnes/m³)' : 'Supplier density (lb/yd³)';
      if (previousDensity !== null && Number.isFinite(previousDensity)) custom.value = number(densityForDisplay(previousDensity, next));
    }
    for (const id of ['result', 'error']) { const el = $(id); if (el) el.style.display = 'none'; }
    const plan = $('planningResult'); if (plan) plan.classList.remove('visible');
  }
  function chosenDensity() {
    const chosen = $('density');
    if (!chosen) return NaN;
    const custom = chosen.value === 'custom';
    if ($('customDensityField')) $('customDensityField').hidden = !custom;
    const value = Number(custom ? $('customDensity').value : chosen.value);
    if (!Number.isFinite(value) || value <= 0 || (custom && $('customDensity').value.trim() === '')) return NaN;
    return custom ? densityMetric(value, $('imperialBtn').classList.contains('active') ? 'imperial' : 'metric') : value;
  }
  return {metres, switchSystem, chosenDensity};
})();
