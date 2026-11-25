// Енциклопедія: файли, словник, причини популярності й частки ринку — з бази (/api/knowledge)
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = v => v.toLocaleString('uk-UA', { maximumFractionDigits: 2 }) + '%';
const PERIOD = p => { const [y, m] = p.split('-'); return ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень'][m - 1] + ' ' + y; };
let data = null;

function fillSelect(sel, values) {
  sel.insertAdjacentHTML('beforeend', [...new Set(values)].map(v => `<option>${esc(v)}</option>`).join(''));
}

function drawFiles() {
  const q = $('fq').value.trim().toLowerCase(), k = $('fk').value;
  const list = data.components.filter(c => (!k || c.kind === k) &&
    (!q || [c.file, c.name, c.description, c.location].join(' ').toLowerCase().includes(q)));
  $('fcount').textContent = `Показано: ${list.length} з ${data.components.length}`;
  $('ftable').innerHTML = list.length ? list.map(c => `<tr>
    <td><code class="file">${esc(c.file)}</code><div class="note">${esc(c.kind)}</div></td>
    <td><b>${esc(c.name)}</b><div>${esc(c.description)}</div></td>
    <td>${esc(c.location || '—')}</td><td>${esc(c.since || '—')}</td></tr>`).join('')
    : '<tr><td colspan="4">Нічого не знайдено. Спробуй інший запит.</td></tr>';
}

function drawGlossary() {
  const q = $('gq').value.trim().toLowerCase(), k = $('gk').value;
  const list = data.glossary.filter(g => (!k || g.category === k) &&
    (!q || (g.term + ' ' + g.definition).toLowerCase().includes(q)));
  $('gcount').textContent = `Термінів: ${list.length} з ${data.glossary.length}`;
  $('gl').innerHTML = list.length ? list.map(g => `<div class="term"><dt>${esc(g.term)}<span class="tag">${esc(g.category)}</span></dt><dd>${esc(g.definition)}</dd></div>`).join('')
    : '<div class="os-message">Такого терміна немає. Спробуй інше слово.</div>';
}

function drawMarket() {
  $('market').innerHTML = data.market.map(g => {
    const max = Math.max(...g.items.map(i => i.percent));
    return `<section class="panel"><h3 class="panel-title">${esc(g.scope.toUpperCase())}</h3>
      <div class="hbars">${g.items.map(i => `<div class="hbar"><div class="hbar-label">${esc(i.name)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(3, i.percent / max * 100)}%"></div><span>${pct(i.percent)}</span></div>
        ${i.note ? `<div class="note">${esc(i.note)}</div>` : ''}</div>`).join('')}</div>
      <p class="note">Джерело: ${esc(g.source)}, ${PERIOD(g.period)}</p></section>`;
  }).join('');
}

function drawReasons() {
  const card = r => `<div class="feat"><b>${esc(r.title)}</b><span>${esc(r.body)}</span></div>`;
  $('reasons').innerHTML = data.reasons.filter(r => r.kind === 'reason').map(card).join('');
  $('counters').innerHTML = data.reasons.filter(r => r.kind === 'counter').map(card).join('');
  const cav = data.reasons.find(r => r.kind === 'caveat');
  $('caveat').innerHTML = cav ? `<b>${esc(cav.title)}.</b> ${esc(cav.body)}` : '';
  $('caveat').hidden = !cav;
}

(async function init() {
  try {
    const res = await fetch('/api/knowledge');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (err) {
    console.error(err);
    const m = $('message'); m.hidden = false; m.className = 'os-message is-error';
    m.textContent = 'Не вдалося завантажити дані енциклопедії: ' + err.message; return;
  }
  if (!data.components.length && !data.glossary.length) {
    const m = $('message'); m.hidden = false; m.className = 'os-message is-error';
    m.textContent = 'У базі ще немає даних енциклопедії. Зупини сервер, виконай команду npm run seed і запусти сайт знову.';
  }
  fillSelect($('fk'), data.components.map(c => c.kind));
  fillSelect($('gk'), data.glossary.map(g => g.category));
  ['fq', 'fk'].forEach(id => $(id).addEventListener('input', drawFiles));
  ['gq', 'gk'].forEach(id => $(id).addEventListener('input', drawGlossary));
  drawFiles(); drawGlossary(); drawMarket(); drawReasons();
})();
