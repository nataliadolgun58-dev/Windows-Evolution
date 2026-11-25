// Підключення до SQLite через sql.js (чистий JavaScript/WebAssembly).
// Не потребує компіляції та Visual C++ Build Tools.
// Обгортка має той самий інтерфейс, що й better-sqlite3:
//   db.prepare(sql).get/all/run(...), db.exec(sql), db.transaction(fn).
// Базу потрібно ініціалізувати один раз: await db.init()
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'windows.db');

let SQL = null;
let raw = null;          // екземпляр бази sql.js
let depth = 0;           // вкладеність транзакцій
let saveTimer = null;

// better-sqlite3 приймає або позиційні параметри, або об'єкт {name: value}
function toBind(args) {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const out = {};
    for (const [k, v] of Object.entries(args[0])) out['@' + k] = v === undefined ? null : v;
    return out;
  }
  const list = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  return list.map(v => (v === undefined ? null : v));
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!raw) return;
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, Buffer.from(raw.export()));
  fs.renameSync(tmp, DB_PATH);
}

function scheduleSave() {
  if (depth > 0 || saveTimer) return;
  saveTimer = setTimeout(save, 150);
}

const db = {
  async init() {
    if (raw) return db;
    SQL = await initSqlJs();
    raw = fs.existsSync(DB_PATH)
      ? new SQL.Database(fs.readFileSync(DB_PATH))
      : new SQL.Database();
    raw.run('PRAGMA foreign_keys = ON');
    db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    // Міграція старих баз: потрібні колонка category та нові дозволені значення
    // (лінія CE, статус prerelease). Дані й id зберігаються.
    const tbl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='os_versions'").get();
    if (tbl && (!tbl.sql.includes('category') || !tbl.sql.includes("'CE'") || !tbl.sql.includes("'prerelease'"))) {
      const oldCols = db.prepare('PRAGMA table_info(os_versions)').all().map(c => c.name);
      raw.run('PRAGMA foreign_keys = OFF');
      raw.run('PRAGMA legacy_alter_table = ON');
      raw.exec('DROP INDEX IF EXISTS idx_os_release');
      raw.exec('ALTER TABLE os_versions RENAME TO os_versions_old');
      raw.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
      const newCols = db.prepare('PRAGMA table_info(os_versions)').all().map(c => c.name);
      const common = newCols.filter(c => oldCols.includes(c) && c !== 'category');
      const hasCat = oldCols.includes('category');
      raw.exec(`INSERT INTO os_versions (${common.join(',')}, category)
        SELECT ${common.join(',')}, ${hasCat ? "CASE WHEN category IN ('desktop','beta','server','device') THEN category ELSE 'desktop' END" : "'desktop'"}
        FROM os_versions_old`);
      raw.exec('DROP TABLE os_versions_old');
      raw.run('PRAGMA legacy_alter_table = OFF');
      raw.run('PRAGMA foreign_keys = ON');
    }
    save();
    return db;
  },

  exec(sql) {
    raw.exec(sql);
    scheduleSave();
  },

  prepare(sql) {
    return {
      all(...args) {
        const stmt = raw.prepare(sql);
        try {
          stmt.bind(toBind(args));
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          return rows;
        } finally { stmt.free(); }
      },
      get(...args) {
        return this.all(...args)[0];
      },
      run(...args) {
        raw.run(sql, toBind(args));
        const changes = raw.getRowsModified();
        const idRow = raw.exec('SELECT last_insert_rowid() AS id')[0];
        scheduleSave();
        return { changes, lastInsertRowid: idRow ? idRow.values[0][0] : 0 };
      }
    };
  },

  transaction(fn) {
    return (...args) => {
      if (depth === 0) raw.run('BEGIN');
      depth++;
      try {
        const result = fn(...args);
        depth--;
        if (depth === 0) { raw.run('COMMIT'); save(); }
        return result;
      } catch (err) {
        depth--;
        if (depth === 0) raw.run('ROLLBACK');
        throw err;
      }
    };
  },

  close() { save(); }
};

process.on('exit', () => { try { save(); } catch (e) { /* ignore */ } });
['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => process.exit(0)));

module.exports = db;
