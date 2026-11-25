// Порівняння: вибір 2–4 версій, таблиця з відмінностями, експорт PDF/XLSX.
const MAX = 4;
const $ = id => document.getElementById(id);
const el = { add: $('add'), addBtn: $('addBtn'), clear: $('clear'), chips: $('chips'),
  actions: $('actions'), onlyDiff: $('onlyDiff'), pdf: $('pdf'), xlsx: $('xlsx'),
  message: $('message'), result: $('result') };
const CAT = { desktop: 'ПК', beta: 'Бета / кодові назви', server: 'Серверні', device: 'Пристрої' };

let all = [];          // усі ОС з бази
let selected = [];     // slug-и обраних
let table = null;      // остання таблиця з сервера
let reqId = 0;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameOf = slug => (all.find(o => o.slug === slug) || {}).name || slug;

function msg(text, isError) {
  el.message.hidden = !text;
  el.message.className = 'os-message' + (isError ? ' is-error' : '');
  el.message.textContent = text || '';
}

function fillSelect() {
  const groups = {};
  all.filter(o => !selected.includes(o.slug)).forEach(o => (groups[o.category] ||= []).push(o));
  el.add.innerHTML = Object.keys(CAT).filter(k => groups[k]).map(k =>
    `<optgroup label="${CAT[k]}">${groups[k].map(o => `<option value="${esc(o.slug)}">${esc(o.name)}</option>`).join('')}</optgroup>`).join('');
  const full = selected.length >= MAX || !el.add.options.length;
  el.add.disabled = full; el.addBtn.disabled = full;
}

function renderChips() {
  el.chips.innerHTML = selected.map(s =>
    `<span class="chip">${esc(nameOf(s))}<button type="button" data-slug="${esc(s)}" aria-label="Прибрати ${esc(nameOf(s))}">✕</button></span>`).join('')
    + `<span class="chip-count">${selected.length} / ${MAX}</span>`;
  fillSelect();
}

function renderTable() {
  if (!table) { el.result.innerHTML = ''; return; }
  const only = el.onlyDiff.checked;
  const head = `<tr><th class="sticky">ХАРАКТЕРИСТИКА</th>${table.items.map(i =>
    `<th><a href="details.html?slug=${encodeURIComponent(i.slug)}">${esc(i.name)}</a></th>`).join('')}</tr>`;
  let body = '';
  for (const s of table.sections) {
    const rows = s.rows.filter(r => !only || r.diff);
    if (!rows.length) continue;
    body += `<tr class="sec"><td colspan="${table.items.length + 1}">${esc(s.title)}</td></tr>`;
    body += rows.map(r => `<tr class="${r.diff ? 'diff' : ''}"><th class="sticky">${esc(r.label)}</th>${r.cells.map((c, i) =>
      `<td class="${r.best.includes(i) ? 'best' : ''}">${esc(c).replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('');
  }
  el.result.innerHTML = body
    ? `<table class="cmp"><thead>${head}</thead><tbody>${body}</tbody></table>`
    : '<div class="os-message">Вибрані версії не мають відмінностей у цих характеристиках.</div>';
}

async function refresh() {
  const id = ++reqId;
  renderChips();
  history.replaceState(null, '', selected.length ? '?slugs=' + selected.map(encodeURIComponent).join(',') : location.pathname);
  table = null; renderTable();
  el.actions.hidden = true;
  if (selected.length < 2) {
    msg(selected.length ? 'Додай ще хоча б одну версію для порівняння.' : 'Обери версії зі списку, щоб почати порівняння.', false);
    return;
  }
  try {
    const res = await fetch('/api/compare?slugs=' + selected.map(encodeURIComponent).join(','));
    const data = await res.json().catch(() => ({}));
    if (id !== reqId) return;
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    table = data; msg('', false); el.actions.hidden = false; renderTable();
  } catch (err) {
    if (id !== reqId) return;
    console.error(err); msg('Не вдалося побудувати порівняння: ' + err.message, true);
  }
}

async function download(kind, btn) {
  const label = btn.textContent; btn.disabled = true; btn.textContent = 'ГОТУЮ ФАЙЛ…';
  try {
    const res = await fetch(`/api/compare/export/${kind}?slugs=` + selected.map(encodeURIComponent).join(','));
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'HTTP ' + res.status);
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: `windows-comparison.${kind}` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err); msg('Не вдалося створити файл: ' + err.message, true);
  } finally { btn.disabled = false; btn.textContent = label; }
}

function add(slug) {
  if (!slug || selected.includes(slug)) return;
  if (selected.length >= MAX) { msg(`Можна порівнювати не більше ${MAX} версій. Прибери одну з обраних.`, true); return; }
  selected.push(slug); refresh();
}

el.addBtn.addEventListener('click', () => add(el.add.value));
el.clear.addEventListener('click', () => { selected = []; refresh(); });
el.chips.addEventListener('click', e => {
  const b = e.target.closest('button[data-slug]');
  if (b) { selected = selected.filter(s => s !== b.dataset.slug); refresh(); }
});
el.onlyDiff.addEventListener('change', renderTable);
el.pdf.addEventListener('click', () => download('pdf', el.pdf));
el.xlsx.addEventListener('click', () => download('xlsx', el.xlsx));

(async function init() {
  try {
    const res = await fetch('/api/os?sort=date&order=asc');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    all = await res.json();
  } catch (err) {
    console.error(err); msg('Не вдалося завантажити список версій: ' + err.message, true); return;
  }
  const p = new URLSearchParams(location.search);
  const fromUrl = (p.get('slugs') || '').split(',').concat(p.get('add') || '').map(s => s.trim())
    .filter((s, i, a) => s && a.indexOf(s) === i && all.some(o => o.slug === s)).slice(0, MAX);
  selected = fromUrl;
  refresh();
})();
