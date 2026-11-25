// Перевірка рядків імпорту. Повертає { row, errors } для кожного рядка.
const LINES = ['DOS', 'NT', 'CE'];
const CATEGORIES = ['desktop', 'beta', 'server', 'device'];
const STATUSES = ['supported', 'ended', 'prerelease'];
const LIST_FIELDS = ['innovation', 'fact', 'pro', 'con'];
const NUM_FIELDS = ['min_cpu_mhz', 'min_ram_mb', 'rec_ram_mb', 'min_disk_mb', 'rec_disk_mb'];
const TEXT_FIELDS = ['name', 'kernel', 'version', 'build', 'architecture', 'min_cpu_text', 'rec_cpu_text',
  'disk_text', 'directx', 'file_systems', 'ui_summary', 'security_summary', 'performance_note',
  'summary', 'significance', 'data_note', 'source'];
const COLUMNS = ['slug', 'name', 'line', 'category', 'kernel', 'release_date', 'version', 'build', 'architecture', 'bits',
  'min_cpu_text', 'min_cpu_mhz', 'rec_cpu_text', 'min_ram_mb', 'rec_ram_mb', 'min_disk_mb', 'rec_disk_mb',
  'disk_text', 'directx', 'file_systems', 'support_end', 'support_status', 'ui_summary', 'security_summary',
  'performance_note', 'summary', 'significance', 'data_note', 'source', ...LIST_FIELDS];
const REQUIRED = ['slug', 'name', 'line', 'release_date', 'support_status'];

const empty = v => v === undefined || v === null || String(v).trim() === '';
function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s && +s.slice(0, 4) >= 1980 && +s.slice(0, 4) <= 2100;
}
function toList(v) {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
  if (empty(v)) return [];
  return String(v).split('|').map(x => x.trim()).filter(Boolean);
}

function validateRow(raw) {
  const errors = [];
  const row = {};
  for (const c of COLUMNS) row[c] = raw[c];

  for (const f of REQUIRED) if (empty(row[f])) errors.push({ field: f, message: 'Обовʼязкове поле порожнє' });

  if (!empty(row.slug)) {
    row.slug = String(row.slug).trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(row.slug)) errors.push({ field: 'slug', message: 'Дозволені лише латинські літери, цифри та дефіс (до 60 символів)' });
  }
  if (!empty(row.name) && String(row.name).trim().length > 120) errors.push({ field: 'name', message: 'Назва задовга (максимум 120 символів)' });

  if (!empty(row.line)) {
    row.line = String(row.line).trim().toUpperCase();
    if (!LINES.includes(row.line)) errors.push({ field: 'line', message: 'Значення має бути DOS, NT або CE' });
  }
  row.category = empty(row.category) ? 'desktop' : String(row.category).trim().toLowerCase();
  if (!CATEGORIES.includes(row.category)) errors.push({ field: 'category', message: 'Значення має бути desktop, beta, server або device' });

  if (!empty(row.support_status)) {
    row.support_status = String(row.support_status).trim().toLowerCase();
    if (!STATUSES.includes(row.support_status)) errors.push({ field: 'support_status', message: 'Значення має бути supported, ended або prerelease' });
  }
  for (const f of ['release_date', 'support_end']) {
    if (empty(row[f])) { row[f] = null; continue; }
    row[f] = String(row[f]).trim();
    if (!validDate(row[f])) errors.push({ field: f, message: 'Дата має бути у форматі РРРР-ММ-ДД (наприклад 1995-08-24)' });
  }
  for (const f of NUM_FIELDS) {
    if (empty(row[f])) { row[f] = null; continue; }
    const n = Number(String(row[f]).replace(',', '.'));
    if (!isFinite(n) || n < 0 || n > 10000000) errors.push({ field: f, message: 'Має бути невідʼємне число' });
    row[f] = n;
  }
  if (empty(row.bits)) row.bits = null;
  else {
    const n = Number(row.bits);
    if (![8, 16, 32, 64].includes(n)) errors.push({ field: 'bits', message: 'Розрядність має бути 8, 16, 32 або 64' });
    row.bits = n;
  }
  for (const f of TEXT_FIELDS) {
    if (empty(row[f])) { row[f] = null; continue; }
    row[f] = String(row[f]).trim();
    if (row[f].length > 2000) errors.push({ field: f, message: 'Текст задовгий (максимум 2000 символів)' });
  }
  for (const f of LIST_FIELDS) {
    row[f] = toList(row[f]);
    if (row[f].some(x => x.length > 500) || row[f].length > 30) errors.push({ field: f, message: 'Занадто довгий список (до 30 пунктів по 500 символів)' });
  }
  return { row, errors };
}

module.exports = { validateRow, COLUMNS, REQUIRED, LIST_FIELDS };
