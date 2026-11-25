// Сторінка однієї ОС: дані з /api/os/:slug (база даних)
const root = document.getElementById('detail');
const slug = new URLSearchParams(location.search).get('slug');

const CATEGORY = { desktop: 'ПК', beta: 'БЕТА', server: 'СЕРВЕР', device: 'ПРИСТРІЙ' };
const LINE = { DOS: 'MS-DOS', NT: 'NT', CE: 'WINDOWS CE' };
const STATUS = { supported: ['ПІДТРИМУЄТЬСЯ', 'badge-on'], ended: ['ПІДТРИМКУ ЗАВЕРШЕНО', 'badge-off'], prerelease: ['БЕТА / НЕ ВИПУЩЕНА', 'badge-beta'] };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmtMb(mb) {
  if (mb === null || mb === undefined) return '—';
  if (mb < 1) return Math.round(mb * 1024) + ' КБ';
  if (mb >= 1024) return (mb / 1024).toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' ГБ';
  return mb.toLocaleString('uk-UA') + ' МБ';
}
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}
const val = v => (v === null || v === undefined || v === '') ? '—' : esc(v);

function list(title, items, cls) {
  if (!items || !items.length) return '';
  return `<section class="panel ${cls}"><h3 class="panel-title">${title}</h3>
    <ul class="px-list">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>`;
}
function badge(os) {
  if (os.category === 'beta') return '<span class="badge badge-beta">БЕТА / КОДОВА НАЗВА</span>';
  const [text, cls] = STATUS[os.support_status] || STATUS.ended;
  return `<span class="badge ${cls}">${text}</span>`;
}
const PROP_LABELS = [['ntver', 'Внутрішній номер версії'], ['codename', 'Кодова назва'], ['shell', 'Оболонка'],
  ['browser', 'Браузер у складі'], ['media', 'Носій установки'], ['predecessor', 'Попередник'], ['successor', 'Наступник']];

const TECH_LABELS = [['bitness', 'Розрядність і зміни архітектури'], ['boot', 'Завантаження'], ['kernelfile', 'Файл ядра'], ['mode', 'Архітектура ядра'], ['sysdir', 'Системна папка'],
  ['config', 'Зберігання конфігурації'], ['subsys', 'Підсистеми й API'], ['gfx', 'Графічна підсистема'], ['drivers', 'Модель драйверів'],
  ['fs', 'Файлові системи'], ['setup', 'Установка й оновлення'], ['keyfiles', 'Ключові системні файли']];

function techPanel(os) {
  const props = os.props || {};
  const rows = TECH_LABELS.filter(([k]) => props[k]).map(([k, l]) => `<tr><th>${l}</th><td>${esc(props[k])}</td></tr>`).join('');
  return rows ? `<section class="panel panel-wide"><h3 class="panel-title">ТЕХНІЧНА АРХІТЕКТУРА</h3>
    <table class="req-table tech-table"><tbody>${rows}</tbody></table>
    <p class="note"><a href="knowledge.html#files">Що означає кожен системний файл — в енциклопедії ▸</a></p></section>` : '';
}

function deepPanels(os) {
  const props = os.props || {};
  const rows = PROP_LABELS.filter(([k]) => props[k]).map(([k, l]) => row(l, esc(props[k]))).join('');
  const eds = (os.editions || []);
  let html = techPanel(os);
  if (rows || eds.length) html += `<div class="detail-cols">
    ${rows ? `<section class="panel"><h3 class="panel-title">ДОДАТКОВІ ВЛАСТИВОСТІ</h3><dl class="spec-table">${rows}</dl></section>` : ''}
    ${eds.length ? `<section class="panel"><h3 class="panel-title">РЕДАКЦІЇ (${eds.length})</h3><div class="os-tags">${eds.map(e => `<span class="tag">${esc(e)}</span>`).join('')}</div></section>` : ''}
  </div>`;
  const feats = os.features || [];
  if (feats.length) {
    const groups = {};
    feats.forEach(f => (groups[f.category] ||= []).push(f.name));
    html += `<section class="panel panel-wide"><h3 class="panel-title">ФУНКЦІЇ ЦІЄЇ ВЕРСІЇ (${feats.length})</h3>
      ${Object.entries(groups).map(([c, n]) => `<div class="feat-group"><div class="feat-group-title">${esc(c)}</div><div class="os-tags">${n.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div></div>`).join('')}
      <p class="note"><a href="features.html">Подивитись матрицю можливостей усіх версій ▸</a></p></section>`;
  }
  return html;
}

function row(k, v) { return `<div><dt>${k}</dt><dd>${v}</dd></div>`; }

function render(os, all) {
  document.title = os.name + ' — Windows Evolution';
  document.getElementById('crumb').textContent = os.name.toUpperCase();
  const i = all.findIndex(o => o.slug === os.slug);
  const prev = all[i - 1], next = all[i + 1];

  root.innerHTML = `
  <header class="detail-hero">
    <div class="detail-side">
      <div class="detail-year">${esc((os.release_date || '').slice(0, 4))}</div>
      <div class="os-thumb os-thumb-big" data-slug="${esc(os.slug)}">${OsImages.placeholder}<span class="os-thumb-hint">Додай власне зображення: images/os/${esc(os.slug)}.png</span></div>
    </div>
    <div>
      <h1 class="page-title">${esc(os.name)}</h1>
      <div class="os-tags">
        <span class="tag tag-cat">${CATEGORY[os.category] || 'ПК'}</span>
        <span class="tag">${LINE[os.line] || esc(os.line)}</span>
        ${os.bits ? `<span class="tag">${esc(os.bits)}-BIT</span>` : ''}
        ${badge(os)}
      </div>
      <p class="page-lead">${esc(os.summary || '')}</p>
    </div>
  </header>

  <div class="detail-cols">
    <section class="panel">
      <h3 class="panel-title">ТЕХНІЧНІ ХАРАКТЕРИСТИКИ</h3>
      <dl class="spec-table">
        ${row(os.category === 'beta' ? 'Дата (бета / анонс)' : 'Дата виходу', fmtDate(os.release_date))}
        ${row('Версія', val(os.version))}
        ${row('Збірка', val(os.build))}
        ${row('Ядро / тип', val(os.kernel))}
        ${row('Архітектура', val(os.architecture))}
        ${row('Файлові системи', val(os.file_systems))}
        ${row('DirectX', val(os.directx))}
        ${row('Кінець підтримки', os.support_status === 'prerelease' ? 'не застосовується' : fmtDate(os.support_end))}
      </dl>
    </section>
    <section class="panel">
      <h3 class="panel-title">СИСТЕМНІ ВИМОГИ</h3>
      <table class="req-table">
        <thead><tr><th></th><th>МІНІМАЛЬНІ</th><th>РЕКОМЕНДОВАНІ</th></tr></thead>
        <tbody>
          <tr><th>Процесор</th><td>${val(os.min_cpu_text)}</td><td>${val(os.rec_cpu_text)}</td></tr>
          <tr><th>RAM</th><td>${fmtMb(os.min_ram_mb)}</td><td>${fmtMb(os.rec_ram_mb)}</td></tr>
          <tr><th>Диск</th><td>${fmtMb(os.min_disk_mb)}</td><td>${fmtMb(os.rec_disk_mb)}</td></tr>
        </tbody>
      </table>
      ${os.disk_text ? `<p class="note">${esc(os.disk_text)}</p>` : ''}
    </section>
  </div>

  <div class="detail-cols">
    <section class="panel"><h3 class="panel-title">ІНТЕРФЕЙС</h3><p>${val(os.ui_summary)}</p></section>
    <section class="panel"><h3 class="panel-title">БЕЗПЕКА</h3><p>${val(os.security_summary)}</p></section>
    <section class="panel"><h3 class="panel-title">ПРОДУКТИВНІСТЬ</h3><p>${val(os.performance_note)}</p></section>
  </div>

  ${deepPanels(os)}

  ${os.significance ? `<section class="panel panel-wide"><h3 class="panel-title">ІСТОРИЧНЕ ЗНАЧЕННЯ</h3><p>${esc(os.significance)}</p></section>` : ''}

  <div class="detail-cols">
    ${list('НОВОВВЕДЕННЯ', os.innovation, 'p-innov')}
    ${list('ЦІКАВІ ФАКТИ', os.fact, 'p-fact')}
  </div>
  <div class="detail-cols">
    ${list('ПЕРЕВАГИ', os.pro, 'p-pro')}
    ${list('НЕДОЛІКИ', os.con, 'p-con')}
  </div>

  ${(os.data_note || os.source) ? `<section class="panel panel-wide panel-source"><h3 class="panel-title">ДЖЕРЕЛА Й ПРИМІТКИ</h3>
    ${os.data_note ? `<p>${esc(os.data_note)}</p>` : ''}
    ${os.source ? `<p><a href="${esc(os.source)}" target="_blank" rel="noopener noreferrer">${esc(os.source)}</a></p>` : ''}</section>` : ''}

  <nav class="pager">
    ${prev ? `<a class="px-btn px-btn-ghost" href="details.html?slug=${encodeURIComponent(prev.slug)}">◂ ${esc(prev.name)}</a>` : '<span></span>'}
    <a class="px-btn" href="compare.html?add=${encodeURIComponent(os.slug)}">ПОРІВНЯТИ</a>
    ${next ? `<a class="px-btn px-btn-ghost" href="details.html?slug=${encodeURIComponent(next.slug)}">${esc(next.name)} ▸</a>` : '<span></span>'}
  </nav>`;
  OsImages.hydrate(root, [os], true);
}

async function init() {
  if (!slug) { root.innerHTML = '<div class="os-message is-error">Не вказано версію Windows. Обери її в <a href="catalog.html">каталозі</a>.</div>'; return; }
  try {
    const [r1, r2] = await Promise.all([
      fetch('/api/os/' + encodeURIComponent(slug)),
      fetch('/api/os?sort=date&order=asc')
    ]);
    if (r1.status === 404) { root.innerHTML = '<div class="os-message is-error">Такої операційної системи немає в базі. Поверніться до <a href="catalog.html">каталогу</a>.</div>'; return; }
    if (!r1.ok || !r2.ok) throw new Error('HTTP ' + (r1.ok ? r2.status : r1.status));
    render(await r1.json(), await r2.json());
  } catch (err) {
    console.error(err);
    root.innerHTML = '<div class="os-message is-error">Не вдалося завантажити дані: ' + esc(err.message) + '</div>';
  }
}
init();
