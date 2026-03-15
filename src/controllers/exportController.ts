import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { getProductsByProject } from '../services/productService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colLetter(n: number): string {
  let s = '';
  while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s;
}

function fmt(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır';
  return String(v);
}

function imgExt(p: string): 'jpeg' | 'png' | 'gif' {
  const e = path.extname(p).toLowerCase().replace('.', '');
  if (e === 'png') return 'png';
  if (e === 'gif') return 'gif';
  return 'jpeg';
}

// ─── Fields ───────────────────────────────────────────────────────────────────

const FIELDS: [string, string][] = [
  ['product_name',             'Ürün Adı'],
  ['capacity',                 'Kapasite'],
  ['mix_type',                 'Mix Tipi'],
  ['no_of_flavor',             'Çeşit Sayısı'],
  ['weight_gr',                'Ağırlık (gr)'],
  ['volume_ml',                'Hacim (ml)'],
  ['has_inclusion',            'İnklüzyon'],
  ['inclusion_type',           'İnklüzyon Tipi'],
  ['inclusion_size_mm',        'İnklüzyon Boyutu (mm)'],
  ['filling_pattern',          'Dolgu Deseni'],
  ['has_ripple_sauce',         'Ripple Sos'],
  ['ripple_sauce_info',        'Ripple Sos Bilgisi'],
  ['l1',                       'L1 (mm)'],
  ['l2',                       'L2 (mm)'],
  ['width',                    'Genişlik (mm)'],
  ['thickness',                'Kalınlık (mm)'],
  ['diameter',                 'Çap (mm)'],
  ['biscuit_l',                'Bisküvi L (mm)'],
  ['biscuit_w',                'Bisküvi W (mm)'],
  ['biscuit_thick',            'Bisküvi Kalınlık (mm)'],
  ['biscuit_diam',             'Bisküvi Çap (mm)'],
  ['stick_type',               'Stick Tipi'],
  ['stick_length',             'Stick Uzunluk (mm)'],
  ['stick_width',              'Stick Genişlik (mm)'],
  ['stick_thickness',          'Stick Kalınlık (mm)'],
  ['dipping_style',            'Dipping Stili'],
  ['dipping_note',             'Dipping Notu'],
  ['has_choc_tank_ingredients','Çikolata Tank Katkısı'],
  ['choc_ingredient_type',     'Katkı Tipi'],
  ['choc_ingredient_size',     'Katkı Boyutu (mm)'],
  ['has_lid',                  'Kapak'],
  ['lid1_type',                'Kapak 1 Tipi'],
  ['lid1_is_stackable',        'Kapak 1 İstiflenir'],
  ['lid2_type',                'Kapak 2 Tipi'],
  ['lid2_is_stackable',        'Kapak 2 İstiflenir'],
  ['has_pencil_filler',        'Kalem Filler'],
  ['pencil_filler_note',       'Kalem Filler Notu'],
  ['has_choc_disc',            'Çikolata Disk'],
  ['has_liquid_sauce_topping', 'Sıvı Sos Topping'],
  ['liquid_sauce_info',        'Sıvı Sos Bilgisi'],
  ['has_dry_topping',          'Kuru Topping'],
  ['dry_topping_info',         'Kuru Topping Bilgisi'],
  ['has_wrapper',              'Ambalaj'],
  ['wrapper_info',             'Ambalaj Bilgisi'],
  ['is_eol_included',          'EOL Dahil'],
];

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  indigo:      '4338CA',
  indigoLight: 'EEF2FF',
  indigoBorder:'C7D2FE',
  white:       'FFFFFFFF',
  dark:        '111827',
  mid:         '374151',
  muted:       '9CA3AF',
  rowEven:     'F8FAFC',
  rowOdd:      'FFFFFF',
  amber:       'D97706',
  green:       '059669',
  greenLight:  'ECFDF5',
  greenBorder: 'A7F3D0',
  sep:         'E5E7EB',
};

function bg(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

// ─── Export handler ────────────────────────────────────────────────────────────
export const exportProjectExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = +req.params.id;

    const projRes = await pool.query('SELECT * FROM projects WHERE id=$1', [projectId]);
    if (!projRes.rows.length) { res.status(404).json({ message: 'Not found' }); return; }
    const project = projRes.rows[0];
    const products = await getProductsByProject(projectId);

    // Group by mix_type, preserving insertion order
    const groups = new Map<string, typeof products>();
    for (const p of products) {
      const key = p.mix_type || '(Mix Tipi Belirtilmemiş)';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Project Manager';
    wb.created = new Date();

    const ws = wb.addWorksheet('Proje Raporu', {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, paperSize: 9 },
    });

    // Layout:
    //   Col A        = field labels (bold)
    //   Col B, C, D… = one column per product (side by side)
    // When a new product of the same mix_type arrives it fills the next column.

    const maxProds = Math.max(...Array.from(groups.values()).map(g => g.length), 1);
    const totalCols = maxProds + 1; // col A (labels) + product columns

    // Column widths
    ws.getColumn(1).width = 28;
    for (let c = 2; c <= totalCols; c++) ws.getColumn(c).width = 22;

    let row = 1;

    // ══════════════════════════
    // TITLE BANNER
    // ══════════════════════════
    ws.getRow(row).height = 48;
    const title = ws.getCell(`A${row}`);
    title.value = '📋  PROJE ÜRÜN RAPORU';
    title.font = { bold: true, size: 22, color: { argb: P.white }, name: 'Calibri' };
    title.fill = bg(P.indigo);
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.mergeCells(`A${row}:${colLetter(totalCols)}${row}`);
    row++;

    // ══════════════════════════
    // PROJECT INFO
    // ══════════════════════════
    const infoRows: [string, string][] = [
      ['Müşteri Adı', project.customer_name],
      ['Konum',       project.customer_location],
      ...(project.description ? [['Açıklama', project.description] as [string, string]] : []),
      ['Tarih',       new Date(project.created_at).toLocaleDateString('tr-TR')],
      ['Toplam Ürün', String(products.length)],
    ];

    for (const [lbl, val] of infoRows) {
      ws.getRow(row).height = 22;

      const lc = ws.getCell(`A${row}`);
      lc.value = lbl;
      lc.font = { bold: true, size: 11, color: { argb: P.indigo }, name: 'Calibri' };
      lc.fill = bg(P.indigoLight);
      lc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      lc.border = {
        right:  { style: 'medium', color: { argb: P.indigoBorder } },
        bottom: { style: 'thin',   color: { argb: P.indigoBorder } },
      };

      const vc = ws.getCell(`B${row}`);
      vc.value = val;
      vc.font = { size: 11, color: { argb: P.dark }, name: 'Calibri' };
      vc.fill = bg(P.indigoLight);
      vc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      vc.border = { bottom: { style: 'thin', color: { argb: P.indigoBorder } } };
      if (totalCols >= 2) ws.mergeCells(`B${row}:${colLetter(totalCols)}${row}`);
      row++;
    }

    row++; // spacer

    // ══════════════════════════
    // PRODUCT GROUPS
    // ══════════════════════════
    for (const [mixType, grpProducts] of groups) {
      const numP    = grpProducts.length;
      const grpEnd  = colLetter(numP + 1); // label col + numP product cols

      // ── Mix type header ──────────────────────────
      ws.getRow(row).height = 32;
      const mh = ws.getCell(`A${row}`);
      mh.value = `  🍦  Mix Tipi: ${mixType}  (${numP} ürün)`;
      mh.font = { bold: true, size: 13, color: { argb: P.white }, name: 'Calibri' };
      mh.fill = bg(P.amber);
      mh.alignment = { vertical: 'middle' };
      ws.mergeCells(`A${row}:${grpEnd}${row}`);
      row++;

      // ── Column headers: "Özellik" | Product 1 | Product 2 | … ──
      ws.getRow(row).height = 28;
      const fhCell = ws.getCell(`A${row}`);
      fhCell.value = 'Özellik';
      fhCell.font = { bold: true, size: 11, color: { argb: P.white }, name: 'Calibri' };
      fhCell.fill = bg(P.mid);
      fhCell.alignment = { horizontal: 'center', vertical: 'middle' };
      fhCell.border = { right: { style: 'medium', color: { argb: P.white } } };

      for (let i = 0; i < numP; i++) {
        const c = ws.getCell(`${colLetter(i + 2)}${row}`);
        c.value = `#${i + 1}  ${grpProducts[i].product_name}`;
        c.font = { bold: true, size: 11, color: { argb: P.white }, name: 'Calibri' };
        c.fill = bg(P.mid);
        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        c.border = {
          left:   { style: 'thin',   color: { argb: '4B5563' } },
          bottom: { style: 'thin',   color: { argb: '4B5563' } },
          right:  i < numP - 1
            ? { style: 'thin',   color: { argb: '4B5563' } }
            : { style: 'medium', color: { argb: P.white } },
        };
      }
      row++;

      // ── Field rows (skip fields where ALL products are null) ──
      let fieldIdx = 0;
      for (const [key, label] of FIELDS) {
        if (grpProducts.every(p => (p as any)[key] === null || (p as any)[key] === undefined)) continue;

        const rowBg = fieldIdx % 2 === 0 ? P.rowEven : P.rowOdd;
        ws.getRow(row).height = 20;

        // Label cell
        const lc = ws.getCell(`A${row}`);
        lc.value = label;
        lc.font = { bold: true, size: 10, color: { argb: P.dark }, name: 'Calibri' };
        lc.fill = bg(P.indigoLight);
        lc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        lc.border = {
          right:  { style: 'medium', color: { argb: P.indigoBorder } },
          bottom: { style: 'thin',   color: { argb: P.sep } },
        };

        // One value cell per product
        for (let i = 0; i < numP; i++) {
          const c = ws.getCell(`${colLetter(i + 2)}${row}`);
          c.value = fmt((grpProducts[i] as any)[key]);
          c.font = { size: 10, color: { argb: P.dark }, name: 'Calibri' };
          c.fill = bg(rowBg);
          c.alignment = { horizontal: 'center', vertical: 'middle' };
          c.border = {
            right:  { style: 'thin', color: { argb: P.sep } },
            bottom: { style: 'thin', color: { argb: P.sep } },
          };
        }
        row++;
        fieldIdx++;
      }

      // ── Images section ────────────────────────────
      const maxImgs = Math.max(...grpProducts.map(p => p.images?.length ?? 0));
      if (maxImgs > 0) {
        // Images header
        ws.getRow(row).height = 24;
        const ih = ws.getCell(`A${row}`);
        ih.value = '  📷  Görseller';
        ih.font = { bold: true, size: 11, color: { argb: P.white }, name: 'Calibri' };
        ih.fill = bg(P.green);
        ih.alignment = { vertical: 'middle' };
        ws.mergeCells(`A${row}:${grpEnd}${row}`);
        row++;

        for (let imgIdx = 0; imgIdx < maxImgs; imgIdx++) {
          const IMG_H = 130;
          ws.getRow(row).height = 100;

          // Label
          const lc = ws.getCell(`A${row}`);
          lc.value = `Görsel ${imgIdx + 1}`;
          lc.font = { bold: true, size: 9, color: { argb: P.muted }, name: 'Calibri' };
          lc.fill = bg(P.greenLight);
          lc.alignment = { horizontal: 'center', vertical: 'middle' };
          lc.border = {
            right:  { style: 'medium', color: { argb: P.green } },
            bottom: { style: 'thin',   color: { argb: P.greenBorder } },
          };

          // One image cell per product (same row → side by side)
          for (let i = 0; i < numP; i++) {
            const colIdx = i + 2; // 1-indexed Excel column
            const imgCell = ws.getCell(`${colLetter(colIdx)}${row}`);
            imgCell.fill = bg(P.greenLight);
            imgCell.border = {
              right:  { style: 'thin', color: { argb: P.greenBorder } },
              bottom: { style: 'thin', color: { argb: P.greenBorder } },
            };

            const imgInfo = grpProducts[i].images?.[imgIdx];
            if (imgInfo) {
              const fsPath = path.resolve(__dirname, '../../uploads', path.basename(imgInfo.image_path));
              if (fs.existsSync(fsPath)) {
                try {
                  const imageId = wb.addImage({ filename: fsPath, extension: imgExt(fsPath) });
                  // tl is 0-indexed: col A=0, col B=1, …
                  ws.addImage(imageId, {
                    tl: { col: colIdx - 1, row: row - 1 },
                    ext: { width: 160, height: IMG_H },
                    editAs: 'oneCell',
                  });
                } catch { /* skip unreadable image */ }
              }
            }
          }
          row++;
        }
      }

      row += 2; // gap between groups
    }

    // ── Stream response ───────────────────────────
    const safeName = project.customer_name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeName + '-rapor')}.xlsx`);
    await wb.xlsx.write(res);
    res.end();

  } catch (e: any) {
    console.error('Excel export error:', e);
    if (!res.headersSent) res.status(500).json({ message: e.message });
  }
};
