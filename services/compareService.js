// Порівняння ОС: одна таблиця, з якої беруться і екран, і PDF, і XLSX.
const osService = require('./osService');

const CAT = { desktop: 'ПК', beta: 'Бета / кодова назва', server: 'Сервер', device: 'Пристрій' };
const LINE = { DOS: 'На основі MS-DOS', NT: 'Лінія NT', CE: 'Windows CE' };
const STATUS = { supported: 'Підтримується', ended: 'Підтримку завершено', prerelease: 'Попередня версія' };
const MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];

const dash = v => (v === null || v === undefined || v === '') ? '—' : String(v);
function mb(v) {
  if (v === null || v === undefined) return '—';
  if (v < 1) return Math.round(v * 1024) + ' КБ';
  if (v >= 1024) return (v / 1024).toLocaleString('uk-UA', { maximumFractionDigits: 1 }) + ' ГБ';
  return v.toLocaleString('uk-UA') + ' МБ';
}
function date(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-').map(Number);
  return `${day} ${MONTHS[m - 1]} ${y}`;
}
const list = a => (a && a.length) ? a.map(t => '• ' + t).join('\n') : '—';

const SECTIONS = [
  { title: 'ЗАГАЛЬНЕ', rows: [
    { label: 'Категорія', get: o => CAT[o.category] || 'ПК' },
    { label: 'Дата виходу / анонсу', get: o => date(o.release_date) },
    { label: 'Версія', get: o => dash(o.version) },
    { label: 'Збірка', get: o => dash(o.build) },
    { label: 'Лінія', get: o => LINE[o.line] || o.line },
    { label: 'Ядро / тип', get: o => dash(o.kernel) },
    { label: 'Архітектура', get: o => dash(o.architecture) },
  ]},
  { title: 'СИСТЕМНІ ВИМОГИ', rows: [
    { label: 'Мінімальний процесор', get: o => dash(o.min_cpu_text), num: o => o.min_cpu_mhz },
    { label: 'Рекомендований процесор', get: o => dash(o.rec_cpu_text) },
    { label: 'Мінімум RAM', get: o => mb(o.min_ram_mb), num: o => o.min_ram_mb },
    { label: 'Рекомендовано RAM', get: o => mb(o.rec_ram_mb), num: o => o.rec_ram_mb },
    { label: 'Мінімум диска', get: o => mb(o.min_disk_mb), num: o => o.min_disk_mb },
    { label: 'Рекомендовано диска', get: o => mb(o.rec_disk_mb), num: o => o.rec_disk_mb },
  ]},
  { title: 'ПРОДУКТИВНІСТЬ', rows: [
    { label: 'Особливості роботи', get: o => dash(o.performance_note) },
    { label: 'DirectX', get: o => dash(o.directx) },
    { label: 'Файлові системи', get: o => dash(o.file_systems) },
  ]},
  { title: 'ФУНКЦІОНАЛЬНІ МОЖЛИВОСТІ', rows: [
    { label: 'Нововведення', get: o => list(o.innovation) },
  ]},
  { title: 'ДОДАТКОВІ ВЛАСТИВОСТІ', rows: [
    { label: 'Внутрішній номер версії', get: o => dash((o.props || {}).ntver) },
    { label: 'Кодова назва', get: o => dash((o.props || {}).codename) },
    { label: 'Оболонка', get: o => dash((o.props || {}).shell) },
    { label: 'Браузер у складі', get: o => dash((o.props || {}).browser) },
    { label: 'Носій установки', get: o => dash((o.props || {}).media) },
    { label: 'Попередник', get: o => dash((o.props || {}).predecessor) },
    { label: 'Наступник', get: o => dash((o.props || {}).successor) },
    { label: 'Редакції', get: o => list(o.editions) },
    { label: 'Кількість функцій у матриці', get: o => (o.features && o.features.length) ? String(o.features.length) : '—' },
  ]},
  { title: 'ТЕХНІЧНА АРХІТЕКТУРА', rows: [
    { label: 'Розрядність і зміни архітектури', get: o => dash((o.props || {}).bitness) },
    { label: 'Завантаження', get: o => dash((o.props || {}).boot) },
    { label: 'Файл ядра', get: o => dash((o.props || {}).kernelfile) },
    { label: 'Архітектура ядра', get: o => dash((o.props || {}).mode) },
    { label: 'Системна папка', get: o => dash((o.props || {}).sysdir) },
    { label: 'Зберігання конфігурації', get: o => dash((o.props || {}).config) },
    { label: 'Підсистеми й API', get: o => dash((o.props || {}).subsys) },
    { label: 'Графічна підсистема', get: o => dash((o.props || {}).gfx) },
    { label: 'Модель драйверів', get: o => dash((o.props || {}).drivers) },
    { label: 'Файлові системи (за версією)', get: o => dash((o.props || {}).fs) },
    { label: 'Установка й оновлення', get: o => dash((o.props || {}).setup) },
    { label: 'Ключові системні файли', get: o => dash((o.props || {}).keyfiles) },
  ]},
  { title: 'БЕЗПЕКА', rows: [{ label: 'Безпека', get: o => dash(o.security_summary) }] },
  { title: 'ІНТЕРФЕЙС', rows: [{ label: 'Інтерфейс', get: o => dash(o.ui_summary) }] },
  { title: 'ПІДТРИМКА', rows: [
    { label: 'Статус', get: o => STATUS[o.support_status] || '—' },
    { label: 'Кінець підтримки', get: o => date(o.support_end) },
  ]},
  { title: 'ПЕРЕВАГИ Й НЕДОЛІКИ', rows: [
    { label: 'Переваги', get: o => list(o.pro) },
    { label: 'Недоліки', get: o => list(o.con) },
  ]},
];

function build(items) {
  const sections = SECTIONS.map(s => ({
    title: s.title,
    rows: s.rows.map(r => {
      const cells = items.map(o => r.get(o));
      const diff = new Set(cells).size > 1;
      let best = [];
      if (r.num && diff) {
        const nums = items.map(o => r.num(o));
        const known = nums.filter(n => n !== null && n !== undefined);
        if (known.length >= 2 && new Set(known).size > 1) {
          const min = Math.min(...known);
          best = nums.map((n, i) => n === min ? i : -1).filter(i => i >= 0);
        }
      }
      return { label: r.label, cells, diff, best };
    })
  }));
  return { items: items.map(o => ({ slug: o.slug, name: o.name })), sections };
}

function compare(slugs) {
  return build(osService.getManyBySlugs(slugs));
}

module.exports = { compare, build };
