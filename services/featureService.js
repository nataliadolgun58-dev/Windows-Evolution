// Матриця можливостей: які функції є в яких версіях Windows (дані з бази)
const db = require('../database/db');

function matrix() {
  const versions = db.prepare(`SELECT DISTINCT v.slug, v.name, v.release_date, v.id FROM os_versions v
    JOIN os_props p ON p.os_id = v.id ORDER BY v.release_date, v.id`).all();
  const feats = db.prepare('SELECT id, name, category, description FROM os_features ORDER BY sort').all();
  const sup = db.prepare('SELECT feature_id, os_id FROM os_feature_support').all();
  const byFeature = new Map();
  sup.forEach(s => { if (!byFeature.has(s.feature_id)) byFeature.set(s.feature_id, new Set()); byFeature.get(s.feature_id).add(s.os_id); });
  return {
    versions: versions.map(({ id, ...v }) => v),
    features: feats.map(f => {
      const set = byFeature.get(f.id) || new Set();
      return { name: f.name, category: f.category, description: f.description,
        support: versions.filter(v => set.has(v.id)).map(v => v.slug) };
    })
  };
}

module.exports = { matrix };
