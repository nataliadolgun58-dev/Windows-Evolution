const osService = require('../services/osService');
const { HttpError } = require('../utils/errorHandler');

exports.list = (req, res) => {
  const { q, line, status, category, sort, order } = req.query;
  if (line && !['DOS', 'NT', 'CE'].includes(line)) throw new HttpError(400, 'Параметр line має бути DOS, NT або CE');
  if (category && !['desktop', 'beta', 'server', 'device'].includes(category)) throw new HttpError(400, 'Параметр category має бути desktop, beta, server або device');
  if (status && !['supported', 'ended', 'prerelease'].includes(status)) throw new HttpError(400, 'Параметр status має бути supported, ended або prerelease');
  res.json(osService.list({ q: q && String(q).slice(0, 100), line, status, category, sort, order }));
};

exports.get = (req, res) => {
  const os = osService.getBySlug(req.params.slug);
  if (!os) throw new HttpError(404, 'Операційну систему не знайдено');
  res.json(os);
};

exports.stats = (req, res) => res.json(osService.stats());

// Власні зображення: файли public/images/os/<slug>.png|jpg|webp|gif|svg
exports.images = (req, res) => {
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..', 'public', 'images', 'os');
  const map = {};
  try {
    fs.readdirSync(dir).forEach(f => {
      const m = /^([a-z0-9-]+)\.(png|jpe?g|webp|gif|svg)$/i.exec(f);
      if (m) map[m[1].toLowerCase()] = f;
    });
  } catch (e) { /* папки ще немає — власних зображень немає */ }
  res.json(map);
};
