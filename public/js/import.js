// Імпорт: вибір файлу -> перевірка на сервері -> звіт -> запис у базу.
const $ = id => document.getElementById(id);
const el = { drop: $('drop'), text: $('dropText'), file: $('file'), check: $('check'), run: $('run'), msg: $('message'), report: $('report') };
let file = null, checked = false;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function msg(text, kind) { el.msg.hidden = !text; el.msg.className = 'os-message' + (kind === 'error' ? ' is-error' : kind === 'ok' ? ' is-ok' : ''); el.msg.textContent = text || ''; }

function setFile(f) {
  msg('', ''); el.report.innerHTML = ''; checked = false; el.run.disabled = true;
  if (!f) { file = null; el.check.disabled = true; el.text.textContent = 'Перетягни файл сюди або натисни, щоб обрати'; return; }
  if (!/\.(csv|json|xlsx)$/i.test(f.name)) { setFile(null); msg('Непідтримуваний формат. Дозволено: CSV, JSON, XLSX.', 'error'); return; }
  if (f.size > 2 * 1024 * 1024) { setFile(null); msg('Файл завеликий. Максимум — 2 МБ.', 'error'); return; }
  file = f; el.check.disabled = false;
  el.text.textContent = `${f.name} (${(f.size / 1024).toFixed(1)} КБ)`;
}

async function send(url) {
  const fd = new FormData(); fd.append('file', file);
  const res = await fetch(url, { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
}

function table(head, rows) {
  return `<div class="cmp-wrap"><table class="cmp"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function showReport(d) {
  const stat = (v, l, cls = '') => `<div class="kpi ${cls}"><div class="kpi-v">${v}</div><div class="kpi-l">${l}</div></div>`;
  let html = `<div class="kpis">${stat(d.total, 'рядків у файлі')}${stat(d.committed ? d.added : d.valid, d.committed ? 'додано в базу' : 'готові до імпорту')}${stat(d.invalid, 'з помилками', d.invalid ? 'kpi-bad' : '')}${stat(d.skipped, 'пропущено (вже є / дубль)')}</div>`;
  if (d.unknownColumns.length) html += `<p class="note">Невідомі колонки проігноровано: ${d.unknownColumns.map(esc).join(', ')}</p>`;
  if (d.problems.length) html += `<section class="panel"><h3 class="panel-title">ПОМИЛКИ</h3>${table(['РЯДОК', 'SLUG', 'ПОЛЕ', 'ПОМИЛКА'],
    d.problems.map(p => `<tr><td>${p.line}</td><td>${esc(p.slug)}</td><td>${esc(p.field)}</td><td>${esc(p.message)}</td></tr>`))}</section>`;
  if (d.skippedRows.length) html += `<section class="panel"><h3 class="panel-title">ПРОПУЩЕНО</h3>${table(['РЯДОК', 'SLUG', 'ПРИЧИНА'],
    d.skippedRows.map(p => `<tr><td>${p.line}</td><td>${esc(p.slug)}</td><td>${esc(p.message)}</td></tr>`))}</section>`;
  if (!d.committed && d.preview.length) html += `<section class="panel"><h3 class="panel-title">ПРИКЛАД ДАНИХ, ЩО БУДУТЬ ДОДАНІ</h3>${table(['SLUG', 'НАЗВА', 'ДАТА'],
    d.preview.map(p => `<tr><td>${esc(p.slug)}</td><td>${esc(p.name)}</td><td>${esc(p.release_date)}</td></tr>`))}</section>`;
  el.report.innerHTML = html;
}

async function act(kind, btn) {
  const label = btn.textContent; btn.disabled = true; btn.textContent = 'ЗАЧЕКАЙ…'; msg('', '');
  try {
    const d = await send(kind === 'check' ? '/api/import/preview' : '/api/import');
    showReport(d);
    if (kind === 'check') {
      checked = true; el.run.disabled = d.valid === 0;
      msg(d.valid ? `Перевірку завершено: ${d.valid} з ${d.total} рядків можна імпортувати.${d.invalid ? ' Рядки з помилками не будуть додані.' : ''}` : 'Жодного рядка не можна імпортувати. Виправ файл і перевір ще раз.', d.valid ? 'ok' : 'error');
    } else {
      el.run.disabled = true; el.check.disabled = true;
      msg(d.added ? `Готово! Додано версій: ${d.added}. Подивись їх у каталозі.` : 'Нічого не додано.', d.added ? 'ok' : 'error');
    }
  } catch (err) {
    console.error(err); msg(err.message, 'error');
  } finally { btn.textContent = label; if (kind === 'check') btn.disabled = !file; }
}

el.drop.addEventListener('click', () => el.file.click());
el.drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.file.click(); } });
el.file.addEventListener('change', () => setFile(el.file.files[0]));
['dragenter', 'dragover'].forEach(t => el.drop.addEventListener(t, e => { e.preventDefault(); el.drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => el.drop.addEventListener(t, e => { e.preventDefault(); el.drop.classList.remove('over'); }));
el.drop.addEventListener('drop', e => setFile(e.dataTransfer.files[0]));
el.check.addEventListener('click', () => act('check', el.check));
el.run.addEventListener('click', () => { if (checked) act('run', el.run); });
