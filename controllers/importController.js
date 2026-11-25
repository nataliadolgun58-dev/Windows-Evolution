const importService = require('../services/importService');
const { HttpError } = require('../utils/errorHandler');

const run = commit => async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Файл не обрано. Додай CSV, JSON або XLSX');
  res.json(await importService.process(req.file, commit));
};
exports.preview = run(false);
exports.commit = run(true);

exports.template = async (req, res) => {
  const t = await importService.template(req.params.kind);
  res.setHeader('Content-Type', t.type);
  res.setHeader('Content-Disposition', `attachment; filename="${t.name}"`);
  res.send(t.data);
};
