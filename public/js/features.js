// Матриця можливостей: дані з /api/features (база даних).
const $ = id => document.getElementById(id);
const el = { q: $('q'), cat: $('cat'), focus: $('focus'), reset: $('reset'), count: $('count'), msg: $('message'), detail: $('detail'), matrix: $('matrix') };
let data = null, selected = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short = n => n.replace(/^Windows /, '');

function showDetail(f) {
  if (!f) { el.detail.hidden = true; return; }
  const names = slugs => slugs.map(s => esc(data.versions.find(v => v.slug === s).name)).join(', ') || '—';
  const have = f.support, miss = data.versions.map(v => v.slug).filter(s => !have.includes(s));
  const first = data.versions.find(v => v.slug === have[0]);
  el.detail.hidden = false;
  el.detail.innerHTML = `<h3 class="panel-title">${esc(f.name)}</h3><p>${esc(f.description)}</p>
    <dl class="spec-table">
      <div><dt>Категорія</dt><dd>${esc(f.category)}</dd></div>
      <div><dt>Перша версія</dt><dd>${first ? `${esc(first.name)} (${first.release_date.slice(0, 4)})` : '—'}</dd></div>
      <div><dt>Є в версіях</dt><dd>${have.length} з ${data.versions.length}</dd></div>
      <div><dt>Немає в</dt><dd>${miss.length ? names(miss) : 'жодній з перелічених'}</dd></div>
    </dl>`;
}

function render() {
  const q = el.q.value.trim().toLowerCase(), cat = el.cat.value, fv = el.focus.value;
  const list = data.features.filter(f => (!cat || f.category === cat) && (!q || f.name.toLowerCase().includes(q)));
  el.count.textContent = `Функцій: ${list.length} з ${data.features.length}`;
  if (selected && !list.some(f => f.name === selected)) { selected = null; showDetail(null); }
  if (!list.length) { el.matrix.innerHTML = ''; el.msg.hidden = false; el.msg.className = 'os-message'; el.msg.textContent = 'Нічого не знайдено. Спробуй інший запит або скинь фільтри.'; return; }
  el.msg.hidden = true;
  const head = `<tr><th class="sticky">ФУНКЦІЯ</th>${data.versions.map(v =>
    `<th class="${v.slug === fv ? 'col-focus' : ''}"><a href="details.html?slug=${encodeURIComponent(v.slug)}" title="${esc(v.name)}">${esc(short(v.name))}<br><span class="yr">${v.release_date.slice(0, 4)}</span></a></th>`).join('')}</tr>`;
  let body = '', last = '';
  for (const f of list) {
    if (f.category !== last) { body += `<tr class="sec"><td colspan="${data.versions.length + 1}">${esc(f.category.toUpperCase())}</td></tr>`; last = f.category; }
    body += `<tr class="${f.name === selected ? 'row-sel' : ''}"><th class="sticky"><button type="button" class="feat-btn" data-name="${esc(f.name)}">${esc(f.name)}</button></th>${data.versions.map(v =>
      `<td class="${f.support.includes(v.slug) ? 'yes' : 'no'} ${v.slug === fv ? 'col-focus' : ''}" title="${esc(v.name)}: ${f.support.includes(v.slug) ? 'є' : 'немає'}">${f.support.includes(v.slug) ? '■' : '·'}<span class="sr">${f.support.includes(v.slug) ? 'є' : 'немає'}</span></td>`).join('')}</tr>`;
  }
  el.matrix.innerHTML = `<table class="cmp mx"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

el.matrix.addEventListener('click', e => {
  const b = e.target.closest('.feat-btn'); if (!b) return;
  selected = b.dataset.name; showDetail(data.features.find(f => f.name === selected)); render();
  el.detail.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
el.q.addEventListener('input', render); el.cat.addEventListener('change', render); el.focus.addEventListener('change', render);
el.reset.addEventListener('click', () => { el.q.value = ''; el.cat.value = ''; el.focus.value = ''; selected = null; showDetail(null); render(); });

(async function init() {
  try {
    const res = await fetch('/api/features');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    if (!data.features.length) throw new Error('у базі ще немає даних про можливості — виконай npm run seed');
  } catch (err) {
    console.error(err); el.count.textContent = 'Помилка';
    el.msg.hidden = false; el.msg.className = 'os-message is-error'; el.msg.textContent = 'Не вдалося завантажити матрицю: ' + err.message; return;
  }
  [...new Set(data.features.map(f => f.category))].forEach(c => el.cat.add(new Option(c, c)));
  data.versions.forEach(v => el.focus.add(new Option(v.name, v.slug)));
  render();
})();
