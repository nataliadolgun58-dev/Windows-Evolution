// Робота з даними ОС у базі
const db = require('../database/db');

const SORTABLE = {
  date: 'release_date', name: 'name', ram: 'min_ram_mb', disk: 'min_disk_mb', cpu: 'min_cpu_mhz'
};

function attachItems(rows) {
  if (!rows.length) return rows;
  const ids = rows.map(r => r.id);
  const items = db.prepare(
    `SELECT os_id, kind, text FROM os_items WHERE os_id IN (${ids.map(() => '?').join(',')}) ORDER BY os_id, kind, sort`
  ).all(...ids);
  const map = new Map(rows.map(r => [r.id, { innovation: [], fact: [], pro: [], con: [] }]));
  items.forEach(i => map.get(i.os_id)[i.kind].push(i.text));
  return rows.map(r => ({ ...r, ...map.get(r.id) }));
}

function attachDeep(rows) {
  if (!rows.length) return rows;
  const ids = rows.map(r => r.id), ph = ids.map(() => '?').join(',');
  const eds = db.prepare(`SELECT os_id, name FROM os_editions WHERE os_id IN (${ph}) ORDER BY os_id, sort`).all(...ids);
  const props = db.prepare(`SELECT os_id, key, value FROM os_props WHERE os_id IN (${ph})`).all(...ids);
  const feats = db.prepare(`SELECT s.os_id, f.name, f.category FROM os_feature_support s JOIN os_features f ON f.id = s.feature_id
    WHERE s.os_id IN (${ph}) ORDER BY s.os_id, f.sort`).all(...ids);
  return rows.map(r => ({
    ...r,
    editions: eds.filter(e => e.os_id === r.id).map(e => e.name),
    props: Object.fromEntries(props.filter(p => p.os_id === r.id).map(p => [p.key, p.value])),
    features: feats.filter(f => f.os_id === r.id).map(f => ({ name: f.name, category: f.category }))
  }));
}

function list({ q, line, status, category, sort = 'date', order = 'asc' } = {}) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(name LIKE ? OR summary LIKE ? OR version LIKE ? OR build LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (line) { where.push('line = ?'); params.push(line); }
  if (status) { where.push('support_status = ?'); params.push(status); }
  if (category) { where.push('category = ?'); params.push(category); }
  const col = SORTABLE[sort] || SORTABLE.date;
  const dir = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const sql = `SELECT * FROM os_versions ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY ${col} IS NULL, ${col} ${dir}, release_date ${dir}, id ${dir}`;
  return attachDeep(attachItems(db.prepare(sql).all(...params)));
}

function getBySlug(slug) {
  const row = db.prepare('SELECT * FROM os_versions WHERE slug = ?').get(slug);
  return row ? attachDeep(attachItems([row]))[0] : null;
}

function getManyBySlugs(slugs) {
  if (!slugs.length) return [];
  const rows = db.prepare(
    `SELECT * FROM os_versions WHERE slug IN (${slugs.map(() => '?').join(',')})`
  ).all(...slugs);
  const ordered = slugs.map(s => rows.find(r => r.slug === s)).filter(Boolean);
  return attachDeep(attachItems(ordered));
}

function stats() {
  // Основні показники рахуємо за випущеними системами (без бета-збірок)
  const t = db.prepare(`SELECT COUNT(*) total,
      SUM(support_status='supported') supported,
      MIN(release_date) first_date,
      SUM(line='NT') nt, SUM(line='DOS') dos
      FROM os_versions WHERE category <> 'beta'`).get();
  const cats = { desktop: 0, beta: 0, server: 0, device: 0 };
  db.prepare('SELECT category, COUNT(*) n FROM os_versions GROUP BY category').all()
    .forEach(r => { cats[r.category] = r.n; });
  const firstYear = t.first_date ? Number(t.first_date.slice(0, 4)) : null;
  return {
    totalSystems: t.total,
    supportedSystems: t.supported || 0,
    ntSystems: t.nt || 0,
    dosSystems: t.dos || 0,
    byCategory: cats,
    betaSystems: cats.beta,
    firstYear,
    evolutionYears: firstYear ? new Date().getFullYear() - firstYear : 0,
    maxCompare: 4,
    importFormats: ['CSV', 'JSON', 'XLSX']
  };
}

module.exports = { list, getBySlug, getManyBySlugs, stats };
