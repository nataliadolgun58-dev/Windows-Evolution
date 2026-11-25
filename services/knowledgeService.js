// Енциклопедія: усе береться з бази даних.
const db = require('../database/db');

function overview() {
  const components = db.prepare('SELECT file, name, kind, location, description, since FROM os_components ORDER BY sort').all();
  const glossary = db.prepare('SELECT term, category, definition FROM glossary ORDER BY sort').all();
  const reasons = db.prepare('SELECT kind, title, body FROM reasons ORDER BY sort').all();
  const rows = db.prepare('SELECT source, scope, period, os_name, percent, note FROM market_share ORDER BY scope, period, percent DESC').all();
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.source}|${r.scope}|${r.period}`;
    if (!groups.has(key)) groups.set(key, { source: r.source, scope: r.scope, period: r.period, items: [] });
    groups.get(key).items.push({ name: r.os_name, percent: r.percent, note: r.note });
  }
  return { components, glossary, reasons, market: [...groups.values()] };
}

module.exports = { overview };
