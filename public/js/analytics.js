// Аналітика: графіки з /api/analytics (дані з бази). Малюємо піксельний SVG без бібліотек.
const $ = id => document.getElementById(id);
const el = { msg: $('message'), kpis: $('kpis'), chart: $('chart'), info: $('info'), metric: $('metric'), cat: $('cat'),
  byCategory: $('byCategory'), byLine: $('byLine'), byStatus: $('byStatus'), decades: $('decades') };
const LABELS = { desktop: 'ПК', beta: 'Бета / кодові назви', server: 'Сервери', device: 'Пристрої',
  DOS: 'На основі MS-DOS', NT: 'Лінія NT', CE: 'Windows CE',
  supported: 'Підтримується', ended: 'Підтримку завершено', prerelease: 'Попередня версія' };
const COLOR = { DOS: '#f4b6d8', NT: '#ff83c8', CE: '#9bd1ff' };
const NS = 'http://www.w3.org/2000/svg';
let data = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmtMb(mb) {
  if (mb < 1) return Math.round(mb * 1024) + ' КБ';
  if (mb >= 1024) return (mb / 1024).toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' ГБ';
  return mb.toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' МБ';
}
const fmtMhz = v => v >= 1000 ? (v / 1000).toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' ГГц' : v + ' МГц';
const fmtFor = field => field === 'min_cpu_mhz' ? fmtMhz : fmtMb;

function svg(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text !== undefined) e.textContent = text;
  return e;
}

function drawBars() {
  const field = el.metric.value, cat = el.cat.value, fmt = fmtFor(field);
  const rows = data.points.filter(p => p[field] !== null && p[field] > 0 &&
    (cat === 'all' ? p.category !== 'beta' : p.category === cat));
  el.chart.innerHTML = '';
  el.info.textContent = rows.length ? 'Наведи курсор або торкнись стовпчика.' : 'Для цієї категорії немає даних про цей показник.';
  if (!rows.length) return;

  const W = 900, H = 400, L = 78, R = 14, T = 16, B = 70;
  const lo = Math.floor(Math.log10(Math.min(...rows.map(r => r[field]))));
  const hi = Math.ceil(Math.log10(Math.max(...rows.map(r => r[field]))));
  const top = hi === lo ? hi + 1 : hi;
  const y = v => T + (H - T - B) * (1 - (Math.log10(v) - lo) / (top - lo));
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svg-chart' });
  s.setAttribute('shape-rendering', 'crispEdges');

  for (let p = lo; p <= top; p++) {
    const v = Math.pow(10, p);
    s.appendChild(svg('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: '#2a3570', 'stroke-dasharray': '4 4' }));
    s.appendChild(svg('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'ax' }, fmt(v)));
  }
  const step = (W - L - R) / rows.length, bw = Math.min(46, step * 0.66);
  rows.forEach((r, i) => {
    const x = L + step * i + (step - bw) / 2, top0 = y(r[field]), base = y(Math.pow(10, lo));
    const g = svg('g', { class: 'bar', tabindex: '0' });
    g.appendChild(svg('rect', { x: x + 4, y: top0 + 4, width: bw, height: base - top0, fill: '#070a1c' }));
    g.appendChild(svg('rect', { x, y: top0, width: bw, height: Math.max(base - top0, 3), fill: COLOR[r.line] || '#f4b6d8' }));
    g.appendChild(svg('text', { x: x + bw / 2, y: H - B + 18, 'text-anchor': 'end', class: 'ax',
      transform: `rotate(-45 ${x + bw / 2} ${H - B + 18})` }, r.release_date.slice(0, 4) + ' ' + r.name.replace(/^Windows /, '').slice(0, 11)));
    const show = () => { el.info.innerHTML = `<b>${esc(r.name)}</b> · ${r.release_date.slice(0, 4)} · ${esc(el.metric.selectedOptions[0].text)}: <b>${fmt(r[field])}</b>`; };
    g.addEventListener('mouseenter', show); g.addEventListener('focus', show); g.addEventListener('click', show);
    s.appendChild(g);
  });
  el.chart.appendChild(s);
}

function hbars(target, items) {
  const max = Math.max(1, ...items.map(i => i.n));
  target.innerHTML = items.map(i => `<div class="hbar"><div class="hbar-label">${esc(LABELS[i.key] || i.key)}</div>
    <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(4, i.n / max * 100)}%"></div><span>${i.n}</span></div></div>`).join('');
}

function drawDecades() {
  const items = data.byDecade;
  const max = Math.max(1, ...items.map(i => i.n));
  el.decades.innerHTML = items.map(i => `<div class="col" title="${i.key}-ті: ${i.n}">
    <span class="col-n">${i.n}</span><div class="col-bar" style="height:${Math.max(6, i.n / max * 100)}%"></div><span class="col-l">${i.key}-ті</span></div>`).join('');
}

function kpis() {
  const g = data.growth, out = [];
  out.push(`<div class="kpi"><div class="kpi-v">${data.total}</div><div class="kpi-l">записів у базі</div></div>`);
  if (g.ram) out.push(`<div class="kpi"><div class="kpi-v">×${g.ram.factor.toLocaleString('uk-UA')}</div><div class="kpi-l">зростання мін. RAM ПК: ${fmtMb(g.ram.from.value)} (${esc(g.ram.from.name)}) → ${fmtMb(g.ram.to.value)} (${esc(g.ram.to.name)})</div></div>`);
  if (g.disk) out.push(`<div class="kpi"><div class="kpi-v">×${g.disk.factor.toLocaleString('uk-UA')}</div><div class="kpi-l">зростання мін. диска ПК: ${fmtMb(g.disk.from.value)} → ${fmtMb(g.disk.to.value)}</div></div>`);
  if (g.cpu) out.push(`<div class="kpi"><div class="kpi-v">×${g.cpu.factor.toLocaleString('uk-UA')}</div><div class="kpi-l">зростання мін. частоти CPU ПК: ${fmtMhz(g.cpu.from.value)} → ${fmtMhz(g.cpu.to.value)}</div></div>`);
  el.kpis.innerHTML = out.join('');
}

(async function init() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (err) {
    console.error(err); el.msg.hidden = false; el.msg.className = 'os-message is-error';
    el.msg.textContent = 'Не вдалося завантажити аналітику: ' + err.message; return;
  }
  kpis(); drawBars(); drawDecades();
  hbars(el.byCategory, data.byCategory); hbars(el.byLine, data.byLine); hbars(el.byStatus, data.byStatus);
  el.metric.addEventListener('change', drawBars); el.cat.addEventListener('change', drawBars);
})();
