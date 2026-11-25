// Імпорт CSV / JSON / XLSX: розбір файлу, валідація, запис у базу.
const { parse } = require('csv-parse/sync');
const ExcelJS = require('exceljs');
const db = require('../database/db');
const { validateRow, COLUMNS, LIST_FIELDS } = require('../utils/validation');
const { HttpError } = require('../utils/errorHandler');

const MAX_ROWS = 500;
const norm = h => String(h).replace(/^\uFEFF/, '').trim().toLowerCase();

function cellText(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map(t => t.text).join('');
    if (v.result !== undefined) return cellText(v.result);
    if (v.text !== undefined) return cellText(v.text);
    return '';
  }
  return v;
}

async function parseFile(file) {
  const ext = (file.originalname.split('.').pop() || '').toLowerCase();
  const buf = file.buffer;
  let rows;
  try {
    if (ext === 'csv') {
      let text = buf.toString('utf8');
      const delim = (text.split(/\r?\n/)[0] || '').split(';').length > (text.split(/\r?\n/)[0] || '').split(',').length ? ';' : ',';
      rows = parse(text, { columns: h => h.map(norm), skip_empty_lines: true, bom: true, trim: true, delimiter: delim });
    } else if (ext === 'json') {
      let data = JSON.parse(buf.toString('utf8'));
      if (data && !Array.isArray(data) && Array.isArray(data.items)) data = data.items;
      if (!Array.isArray(data)) throw new Error('очікується масив обʼєктів');
      rows = data.map(o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [norm(k), v])));
    } else if (ext === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('у файлі немає аркушів');
      const head = [];
      ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => { head[i] = norm(cellText(c.value)); });
      rows = [];
      ws.eachRow((r, n) => {
        if (n === 1) return;
        const o = {}; let any = false;
        head.forEach((h, i) => { if (!h) return; const v = cellText(r.getCell(i).value); o[h] = v; if (v !== '') any = true; });
        if (any) rows.push(o);
      });
    } else {
      throw new HttpError(400, 'Непідтримуваний формат. Дозволено: CSV, JSON, XLSX');
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, `Не вдалося прочитати файл ${ext.toUpperCase()}: ${e.message}`);
  }
  if (!rows.length) throw new HttpError(400, 'У файлі немає жодного рядка з даними');
  if (rows.length > MAX_ROWS) throw new HttpError(400, `Забагато рядків: ${rows.length}. Максимум за один імпорт — ${MAX_ROWS}`);
  const known = new Set(COLUMNS);
  const present = new Set(rows.flatMap(r => Object.keys(r)));
  if (!['slug', 'name'].every(c => present.has(c))) throw new HttpError(400, 'У файлі немає обовʼязкових колонок slug і name. Завантаж шаблон і заповни його.');
  return { rows, unknownColumns: [...present].filter(c => !known.has(c)) };
}

// Перевірка без запису (dryRun) або з записом валідних рядків
async function process(file, commit) {
  const { rows, unknownColumns } = await parseFile(file);
  const existing = new Set(db.prepare('SELECT slug FROM os_versions').all().map(r => r.slug));
  const seen = new Set();
  const ready = [], problems = [], skipped = [];

  rows.forEach((raw, i) => {
    const line = i + 2; // у таблиці перший рядок — заголовок
    const { row, errors } = validateRow(raw);
    if (!errors.length) {
      if (existing.has(row.slug)) { skipped.push({ line, slug: row.slug, message: 'Така версія вже є в базі — пропущено' }); return; }
      if (seen.has(row.slug)) { skipped.push({ line, slug: row.slug, message: 'Дубль slug у файлі — пропущено' }); return; }
      seen.add(row.slug); ready.push(row);
    } else {
      errors.forEach(e => problems.push({ line, slug: raw.slug || '', field: e.field, message: e.message }));
    }
  });

  let added = 0;
  if (commit && ready.length) {
    const cols = COLUMNS.filter(c => !LIST_FIELDS.includes(c));
    const ins = db.prepare(`INSERT INTO os_versions (${cols.join(',')}) VALUES (${cols.map(c => '@' + c).join(',')})`);
    const getId = db.prepare('SELECT id FROM os_versions WHERE slug = ?');
    const insItem = db.prepare('INSERT INTO os_items (os_id, kind, text, sort) VALUES (?,?,?,?)');
    db.transaction(() => {
      for (const r of ready) {
        const p = {}; cols.forEach(c => { p[c] = r[c] === undefined ? null : r[c]; });
        ins.run(p);
        const id = getId.get(r.slug).id;
        LIST_FIELDS.forEach(k => r[k].forEach((t, n) => insItem.run(id, k, t, n)));
        added++;
      }
    })();
  }
  const badLines = new Set(problems.map(p => p.line));
  return { committed: !!commit, total: rows.length, valid: ready.length, added,
    invalid: badLines.size, skipped: skipped.length, problems, skippedRows: skipped, unknownColumns,
    preview: ready.slice(0, 5).map(r => ({ slug: r.slug, name: r.name, release_date: r.release_date })) };
}

// Шаблон з прикладом (формат збігається з очікуваним)
const SAMPLE = { slug: 'example-os', name: 'Приклад ОС', line: 'NT', category: 'desktop', release_date: '2030-01-01',
  support_status: 'prerelease', version: '1.0', bits: 64, min_ram_mb: 2048, min_disk_mb: 20480,
  summary: 'Короткий опис', innovation: 'Перше нововведення | Друге нововведення', pro: 'Перевага', con: 'Недолік' };

async function template(kind) {
  if (kind === 'json') return { type: 'application/json', name: 'windows-import-template.json',
    data: Buffer.from(JSON.stringify([{ ...SAMPLE, innovation: ['Перше нововведення', 'Друге нововведення'], pro: ['Перевага'], con: ['Недолік'] }], null, 2), 'utf8') };
  if (kind === 'csv') {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return { type: 'text/csv; charset=utf-8', name: 'windows-import-template.csv',
      data: Buffer.from('\uFEFF' + COLUMNS.join(',') + '\r\n' + COLUMNS.map(c => esc(SAMPLE[c])).join(',') + '\r\n', 'utf8') };
  }
  if (kind === 'xlsx') {
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Імпорт');
    ws.addRow(COLUMNS); ws.addRow(COLUMNS.map(c => SAMPLE[c] ?? ''));
    ws.getRow(1).font = { bold: true }; ws.columns.forEach(c => { c.width = 18; });
    ws.getColumn(6).numFmt = '@';
    return { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'windows-import-template.xlsx', data: Buffer.from(await wb.xlsx.writeBuffer()) };
  }
  throw new HttpError(404, 'Невідомий формат шаблону');
}

module.exports = { process, template };
