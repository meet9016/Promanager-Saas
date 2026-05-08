// Black & White themed Excel (HTML .xls) export for Monthly Muster
// Now supports BOTH input shapes:
// 1) Grid rows: { employee_code, employee_name, dayCodes[], totals{} }
// 2) Flat rows: { "Employee Code", "Employee Name", "Day 1"... "Day N", "Present","Absent","Late","Holiday","Half Day (alt)","Week Off","Week Off Present","Half Present" }

const TOTALS_ORDER = ['P', 'A', 'L', 'H', 'HP', 'WO', 'WOP', '½P'];
const TOTALS_LABELS = { P: 'P', A: 'A', L: 'L', H: 'H', HP: 'HP', WO: 'WO', WOP: 'WOP', '½P': '½P' };

// reverse map of the human labels used by MonthlyMusterPreview → codes
const NAME_TO_CODE = {
  'Present': 'P',
  'Absent': 'A',
  'Late': 'L',
  'Holiday': 'H',
  'Half Day (alt)': 'HP',
  'Week Off': 'WO',
  'Week Off Present': 'WOP',
  'Half Present': '½P',
};

const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

const buildDateRangeText = (monthYear) => {
  if (!monthYear) return '';
  const [yStr, mStr] = monthYear.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const fmt = (d) =>
    `${d.toLocaleString('en-US', { month: 'short' })} ${pad2(d.getDate())} ${d.getFullYear()}`;
  return `${fmt(first)} to ${fmt(last)}`;
};

const formatPrintedOn = (dt = new Date()) => {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  const y = d.getFullYear();
  const m = d.toLocaleString('en-US', { month: 'short' });
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${m} ${day} ${y} ${hh}:${mm}`;
};

const escapeCell = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/^[=+\-@]/.test(s)) return `'${s}`; // Avoid Excel formula injection
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// --- NEW: normalize any row into { employee_code, employee_name, dayCodes[], totals{} }
const normalizeRow = (row, defaultDayCount = 31) => {
  // case 1: already in grid shape
  if (row && Array.isArray(row.dayCodes)) {
    return {
      employee_code: row.employee_code ?? row.code ?? '',
      employee_name: row.employee_name ?? row.name ?? '',
      dayCodes: row.dayCodes.slice(),
      totals: { ...row.totals },
    };
  }

  // case 2: flat shape produced by MonthlyMusterPreview
  const empCode = row['Employee Code'] ?? row.employee_code ?? '';
  const empName = row['Employee Name'] ?? row.employee_name ?? '';

  // figure out how many days exist by scanning keys "Day X"
  const dayKeys = Object.keys(row)
    .map(k => {
      const m = /^Day\s+(\d+)$/.exec(k);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => n > 0);
  const inferredDays = dayKeys.length ? Math.max(...dayKeys) : defaultDayCount;

  const dayCodes = Array.from({ length: inferredDays }, (_, i) => {
    const v = row[`Day ${i + 1}`];
    return (v === undefined || v === null) ? '' : String(v);
  });

  const totals = {};
  // accept either code keys ("P") or human label keys ("Present")
  TOTALS_ORDER.forEach(code => {
    const human = Object.keys(NAME_TO_CODE).find(k => NAME_TO_CODE[k] === code);
    const raw =
      row[code] ??
      row[human] ??
      row[human?.toUpperCase?.() ?? ''] ??
      0;
    const num = parseFloat(raw);
    totals[code] = isNaN(num) ? 0 : num;
  });

  return { employee_code: empCode, employee_name: empName, dayCodes, totals };
};

/**
 * Builds an HTML table representing the Monthly Muster grid.
 * rows: normalized rows
 * dayMeta: [{ day, isWeekend }, ...]
 */
const buildMusterTableHTML = (rows, dayMeta, header) => {
  const firstRow = rows?.[0];
  const fallbackDays = firstRow?.dayCodes?.length || 31;
  const dayCount = Array.isArray(dayMeta) && dayMeta.length ? dayMeta.length : fallbackDays;

  const colgroup = `
    <colgroup>
      <col style="width:120px" />
      <col style="width:220px" />
      ${Array.from({ length: dayCount }, () => `<col style="width:28px" />`).join('')}
      ${TOTALS_ORDER.map(() => `<col style="width:36px" />`).join('')}
    </colgroup>
  `;

  const titleBand = `
    <tr>
      <td colspan="${2 + dayCount + TOTALS_ORDER.length}"
          style="font-weight:bold;font-size:18px;text-align:center;border:2px solid #000;padding:10px;background:#fff;">
        ${escapeCell(header.reportTitle || 'Monthly Attendance Muster (Summary)')}
      </td>
    </tr>
    <tr>
      <td colspan="${2 + dayCount + TOTALS_ORDER.length}"
          style="font-weight:bold;font-size:12px;text-align:center;border:1px solid #666;padding:6px;background:#fff;">
        Period: ${escapeCell(header.dateRangeText)} &nbsp; • &nbsp;
        Company: ${escapeCell(header.companyName || 'Company')} &nbsp; • &nbsp;
        Printed On: ${escapeCell(header.printedOnText)}
      </td>
    </tr>
    ${header.filtersLine ? `
      <tr>
        <td colspan="${2 + dayCount + TOTALS_ORDER.length}"
            style="font-size:11px;text-align:center;border:1px solid #999;padding:6px;background:#f9f9f9;">
          ${escapeCell(header.filtersLine)}
        </td>
      </tr>` : ``}
    <tr><td colspan="${2 + dayCount + TOTALS_ORDER.length}">&nbsp;</td></tr>
  `;

  const thead = `
    <tr>
      <th style="border:2px solid #000;background:#000;color:#fff;padding:6px;text-align:left;">Emp. Code</th>
      <th style="border:2px solid #000;background:#000;color:#fff;padding:6px;text-align:left;">Employee Name</th>
      ${Array.from({ length: dayCount }, (_, i) => `
        <th style="border:2px solid #000;background:#000;color:#fff;padding:3px;text-align:center;white-space:nowrap;font-size:10px;mso-number-format:'\\@';">${i + 1}</th>
      `).join('')}
      ${TOTALS_ORDER.map(k => `
        <th style="border:2px solid #000;background:#000;color:#fff;padding:3px;text-align:center;white-space:nowrap;font-size:10px;">${TOTALS_LABELS[k]}</th>
      `).join('')}
    </tr>
  `;

  const isWeekend = (index) => !!(dayMeta?.[index]?.isWeekend);

  const tbody = rows.map((emp, rIdx) => {
    const zebraBg = rIdx % 2 === 0 ? '#fff' : '#f7f7f7';
    const dayCells = Array.from({ length: dayCount }, (_, i) => {
      const code = emp.dayCodes?.[i] ?? '';
      const cellBg = isWeekend(i) ? '#eee' : zebraBg;
      return `
        <td style="border:1px solid #666;padding:3px;text-align:center;background:${cellBg};white-space:nowrap;font-size:10px;mso-number-format:'\\@';">
          ${escapeCell(code)}
        </td>`;
    }).join('');

    const totalCells = TOTALS_ORDER.map(k => {
      const v = emp.totals?.[k] || 0;
      const val = Number.isInteger(v) ? v : Number(v).toFixed(1);
      return `
        <td style="border:1px solid #666;padding:3px;text-align:center;background:${zebraBg};font-weight:bold;white-space:nowrap;font-size:10px;">
          ${escapeCell(val)}
        </td>`;
    }).join('');

    return `
      <tr>
        <td style="border:1px solid #333;padding:6px;text-align:left;background:${zebraBg};font-weight:bold;">${escapeCell(emp.employee_code)}</td>
        <td style="border:1px solid #333;padding:6px;text-align:left;background:${zebraBg};">${escapeCell(emp.employee_name)}</td>
        ${dayCells}
        ${totalCells}
      </tr>`;
  }).join('');

  const deptLine = header.departmentName
    ? `
      <tr>
        <td colspan="${2 + dayCount + TOTALS_ORDER.length}" style="border-top:2px solid #000;padding:8px;text-align:left;background:#fff;font-weight:bold;">
          Department: ${escapeCell(header.departmentName)}
        </td>
      </tr>`
    : '';

  // Wrap with minimal HTML to make some Excel versions happier
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body>
        <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;font-size:11px;border:2px solid #000;">
          ${colgroup}
          <tbody>
            ${titleBand}
            ${thead}
            ${tbody}
            ${deptLine}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

/**
 * Export Monthly Muster (grid or flat) to Excel (.xls via HTML)
 */
export const exportMusterToExcel = ({
  rows,
  dayMeta,
  monthYear,
  companyName = 'Company',
  filterLabels = {},
  fileName,
  reportTitle = 'Monthly Attendance Muster (Summary)',
  printedOn,
  departmentName,
} = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No data available to export');
  }

  // Normalize all rows first so downstream code is consistent
  const defaultDays = (Array.isArray(dayMeta) && dayMeta.length) ? dayMeta.length : 31;
  const normalizedRows = rows.map(r => normalizeRow(r, defaultDays));

  const dateRangeText = buildDateRangeText(monthYear);
  const printedOnText = formatPrintedOn(printedOn || new Date());

  const parts = [];
  if (filterLabels.branch) parts.push(`Branch: ${filterLabels.branch}`);
  if (filterLabels.department) parts.push(`Department: ${filterLabels.department}`);
  if (filterLabels.designation) parts.push(`Designation: ${filterLabels.designation}`);
  if (filterLabels.employee) parts.push(`Employee: ${filterLabels.employee}`);
  const filtersLine = parts.length ? parts.join('  •  ') : '';

  const header = {
    reportTitle,
    dateRangeText,
    companyName,
    printedOnText,
    filtersLine,
    departmentName: departmentName || filterLabels.department || '',
  };

  const tableHTML = buildMusterTableHTML(normalizedRows, dayMeta, header);

  const [yy, mm] = (monthYear || '').split('-');
  const nm = fileName || `monthly_attendance_muster_${yy || ''}-${mm || ''}`;

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nm}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
