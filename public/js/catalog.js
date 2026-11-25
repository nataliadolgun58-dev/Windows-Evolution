// Каталог Windows: дані беремо з API (/api/os), яке читає базу даних.
const $ = id => document.getElementById(id);
const el = { q: $('q'), category: $('category'), line: $('line'), status: $('status'),  sort: $('sort'),
             order: $('order'), reset: $('reset'), grid: $('grid'),
             count: $('count'), message: $('message') };
let orderDir = 'asc';
let timer = null;
let requestId = 0;

const CATEGORY = { desktop: 'ПК', beta: 'БЕТА', server: 'СЕРВЕР', device: 'ПРИСТРІЙ' };
const LINE = { DOS: 'MS-DOS', NT: 'NT', CE: 'WINDOWS CE' };
const STATUS = { supported: ['ПІДТРИМУЄТЬСЯ', 'badge-on'], ended: ['ПІДТРИМКУ ЗАВЕРШЕНО', 'badge-off'], prerelease: ['БЕТА / НЕ ВИПУЩЕНА', 'badge-beta'] };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Мегабайти -> зрозумілий текст (0.25 МБ = 256 КБ, 4096 МБ = 4 ГБ)
function fmtMb(mb) {
  if (mb === null || mb === undefined) return '—';
  if (mb < 1) return Math.round(mb * 1024) + ' КБ';
  if (mb >= 1024) return (mb / 1024).toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' ГБ';
  return mb.toLocaleString('uk-UA') + ' МБ';
}
function badge(os) {
  if (os.category === 'beta') return '<span class="badge badge-beta">БЕТА / КОДОВА НАЗВА</span>';
  const [text, cls] = STATUS[os.support_status] || STATUS.ended;
  return `<span class="badge ${cls}">${text}</span>`;
}
const year = d => (d || '').slice(0, 4);

const shortText = (t, n = 130) => { t = String(t || ''); const i = t.indexOf('.'); const first = i > 20 && i < n ? t.slice(0, i + 1) : t; return first.length > n ? first.slice(0, n - 1) + '…' : first; };
const fmtDate = d => { if (!d) return ''; const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }); };
const extraRow = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';

function card(os) {
  const cpu = os.min_cpu_text || (os.min_cpu_mhz ? os.min_cpu_mhz + ' МГц' : 'немає даних');
  const p = os.props || {};
  const eds = (os.editions || []).length;
  const innov = (os.innovation || []).slice(0, 2);
  const extra = [
    extraRow('Кодова назва', p.codename), extraRow('Внутрішня версія', p.ntver), extraRow('Ядро', os.kernel),
    extraRow('Архітектура', os.architecture), extraRow('Файлові системи', os.file_systems),
    extraRow('Редакції', eds ? `${eds} (${os.editions.slice(0, 3).join(', ')}${eds > 3 ? '…' : ''})` : ''),
    extraRow('Кінець підтримки', fmtDate(os.support_end))
  ].join('');
  return `
  <a class="os-card ${os.line === 'NT' ? 'is-nt' : 'is-dos'}" href="details.html?slug=${encodeURIComponent(os.slug)}">
    <div class="os-thumb" data-slug="${esc(os.slug)}">${OsImages.placeholder}</div>
    <div class="os-card-top">
      <span class="os-year">${esc(year(os.release_date))}</span>
      ${badge(os)}
    </div>
    <h2 class="os-name">${esc(os.name)}</h2>
    <div class="os-tags">
      <span class="tag tag-cat">${CATEGORY[os.category] || 'ПК'}</span>
      <span class="tag">${LINE[os.line] || esc(os.line)}</span>
      ${os.bits ? `<span class="tag">${esc(os.bits)}-BIT</span>` : ''}
      ${os.version ? `<span class="tag">v${esc(os.version)}</span>` : ''}
      ${os.build ? `<span class="tag">збірка ${esc(os.build)}</span>` : ''}
    </div>
    <p class="os-summary">${esc(os.summary || os.ui_summary || '')}</p>
    ${p.bitness ? `<p class="os-bitness"><b>Розрядність:</b> ${esc(shortText(p.bitness))}</p>` : ''}
    <dl class="os-specs">
      <div><dt>CPU</dt><dd class="${os.min_cpu_text || os.min_cpu_mhz ? '' : 'nodata'}">${esc(cpu)}</dd></div>
      <div><dt>RAM</dt><dd class="${os.min_ram_mb == null ? 'nodata' : ''}">${os.min_ram_mb == null ? 'немає даних' : fmtMb(os.min_ram_mb)}</dd></div>
      <div><dt>ДИСК</dt><dd class="${os.min_disk_mb == null ? 'nodata' : ''}">${os.min_disk_mb == null ? 'немає даних' : fmtMb(os.min_disk_mb)}</dd></div>
    </dl>
    ${extra ? `<dl class="os-extra">${extra}</dl>` : ''}
    ${innov.length ? `<ul class="os-innov">${innov.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <span class="os-open">ВІДКРИТИ КАРТКУ ▸</span>
  </a>`;
}

function showMessage(text, isError) {
  el.message.hidden = false;
  el.message.className = 'os-message' + (isError ? ' is-error' : '');
  el.message.textContent = text;
}

async function load() {
  const id = ++requestId;
  const params = new URLSearchParams();
  if (el.q.value.trim()) params.set('q', el.q.value.trim());
  if (el.category.value) params.set('category', el.category.value);
  if (el.line.value) params.set('line', el.line.value);
  if (el.status.value) params.set('status', el.status.value);
  if (el.category.value) params.set('category', el.category.value);
  params.set('sort', el.sort.value);
  params.set('order', orderDir);
  try {
    const res = await fetch('/api/os?' + params);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'HTTP ' + res.status);
    const list = await res.json();
    if (id !== requestId) return; // прийшла застаріла відповідь
    el.message.hidden = true;
    el.grid.innerHTML = list.map(card).join('');
    OsImages.hydrate(el.grid, list, false);
    el.count.textContent = `Знайдено: ${list.length}`;
    if (!list.length) showMessage('Нічого не знайдено. Спробуй змінити пошук або скинути фільтри.', false);
  } catch (err) {
    if (id !== requestId) return;
    console.error(err);
    el.grid.innerHTML = '';
    el.count.textContent = 'Помилка';
    showMessage('Не вдалося завантажити каталог: ' + err.message, true);
  }
}

el.q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 250); });
[el.line, el.status, el.category, el.sort].forEach(s => s.addEventListener('change', load));
el.order.addEventListener('click', () => {
  orderDir = orderDir === 'asc' ? 'desc' : 'asc';
  el.order.textContent = orderDir === 'asc' ? '▲ ЗА ЗРОСТАННЯМ' : '▼ ЗА СПАДАННЯМ';
  load();
});
el.reset.addEventListener('click', () => {
  el.q.value = ''; el.category.value = ''; el.line.value = ''; el.status.value = ''; el.category.value = ''; el.sort.value = 'date';
  orderDir = 'asc'; el.order.textContent = '▲ ЗА ЗРОСТАННЯМ';
  load();
});

load();
