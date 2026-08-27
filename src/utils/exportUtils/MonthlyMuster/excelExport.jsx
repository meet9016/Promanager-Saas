import { exportToStyledExcel } from '../commonExcelExport';

const TOTALS_ORDER = ['P', 'A', 'L', 'H', 'HP', 'WO', 'WOP', '½P'];

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

const normalizeRow = (row, defaultDayCount = 31) => {
  if (row && Array.isArray(row.dayCodes)) {
    return {
      employee_code: row.employee_code ?? row.code ?? '',
      employee_name: row.employee_name ?? row.name ?? '',
      dayCodes: row.dayCodes.slice(),
      totals: { ...row.totals },
    };
  }

  const empCode = row['Employee Code'] ?? row.employee_code ?? '';
  const empName = row['Employee Name'] ?? row.employee_name ?? '';

  const dayKeys = Object.keys(row || {})
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
 * Export Monthly Muster (grid or flat) to styled Excel file using commonExcelExport
 */
export const exportMusterToExcel = async ({
  rows,
  dayMeta,
  monthYear,
  companyName = 'Your Company Name',
  filterLabels = {},
  fileName,
  reportTitle = 'MONTHLY ATTENDANCE MUSTER (SUMMARY)',
} = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No data available to export');
  }

  const defaultDays = (Array.isArray(dayMeta) && dayMeta.length) ? dayMeta.length : 31;
  const normalizedRows = rows.map(r => normalizeRow(r, defaultDays));

  const firstRow = normalizedRows[0];
  const dayCount = Array.isArray(dayMeta) && dayMeta.length ? dayMeta.length : (firstRow?.dayCodes?.length || defaultDays);

  const headers = [
    { key: 'emp_code', label: 'Emp Code' },
    { key: 'emp_name', label: 'Employee Name' },
  ];

  for (let d = 1; d <= dayCount; d++) {
    headers.push({ key: `day_${d}`, label: String(d) });
  }

  headers.push(
    { key: 'total_p', label: 'P' },
    { key: 'total_a', label: 'A' },
    { key: 'total_l', label: 'L' },
    { key: 'total_h', label: 'H' },
    { key: 'total_hp', label: 'HP' },
    { key: 'total_wo', label: 'WO' },
    { key: 'total_wop', label: 'WOP' },
    { key: 'total_half', label: '½P' }
  );

  let grandP = 0, grandA = 0, grandL = 0, grandH = 0, grandHP = 0, grandWO = 0, grandWOP = 0, grandHalf = 0;

  const formattedRows = normalizedRows.map((emp) => {
    const rowObj = {
      emp_code: emp.employee_code || '--',
      emp_name: emp.employee_name || '--',
    };

    for (let d = 1; d <= dayCount; d++) {
      const code = emp.dayCodes?.[d - 1] ?? '';
      rowObj[`day_${d}`] = code || '--';
    }

    const t = emp.totals || {};
    rowObj.total_p = t.P ?? 0;
    rowObj.total_a = t.A ?? 0;
    rowObj.total_l = t.L ?? 0;
    rowObj.total_h = t.H ?? 0;
    rowObj.total_hp = t.HP ?? 0;
    rowObj.total_wo = t.WO ?? 0;
    rowObj.total_wop = t.WOP ?? 0;
    rowObj.total_half = t['½P'] ?? t.HalfP ?? 0;

    grandP += Number(rowObj.total_p) || 0;
    grandA += Number(rowObj.total_a) || 0;
    grandL += Number(rowObj.total_l) || 0;
    grandH += Number(rowObj.total_h) || 0;
    grandHP += Number(rowObj.total_hp) || 0;
    grandWO += Number(rowObj.total_wo) || 0;
    grandWOP += Number(rowObj.total_wop) || 0;
    grandHalf += Number(rowObj.total_half) || 0;

    return rowObj;
  });

  const summaryCards = [
    { label: 'Total Employees', value: normalizedRows.length },
    { label: 'Present (P)', value: grandP },
    { label: 'Absent (A)', value: grandA },
    { label: 'Late (L)', value: grandL },
    { label: 'Week Off (WO)', value: grandWO },
    { label: 'Half Present (½P)', value: grandHalf },
  ];

  const dateRangeText = buildDateRangeText(monthYear);

  await exportToStyledExcel({
    title: reportTitle.toUpperCase(),
    companyName: companyName || 'Your Company Name',
    dateRangeText: dateRangeText ? `Period: ${dateRangeText}` : '',
    summaryCards,
    headers,
    data: formattedRows,
    filename: fileName || `monthly_attendance_muster_${monthYear || 'report'}`,
    sheetName: 'Monthly Muster',
  });
};

