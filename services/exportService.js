// Експорт таблиці порівняння у PDF і XLSX (дані ті самі, що на екрані).
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const FONT_DIR = path.join(path.dirname(require.resolve('dejavu-fonts-ttf/package.json')), 'ttf');
const FONT = path.join(FONT_DIR, 'DejaVuSans.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'DejaVuSans-Bold.ttf');

const stamp = () => new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
const NAVY = '#141c42', PINK = '#f4b6d8', LIGHT_PINK = '#ffe3f2', GREEN = '#1b7a4c';

function pdf(t, stream) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30,
    info: { Title: 'Порівняння версій Windows', Author: 'Windows Evolution' } });
  doc.pipe(stream);
  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const labelW = 120;
  const colW = (width - labelW) / t.items.length;
  const pad = 5, size = 8;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  function header() {
    let y = doc.y;
    doc.rect(left, y, width, 22).fill(NAVY);
    doc.font(FONT_BOLD).fontSize(9).fillColor(PINK).text('ХАРАКТЕРИСТИКА', left + pad, y + 7, { width: labelW - pad });
    t.items.forEach((o, i) => doc.fillColor('#ffffff').text(o.name, left + labelW + i * colW + pad, y + 7, { width: colW - 2 * pad, height: 12, ellipsis: true }));
    doc.y = y + 22;
  }

  doc.font(FONT_BOLD).fontSize(18).fillColor(NAVY).text('Windows Evolution — порівняння версій', left, 30);
  doc.font(FONT).fontSize(9).fillColor('#555').text(`Створено: ${stamp()}  ·  Рожевим виділено відмінності, зеленим — найнижчі вимоги`, left, doc.y + 2);
  doc.moveDown(0.8);
  header();

  for (const s of t.sections) {
    if (doc.y + 40 > bottom()) { doc.addPage(); header(); }
    const y = doc.y;
    doc.rect(left, y, width, 16).fill(PINK);
    doc.font(FONT_BOLD).fontSize(8).fillColor(NAVY).text(s.title, left + pad, y + 4);
    doc.y = y + 16;
    for (const r of s.rows) {
      doc.font(FONT).fontSize(size);
      const h = Math.max(doc.heightOfString(r.label, { width: labelW - 2 * pad }),
        ...r.cells.map(c => doc.heightOfString(c, { width: colW - 2 * pad }))) + 2 * pad;
      if (doc.y + h > bottom()) { doc.addPage(); header(); }
      const y0 = doc.y;
      if (r.diff) doc.rect(left + labelW, y0, width - labelW, h).fill(LIGHT_PINK);
      doc.font(FONT_BOLD).fontSize(size).fillColor(NAVY).text(r.label, left + pad, y0 + pad, { width: labelW - 2 * pad });
      r.cells.forEach((c, i) => {
        const best = r.best.includes(i);
        doc.font(best ? FONT_BOLD : FONT).fontSize(size).fillColor(best ? GREEN : '#222')
          .text(c, left + labelW + i * colW + pad, y0 + pad, { width: colW - 2 * pad });
      });
      doc.moveTo(left, y0 + h).lineTo(left + width, y0 + h).lineWidth(0.4).strokeColor('#c9cfe6').stroke();
      doc.y = y0 + h;
    }
  }
  doc.end();
}

async function xlsx(t) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Windows Evolution';
  const ws = wb.addWorksheet('Порівняння', { views: [{ state: 'frozen', xSplit: 1, ySplit: 4 }] });
  const n = t.items.length + 1;
  ws.columns = [{ width: 28 }, ...t.items.map(() => ({ width: 42 }))];
  ws.mergeCells(1, 1, 1, n);
  ws.getCell(1, 1).value = 'Windows Evolution — порівняння версій';
  ws.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FF141C42' } };
  ws.mergeCells(2, 1, 2, n);
  ws.getCell(2, 1).value = `Створено: ${stamp()}. Рожевим виділено відмінності, зеленим — найнижчі вимоги.`;
  ws.getCell(2, 1).font = { italic: true, color: { argb: 'FF555555' } };
  const head = ws.getRow(4);
  head.values = ['ХАРАКТЕРИСТИКА', ...t.items.map(o => o.name)];
  head.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFF4B6D8' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF141C42' } };
    c.alignment = { vertical: 'middle', wrapText: true };
  });
  head.height = 24;
  let rn = 5;
  for (const s of t.sections) {
    ws.mergeCells(rn, 1, rn, n);
    const sc = ws.getCell(rn, 1);
    sc.value = s.title;
    sc.font = { bold: true, color: { argb: 'FF141C42' } };
    sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B6D8' } };
    rn++;
    for (const r of s.rows) {
      const row = ws.getRow(rn++);
      row.values = [r.label, ...r.cells];
      row.eachCell((c, col) => {
        c.alignment = { vertical: 'top', wrapText: true };
        c.border = { bottom: { style: 'thin', color: { argb: 'FFC9CFE6' } } };
        if (col === 1) c.font = { bold: true };
        else {
          if (r.diff) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE3F2' } };
          if (r.best.includes(col - 2)) c.font = { bold: true, color: { argb: 'FF1B7A4C' } };
        }
      });
    }
  }
  return wb.xlsx.writeBuffer();
}

module.exports = { pdf, xlsx };
