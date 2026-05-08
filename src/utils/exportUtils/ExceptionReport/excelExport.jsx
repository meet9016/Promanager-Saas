/**
 * Excel export for Attendance Exception Report
 * @param {Array}  data      - Filtered exception records for the active tab
 * @param {Date}   reportDate
 * @param {string} tabKey    - 'late_coming' | 'early_going' | 'short_hours' | 'missed_punch'
 * @param {string} tabLabel  - Human-readable tab name
 * @param {string} filename
 */
export const exportExceptionToExcel = (data, reportDate, tabKey, tabLabel, filename) => {
    if (!data || data.length === 0) throw new Error('No data available to export');

    const formattedDate = new Date(reportDate).toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });

    // ── Build column schema per tab ──────────────────────────────────────────
    const columnSchemas = {
        all_employees: [
            { header: 'S.No', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Shift', get: (e) => e.shift_name || '--' },
            { header: 'Shift Time', get: (e) => `${e.shift_from_time || '--'} - ${e.shift_to_time || '--'}` },
            { header: 'Clock In', get: (e) => e.attandance_first_clock_in || '--' },
            { header: 'Clock Out', get: (e) => e.attandance_last_clock_out || '--' },
            { header: 'Working Hrs', get: (e) => e.shift_working_hours || '--' },
            { header: 'Attendance Hrs', get: (e) => e.attandance_hours || '--' },
            { header: 'Status', get: (e) => e.status || '--' },
            { header: 'Late By', get: (e) => (e.exception_types || []).includes('late_coming') ? (e.late_coming_time || '--') : '--' },
            { header: 'Early By', get: (e) => (e.exception_types || []).includes('early_going') ? (e.early_going_time || '--') : '--' },
            {
                header: 'Short By', get: (e) => {
                    if (!(e.exception_types || []).includes('short_hours')) return '--';
                    const a = parseHoursToMinutes(e.attandance_hours);
                    const s = parseHoursToMinutes(e.shift_working_hours);
                    const d = s - a;
                    return d > 0 ? `${Math.floor(d / 60)}h ${d % 60}m` : '--';
                }
            },
            {
                header: 'Exceptions', get: (e) => {
                    const types = e.exception_types || [];
                    if (types.length === 0) return e.attandance_first_clock_in ? 'On Time' : 'No Punch';
                    return types.map((t) => ({ late_coming: 'Late Coming', early_going: 'Early Going', short_hours: 'Short Hours', missed_punch: 'Missed Punch' }[t] || t)).join(', ');
                }
            },
        ],
        late_coming: [
            { header: 'S.No', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Shift', get: (e) => e.shift_name || '--' },
            { header: 'Shift Start', get: (e) => e.shift_from_time || '--' },
            { header: 'Clock In', get: (e) => e.attandance_first_clock_in || '--' },
            { header: 'Late By', get: (e) => e.late_coming_time || '--' },
            { header: 'Late Minutes', get: (e) => e.late_coming_minutes || '0' },
            { header: 'Status', get: (e) => e.status || '--' },
        ],
        early_going: [
            { header: 'S.No', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Shift', get: (e) => e.shift_name || '--' },
            { header: 'Shift End', get: (e) => e.shift_to_time || '--' },
            { header: 'Clock Out', get: (e) => e.attandance_last_clock_out || '--' },
            { header: 'Left Early By', get: (e) => e.early_going_time || '--' },
            { header: 'Early Minutes', get: (e) => e.early_going_minutes || '0' },
            { header: 'Status', get: (e) => e.status || '--' },
        ],
        short_hours: [
            { header: 'S.No', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Shift', get: (e) => e.shift_name || '--' },
            { header: 'Required Hours', get: (e) => e.shift_working_hours || '--' },
            { header: 'Worked Hours', get: (e) => e.attandance_hours || '--' },
            {
                header: 'Short By', get: (e) => {
                    const attMins = parseHoursToMinutes(e.attandance_hours);
                    const shiftMins = parseHoursToMinutes(e.shift_working_hours);
                    const diff = shiftMins - attMins;
                    if (diff <= 0) return '--';
                    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                }
            },
            { header: 'Clock In', get: (e) => e.attandance_first_clock_in || '--' },
            { header: 'Clock Out', get: (e) => e.attandance_last_clock_out || '--' },
            { header: 'Status', get: (e) => e.status || '--' },
        ],
        missed_punch: [
            { header: 'S.No', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Shift', get: (e) => e.shift_name || '--' },
            { header: 'Shift Time', get: (e) => `${e.shift_from_time || '--'} - ${e.shift_to_time || '--'}` },
            { header: 'Clock In', get: (e) => e.attandance_first_clock_in || '--' },
            { header: 'Clock Out', get: (e) => e.attandance_last_clock_out || '--' },
            { header: 'Punch Count', get: (e) => (e.attendance_history || []).length },
            { header: 'Punch Records', get: (e) => (e.attendance_history || []).map(h => h.clock_date_time).join(', ') || '--' },
            { header: 'Status', get: (e) => e.status || '--' },
        ],
    };

    const schema = columnSchemas[tabKey] || columnSchemas.late_coming;
    const headers = schema.map((s) => s.header);

    // ── Tab-specific summary ─────────────────────────────────────────────────
    const summaryRows = {
        all_employees: () => {
            const exCount = data.filter((e) => (e.exception_types || []).length > 0).length;
            const cleanCount = data.length - exCount;
            return [
                ['Total Employees', data.length, '', 'With Exceptions', exCount, '', 'Clean', cleanCount, ''],
            ];
        },
        late_coming: () => {
            const avgMins = data.reduce((a, e) => a + parseInt(e.late_coming_minutes || 0, 10), 0) / data.length;
            return [
                ['Total Late Employees', data.length, '', 'Avg Late Minutes', Math.round(avgMins) + ' min', ''],
            ];
        },
        early_going: () => {
            const avgMins = data.reduce((a, e) => a + parseInt(e.early_going_minutes || 0, 10), 0) / data.length;
            return [
                ['Total Early Going', data.length, '', 'Avg Early Minutes', Math.round(avgMins) + ' min', ''],
            ];
        },
        short_hours: () => [
            ['Total Short Hours', data.length, '', '', '', ''],
        ],
        missed_punch: () => {
            const noClockIn = data.filter((e) => !e.attandance_first_clock_in).length;
            const noClockOut = data.filter((e) => !e.attandance_last_clock_out && e.attandance_first_clock_in).length;
            return [
                ['Total Missed Punch', data.length, '', 'Missing Clock-In', noClockIn, ''],
                ['Missing Clock-Out', noClockOut, '', '', '', ''],
            ];
        },
    };

    // ── Assemble rows ────────────────────────────────────────────────────────
    const excelData = [];

    // Title
    excelData.push(['', '', `Attendance Exception Report – ${tabLabel}`, '', `Date: ${formattedDate}`, '', '']);
    excelData.push(['', '', `Generated: ${new Date().toLocaleString()}`, '', `Total Records: ${data.length}`, '', '']);
    excelData.push(['']);

    // Summary
    excelData.push(['Summary', '', '', '', '', '']);
    (summaryRows[tabKey] || (() => []))().forEach((r) => excelData.push(r));
    excelData.push(['']);

    // Table headers + data
    excelData.push(headers);
    data.forEach((emp, i) => {
        excelData.push(schema.map((s) => s.get(emp, i) ?? ''));
    });

    // ── Tab-specific colour accents ──────────────────────────────────────────
    const accentColors = {
        late_coming: { headerBg: '#b45309', summaryBg: '#fef9c3' },
        early_going: { headerBg: '#c2410c', summaryBg: '#ffedd5' },
        short_hours: { headerBg: '#b91c1c', summaryBg: '#fee2e2' },
        missed_punch: { headerBg: '#7e22ce', summaryBg: '#f3e8ff' },
    };
    const accent = accentColors[tabKey] || accentColors.late_coming;
    const headerRowIndex = excelData.findIndex((r) => r[0] === headers[0]);

    // ── HTML table ───────────────────────────────────────────────────────────
    const tableHTML = `
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;border:2px solid #000;">
  <tbody>
    ${excelData.map((row, rowIndex) => `
      <tr>
        ${row.map((cell, cellIndex) => {
        let style = 'border:1px solid #888;padding:7px;text-align:center;';
        if (rowIndex === 0 && cellIndex === 2) {
            style += `font-weight:bold;font-size:18px;color:#000;`;
        } else if (rowIndex === 1 && (cellIndex === 2 || cellIndex === 4)) {
            style += 'font-size:13px;font-weight:bold;';
        } else if (rowIndex === 3) {
            // "Summary" row
            style += `background:${accent.summaryBg};font-weight:bold;font-size:14px;border:2px solid #000;`;
        } else if (rowIndex > 3 && rowIndex < headerRowIndex) {
            // summary data rows
            style += `background:${accent.summaryBg};font-size:12px;`;
            if (typeof cell === 'number') style += 'font-weight:bold;';
        } else if (rowIndex === headerRowIndex) {
            // column headers
            style += `background:${accent.headerBg};color:#fff;font-weight:bold;font-size:12px;border:2px solid #000;`;
        } else if (rowIndex > headerRowIndex) {
            // data cells
            const isStatusCol = cellIndex === headers.indexOf('Status');
            const isHighlight = isStatusCol
                ? ''
                : (cellIndex === headers.indexOf('Late By') || cellIndex === headers.indexOf('Left Early By') || cellIndex === headers.indexOf('Short By'))
                    ? `background:${accent.summaryBg};font-weight:bold;`
                    : '';
            style += isHighlight || 'text-align:left;';
            if (cellIndex < 2) style += 'font-weight:bold;text-align:left;';
        }
        return `<td style="${style}">${cell ?? ''}</td>`;
    }).join('')}
      </tr>
    `).join('')}
  </tbody>
</table>`;

    const suffix = formattedDate.replace(/,/g, '').replace(/\s/g, '_');
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Exception_Report_${tabLabel.replace(/\s+/g, '_')}_${suffix}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const parseHoursToMinutes = (str) => {
    if (!str || str === '--' || str === '0h 0m') return 0;
    const match = str.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};