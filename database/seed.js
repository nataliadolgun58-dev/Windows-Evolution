// Початкове наповнення бази: data/windows.js, betas.js, extra.js, more.js
// Запуск: npm run seed   (додає лише відсутні версії, наявні не змінює)
// Перевірка файлів проєкту перед записом у базу
const preflight = require('../scripts/check');
{ const problems = preflight.check(); if (problems.length) { preflight.report(problems); process.exit(1); } }

const db = require('./db');
const data = [...require('./data/windows'), ...require('./data/betas'), ...require('./data/extra'), ...require('./data/more')];

async function main() {
await db.init();


const cols = [
  'slug','name','line','category','kernel','release_date','version','build','architecture','bits',
  'min_cpu_text','min_cpu_mhz','rec_cpu_text','min_ram_mb','rec_ram_mb','min_disk_mb','rec_disk_mb',
  'disk_text','directx','file_systems','support_end','support_status','ui_summary',
  'security_summary','performance_note','summary','significance','data_note','source'
];

const insertOs = db.prepare(
  `INSERT OR IGNORE INTO os_versions (${cols.join(',')}) VALUES (${cols.map(c => '@' + c).join(',')})`
);
const getId = db.prepare('SELECT id FROM os_versions WHERE slug = ?');
const insertItem = db.prepare('INSERT INTO os_items (os_id, kind, text, sort) VALUES (?,?,?,?)');

const run = db.transaction(() => {
  let added = 0;
  for (const os of data) {
    const row = {};
    cols.forEach(c => { row[c] = os[c] === undefined ? null : os[c]; });
    row.category = os.category || 'desktop';
    const res = insertOs.run(row);
    if (res.changes === 0) continue;
    added++;
    const id = getId.get(os.slug).id;
    for (const kind of ['innovation', 'fact', 'pro', 'con']) {
      (os[kind] || []).forEach((t, i) => insertItem.run(id, kind, t, i));
    }
  }
  return added;
});


// ===== Поглиблені дані (властивості, редакції, матриця можливостей) =====
// Це довідкові дані: вони повністю відновлюються при кожному запуску seed.
const deep = require('./data/deep');
const deepRun = db.transaction(() => {
  ['os_feature_support', 'os_features', 'os_props', 'os_editions'].forEach(t => db.exec(`DELETE FROM ${t}`));
  const idBySlug = Object.fromEntries(db.prepare('SELECT slug, id FROM os_versions').all().map(r => [r.slug, r.id]));
  const dateBySlug = Object.fromEntries(db.prepare('SELECT slug, release_date d FROM os_versions').all().map(r => [r.slug, r.d]));
  // Матриця охоплює лише версії, для яких є перевірені дані (імпортовані користувачем сюди не потрапляють)
  const desktop = Object.keys(deep.props).filter(s => idBySlug[s]).sort((a, b) => dateBySlug[a].localeCompare(dateBySlug[b]));
  const insProp = db.prepare('INSERT INTO os_props (os_id, key, value) VALUES (?,?,?)');
  const insEd = db.prepare('INSERT INTO os_editions (os_id, name, sort) VALUES (?,?,?)');
  const insFeat = db.prepare('INSERT INTO os_features (name, category, description, sort) VALUES (?,?,?,?)');
  const insSup = db.prepare('INSERT OR IGNORE INTO os_feature_support (feature_id, os_id) VALUES (?,?)');
  const getFeat = db.prepare('SELECT id FROM os_features WHERE name = ?');
  let props = 0, eds = 0, feats = 0, links = 0;
  for (const [slug, kv] of Object.entries(deep.props)) {
    if (!idBySlug[slug]) continue;
    for (const [k, v] of Object.entries(kv)) { insProp.run(idBySlug[slug], k, v); props++; }
  }
  const tech = require('./data/tech');
  for (const [slug, kv] of Object.entries(tech)) {
    if (!idBySlug[slug]) continue;
    for (const [k, v] of Object.entries(kv)) { insProp.run(idBySlug[slug], k, v); props++; }
  }
  const bit = require('./data/bitness');
  for (const [slug, v] of Object.entries(bit)) {
    if (idBySlug[slug]) { insProp.run(idBySlug[slug], 'bitness', v); props++; }
  }
  for (const [slug, list] of Object.entries(deep.editions)) {
    if (!idBySlug[slug]) continue;
    list.forEach((n, i) => { insEd.run(idBySlug[slug], n, i); eds++; });
  }
  deep.features.forEach((f, i) => {
    for (const s of [f.from, f.until, ...(f.except || []), ...(f.extra || [])].filter(Boolean)) {
      if (!idBySlug[s]) throw new Error(`deep.js: невідомий slug "${s}" у функції "${f.name}"`);
    }
    insFeat.run(f.name, f.cat, f.desc, i); feats++;
    const fid = getFeat.get(f.name).id;
    const from = dateBySlug[f.from], until = f.until ? dateBySlug[f.until] : null;
    desktop.filter(s => dateBySlug[s] >= from && (!until || dateBySlug[s] <= until) && !(f.except || []).includes(s))
      .concat(f.extra || []).forEach(s => { insSup.run(fid, idBySlug[s]); links++; });
  });
  return { props, eds, feats, links };
});
// ===== Енциклопедія (системні файли, словник, причини популярності, частки ринку) =====
const kn = require('./data/knowledge');
const knRun = db.transaction(() => {
  ['os_components', 'glossary', 'reasons', 'market_share'].forEach(t => db.exec(`DELETE FROM ${t}`));
  const c = db.prepare('INSERT INTO os_components (file, name, kind, location, description, since, sort) VALUES (?,?,?,?,?,?,?)');
  const g = db.prepare('INSERT INTO glossary (term, category, definition, sort) VALUES (?,?,?,?)');
  const r = db.prepare('INSERT INTO reasons (kind, title, body, sort) VALUES (?,?,?,?)');
  const m = db.prepare('INSERT INTO market_share (source, scope, period, os_name, percent, note) VALUES (?,?,?,?,?,?)');
  kn.components.forEach((x, i) => c.run(x.file, x.name, x.kind, x.location, x.description, x.since, i));
  kn.glossary.forEach((x, i) => g.run(x.term, x.category, x.definition, i));
  kn.reasons.forEach((x, i) => r.run(x.kind, x.title, x.body, i));
  kn.market.forEach(x => m.run(x.source, x.scope, x.period, x.os_name, x.percent, x.note));
  return { c: kn.components.length, g: kn.glossary.length, r: kn.reasons.length, m: kn.market.length };
});
const added = run();
const total = db.prepare('SELECT COUNT(*) n FROM os_versions').get().n;
console.log(`Додано версій: ${added}. Усього в базі: ${total}.`);
const d = deepRun();
const kr = knRun();
console.log(`Енциклопедія: системних файлів ${kr.c}, термінів ${kr.g}, пояснень ${kr.r}, записів ринку ${kr.m}.`);
console.log(`Поглиблені дані: властивостей ${d.props}, редакцій ${d.eds}, функцій ${d.feats}, звʼязків «функція–версія» ${d.links}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
