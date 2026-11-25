// Перевірка проєкту: чи всі потрібні файли на місці й не порожні.
// Запуск: npm run check   (також виконується автоматично перед npm run seed)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const FILES = [
  'server.js', 'package.json',
  'database/db.js', 'database/schema.sql', 'database/seed.js',
  'database/data/windows.js', 'database/data/betas.js', 'database/data/extra.js', 'database/data/more.js',
  'database/data/deep.js', 'database/data/tech.js', 'database/data/bitness.js', 'database/data/knowledge.js',
  'controllers/osController.js', 'controllers/compareController.js', 'controllers/analyticsController.js',
  'controllers/importController.js', 'controllers/featureController.js', 'controllers/knowledgeController.js',
  'routes/osRoutes.js', 'routes/compareRoutes.js', 'routes/analyticsRoutes.js',
  'routes/importRoutes.js', 'routes/featureRoutes.js', 'routes/knowledgeRoutes.js',
  'services/osService.js', 'services/compareService.js', 'services/exportService.js', 'services/analyticsService.js',
  'services/importService.js', 'services/featureService.js', 'services/knowledgeService.js',
  'utils/errorHandler.js', 'utils/validation.js',
  'public/index.html', 'public/catalog.html', 'public/details.html', 'public/compare.html', 'public/timeline.html',
  'public/analytics.html', 'public/import.html', 'public/about.html', 'public/features.html', 'public/knowledge.html',
  'public/css/style.css', 'public/css/components.css',
  'public/js/main.js', 'public/js/images.js', 'public/js/catalog.js', 'public/js/details.js', 'public/js/compare.js',
  'public/js/timeline.js', 'public/js/analytics.js', 'public/js/import.js', 'public/js/about.js',
  'public/js/features.js', 'public/js/knowledge.js',
  'public/fonts/handjet-cyrillic-500-normal.woff2', 'public/fonts/handjet-latin-500-normal.woff2',
  'public/fonts/handjet-cyrillic-700-normal.woff2', 'public/fonts/handjet-latin-700-normal.woff2',
  'public/fonts/press-start-2p-cyrillic-400-normal.woff2', 'public/fonts/press-start-2p-latin-400-normal.woff2',
  'public/fonts/press-start-2p-latin-ext-400-normal.woff2'
];
const PACKAGES = ['express', 'sql.js', 'multer', 'csv-parse', 'pdfkit', 'exceljs', 'dejavu-fonts-ttf'];

function check() {
  const problems = [];
  for (const f of FILES) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) problems.push(`немає файлу: ${f}`);
    else if (fs.statSync(p).size < 20) problems.push(`файл порожній: ${f}`);
  }
  // вміст файлів з даними
  const shape = {
    'database/data/windows.js': m => Array.isArray(m) && m.length, 'database/data/betas.js': m => Array.isArray(m) && m.length,
    'database/data/extra.js': m => Array.isArray(m) && m.length, 'database/data/more.js': m => Array.isArray(m) && m.length,
    'database/data/deep.js': m => m && m.props && m.editions && Array.isArray(m.features) && m.features.length,
    'database/data/tech.js': m => m && m.win95, 'database/data/bitness.js': m => m && m.win95,
    'database/data/knowledge.js': m => m && m.components && m.glossary && m.reasons && m.market
  };
  for (const [f, ok] of Object.entries(shape)) {
    const p = path.join(root, f);
    if (!fs.existsSync(p) || fs.statSync(p).size < 20) continue;
    try { if (!ok(require(p))) problems.push(`у файлі ${f} немає потрібних даних (стара або неповна версія)`); }
    catch (e) { problems.push(`файл ${f} містить помилку: ${e.message}`); }
  }
  for (const pkg of PACKAGES) {
    if (!fs.existsSync(path.join(root, 'node_modules', pkg))) problems.push(`не встановлено пакет «${pkg}» — виконайте: npm install --ignore-scripts`);
  }
  return problems;
}

function report(problems) {
  if (!problems.length) { console.log('Перевірка пройдена: усі потрібні файли на місці.'); return; }
  console.error(`\nЗнайдено проблем: ${problems.length}\n` + problems.map(p => '  • ' + p).join('\n') +
    '\n\nЗавантажте або замініть ці файли файлами з чату й запустіть команду ще раз.\n');
}

if (require.main === module) { const p = check(); report(p); process.exit(p.length ? 1 : 0); }
module.exports = { check, report };
