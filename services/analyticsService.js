// Аналітика: усі числа рахуються з бази даних.
const db = require('../database/db');

function counts(col, where = '1=1') {
  return db.prepare(`SELECT ${col} AS key, COUNT(*) AS n FROM os_versions WHERE ${where} GROUP BY ${col} ORDER BY n DESC`).all();
}

function overview() {
  const points = db.prepare(`SELECT slug, name, line, category, release_date, support_status,
      min_ram_mb, rec_ram_mb, min_disk_mb, rec_disk_mb, min_cpu_mhz
    FROM os_versions ORDER BY release_date ASC, id ASC`).all();

  // Зростання мінімальних вимог серед ПК-версій, де є дані
  const growth = {};
  for (const [key, field] of [['ram', 'min_ram_mb'], ['disk', 'min_disk_mb'], ['cpu', 'min_cpu_mhz']]) {
    const rows = points.filter(p => p.category === 'desktop' && p[field] !== null);
    if (rows.length >= 2) {
      const a = rows[0], b = rows[rows.length - 1];
      growth[key] = { from: { name: a.name, value: a[field] }, to: { name: b.name, value: b[field] },
                      factor: Math.round(b[field] / a[field]) };
    }
  }
  return {
    points,
    byCategory: counts('category'),
    byLine: counts('line', "category <> 'beta'"),
    byStatus: counts('support_status', "category <> 'beta'"),
    byDecade: db.prepare(`SELECT substr(release_date,1,3) || '0' AS key, COUNT(*) AS n
      FROM os_versions WHERE category <> 'beta' GROUP BY key ORDER BY key`).all(),
    growth,
    total: points.length
  };
}

module.exports = { overview };
