const compareService = require('../services/compareService');
const exportService = require('../services/exportService');
const osService = require('../services/osService');
const { HttpError } = require('../utils/errorHandler');

// slugs=win95,xp : від 2 до 4 різних версій, кожна має існувати в базі
function table(req) {
  const slugs = [...new Set(String(req.query.slugs || '').split(',').map(x => x.trim()).filter(Boolean))];
  if (slugs.length < 2) throw new HttpError(400, 'Для порівняння оберіть щонайменше 2 версії');
  if (slugs.length > 4) throw new HttpError(400, 'Можна порівнювати не більше 4 версій');
  const found = osService.getManyBySlugs(slugs).map(o => o.slug);
  const missing = slugs.filter(s => !found.includes(s));
  if (missing.length) throw new HttpError(404, 'Не знайдено в базі: ' + missing.join(', '));
  return compareService.compare(slugs);
}

exports.compare = (req, res) => res.json(table(req));

exports.exportPdf = (req, res) => {
  const t = table(req);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="windows-comparison.pdf"');
  exportService.pdf(t, res);
};

exports.exportXlsx = async (req, res) => {
  const t = table(req);
  const buf = await exportService.xlsx(t);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="windows-comparison.xlsx"');
  res.send(Buffer.from(buf));
};
