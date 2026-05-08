// utils/ExcelExportDateRange.jsx

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Parse "8h 8m" / "2h 12m" / "0h 0m" → total minutes */
const parseHoursToMinutes = (hoursString) => {
    if (!hoursString || hoursString.trim() === '') return 0;
    let total = 0;
    const hm = hoursString.match(/(\d+)h/);
    const mm = hoursString.match(/(\d+)m/);
    if (hm) total += parseInt(hm[1], 10) * 60;
    if (mm) total += parseInt(mm[1], 10);
    return total;
};

/** Total minutes → "Xh Ym" */
const formatMinutesToHours = (totalMinutes) => {
    if (totalMinutes === 0) return '0h 0m';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m === 0 ? `${h}h 0m` : `${h}h ${m}m`;
};

export const formatDate = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// ────────────────────────────────────────────────────────────
// Group & summarise
// ────────────────────────────────────────────────────────────
export const groupDataByEmployee = (data) => {
    const grouped = {};

    data.forEach(record => {
        const key = record.employee_code;
        if (!grouped[key]) {
            grouped[key] = {
                employee_code: record.employee_code,
                employee_name: record.employee_name,
                shift_name: record.shift_name,
                shift_from_time: record.shift_from_time,
                shift_to_time: record.shift_to_time,
                shift_working_hours: record.shift_working_hours,
                records: []
            };
        }
        grouped[key].records.push(record);
    });

    Object.values(grouped).forEach(emp => {
        const records = emp.records;

        // Count by short_status
        const statusCounts = {};
        records.forEach(r => {
            const ss = (r.short_status || '').trim();
            if (ss) statusCounts[ss] = (statusCounts[ss] || 0) + 1;
        });

        // Hour totals via proper string parsing
        let workMin = 0, otMin = 0, lateMin = 0;
        records.forEach(r => {
            workMin += parseHoursToMinutes(r.attandance_hours);
            otMin += parseHoursToMinutes(r.overtime_hours);
            lateMin += parseHoursToMinutes(r.late_hours);
        });

        // Attendance % — present / (total - week-off)
        const presentCount = records.filter(r => (r.short_status || '').startsWith('P')).length;
        const weekOffCount = records.filter(r => r.short_status === 'WO').length;
        const workingDays = records.length - weekOffCount;

        emp.summary = {
            statusCounts,
            statusLine: Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(' | '),
            presentDays: presentCount,
            absentDays: statusCounts['A'] || 0,
            weekOffDays: weekOffCount,
            lateDays: records.filter(r => parseHoursToMinutes(r.late_hours) > 0).length,
            overtimeDays: records.filter(r => parseHoursToMinutes(r.overtime_hours) > 0).length,
            totalHours: formatMinutesToHours(workMin),
            totalOvertimeHours: formatMinutesToHours(otMin),
            totalLateHours: formatMinutesToHours(lateMin),
            attendancePercentage: workingDays > 0 ? ((presentCount / workingDays) * 100).toFixed(1) : '0.0'
        };
    });

    return grouped;
};

export const calculateSummary = (data) => {
    let workMin = 0, otMin = 0, lateMin = 0;
    const statusCounts = {};

    data.forEach(r => {
        workMin += parseHoursToMinutes(r.attandance_hours);
        otMin += parseHoursToMinutes(r.overtime_hours);
        lateMin += parseHoursToMinutes(r.late_hours);
        const ss = (r.short_status || '').trim();
        if (ss) statusCounts[ss] = (statusCounts[ss] || 0) + 1;
    });

    const presentCount = Object.entries(statusCounts)
        .filter(([k]) => k.startsWith('P'))
        .reduce((s, [, v]) => s + v, 0);
    const absentCount = statusCounts['A'] || 0;
    const weekOffCount = statusCounts['WO'] || 0;

    return {
        totalRecords: data.length,
        uniqueEmployees: new Set(data.map(r => r.employee_code)).size,
        presentCount,
        absentCount,
        weekOffCount,
        lateCount: data.filter(r => parseHoursToMinutes(r.late_hours) > 0).length,
        overtimeCount: data.filter(r => parseHoursToMinutes(r.overtime_hours) > 0).length,
        totalHours: formatMinutesToHours(workMin),
        totalOvertimeHours: formatMinutesToHours(otMin),
        totalLateHours: formatMinutesToHours(lateMin)
    };
};

// ────────────────────────────────────────────────────────────
// Styles helpers
// ────────────────────────────────────────────────────────────
const BASE = 'border:1px solid #000;padding:6px;text-align:center;font-family:Arial,sans-serif;font-size:12px;';

const cellStyle = (extra = '') => `style="${BASE}${extra}"`;

const statusStyle = (shortStatus) => {
    const s = (shortStatus || '').toUpperCase();
    if (s === 'P') return 'background-color:#f0fff0;font-weight:bold;';
    if (s === 'A') return 'background-color:#e8e8e8;font-weight:bold;color:#555;';
    if (s === 'WO') return 'background-color:#f5f5f5;font-style:italic;color:#888;';
    // P/INC and others
    return 'background-color:#fff8e1;font-weight:bold;';
};

// ────────────────────────────────────────────────────────────
// Main export function
// ────────────────────────────────────────────────────────────
/**
 * @param {Array}  attendanceData
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} filename
 */
export const exportToExcel = (attendanceData, startDate, endDate, filename = 'attendance_report') => {
    if (!attendanceData || attendanceData.length === 0) {
        throw new Error('No data available to export');
    }

    const groupedData = groupDataByEmployee(attendanceData);
    const reportSummary = calculateSummary(attendanceData);

    const fStart = formatDate(startDate);
    const fEnd = formatDate(endDate);
    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentTime = new Date().toLocaleTimeString();

    // ── build HTML ───────────────────────────────────────────
    let html = `
<table border="1" cellpadding="0" cellspacing="0"
       style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;border:2px solid #000;">
<tbody>

<!-- ═══ REPORT TITLE ═══ -->
<tr>
  <td colspan="8" style="border:2px solid #000;padding:10px;text-align:center;
      font-weight:bold;font-size:18px;background-color:#111;color:#fff;letter-spacing:1px;">
    Employee Attendance Report
  </td>
</tr>

<!-- Period / Generated -->
<tr>
  <td colspan="4" ${cellStyle('text-align:left;font-weight:bold;font-size:13px;background-color:#f5f5f5;')}>
    Period: ${fStart} &nbsp;→&nbsp; ${fEnd}
  </td>
  <td colspan="4" ${cellStyle('text-align:right;font-size:11px;background-color:#f5f5f5;color:#555;')}>
    Generated: ${currentDate} ${currentTime} &nbsp;|&nbsp;
    Records: ${reportSummary.totalRecords} &nbsp;|&nbsp;
    Employees: ${reportSummary.uniqueEmployees}
  </td>
</tr>

<!-- ═══ SUMMARY ═══ -->
<tr>
  <td colspan="8" ${cellStyle('background-color:#222;color:#fff;font-weight:bold;font-size:13px;padding:6px 10px;text-align:left;')}>
    Summary
  </td>
</tr>
<tr>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>Present</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.presentCount}</td>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>Absent</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.absentCount}</td>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>Week Off</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.weekOffCount}</td>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>Late Days</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.lateCount}</td>
</tr>
<tr>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>Total Hours</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.totalHours}</td>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>Overtime Hrs</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.totalOvertimeHours}</td>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>Remain Hrs</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.totalLateHours}</td>
  <td ${cellStyle('text-align:left;font-weight:bold;background-color:#f0f0f0;')}>OT Days</td>
  <td ${cellStyle('font-weight:bold;')}>${reportSummary.overtimeCount}</td>
</tr>

<!-- spacer -->
<tr><td colspan="8" style="height:6px;border:none;"></td></tr>
`;

    // ── per-employee sections ────────────────────────────────
    Object.values(groupedData).forEach(emp => {
        const s = emp.summary;

        html += `
<!-- ═══ EMPLOYEE HEADER ═══ -->
<tr>
  <td colspan="3" ${cellStyle('background-color:#333;color:#fff;font-weight:bold;font-size:13px;text-align:left;padding:6px 10px;')}>
    ${emp.employee_name} &nbsp;(${emp.employee_code})
  </td>
  <td colspan="2" ${cellStyle('background-color:#444;color:#eee;font-size:11px;text-align:left;')}>
    Shift: ${emp.shift_name} &nbsp;|&nbsp; ${emp.shift_from_time} – ${emp.shift_to_time}
  </td>
  <td ${cellStyle('background-color:#444;color:#eee;font-size:11px;')}>
    Att: ${s.attendancePercentage}%
  </td>
  <td colspan="2" ${cellStyle('background-color:#444;color:#eee;font-size:11px;text-align:left;')}>
    ${s.statusLine}
  </td>
</tr>

<!-- sub-summary -->
<tr>
  <td ${cellStyle('text-align:left;font-size:11px;background-color:#f9f9f9;')}>Total Hrs</td>
  <td ${cellStyle('font-size:11px;font-weight:bold;')}>${s.totalHours}</td>
  <td ${cellStyle('text-align:left;font-size:11px;background-color:#f9f9f9;')}>OT Hrs</td>
  <td ${cellStyle('font-size:11px;font-weight:bold;')}>${s.totalOvertimeHours}</td>
  <td ${cellStyle('text-align:left;font-size:11px;background-color:#f9f9f9;')}>Remain Hrs</td>
  <td ${cellStyle('font-size:11px;font-weight:bold;')}>${s.totalLateHours}</td>
  <td ${cellStyle('text-align:left;font-size:11px;background-color:#f9f9f9;')}>Late Days</td>
  <td ${cellStyle('font-size:11px;font-weight:bold;')}>${s.lateDays}</td>
</tr>

<!-- column headers -->
<tr>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>Date</td>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>Status</td>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>Clock In</td>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>Clock Out</td>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>Working Hrs</td>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>OT Hrs</td>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>Remain Hrs</td>
  <td ${cellStyle('background-color:#000;color:#fff;font-weight:bold;font-size:12px;')}>Remarks</td>
</tr>
`;

        // Daily rows
        emp.records.forEach(r => {
            const ss = r.short_status || '--';
            const sStyle = statusStyle(r.short_status);
            const workHrs = r.attandance_hours || '0h 0m';
            const otHrs = r.overtime_hours || '0h 0m';
            const lateHrs = r.late_hours || '0h 0m';
            const hasOT = parseHoursToMinutes(r.overtime_hours) > 0;
            const hasLate = parseHoursToMinutes(r.late_hours) > 0;

            html += `
<tr>
  <td ${cellStyle('text-align:left;font-weight:bold;')}>${formatDate(r.date)}</td>
  <td style="${BASE}${sStyle}">${ss}</td>
  <td ${cellStyle()}>${r.attandance_first_clock_in || '--'}</td>
  <td ${cellStyle()}>${r.attandance_last_clock_out || '--'}</td>
  <td ${cellStyle('font-weight:bold;')}>${workHrs}</td>
  <td ${cellStyle(hasOT ? 'background-color:#f0fff0;font-weight:bold;' : '')}>${otHrs}</td>
  <td ${cellStyle(hasLate ? 'background-color:#fff8e1;font-weight:bold;' : '')}>${lateHrs}</td>
  <td ${cellStyle('color:#555;font-size:11px;')}>${r.remarks || '--'}</td>
</tr>`;
        });

        // Totals row (per employee)
        html += `
<tr>
  <td colspan="2" ${cellStyle('background-color:#222;color:#fff;font-weight:bold;text-align:left;padding:5px 10px;')}>
    Totals — ${s.statusLine}
  </td>
  <td colspan="2" ${cellStyle('background-color:#222;color:#fff;')}></td>
  <td ${cellStyle('background-color:#333;color:#fff;font-weight:bold;')}>${s.totalHours}</td>
  <td ${cellStyle('background-color:#333;color:#fff;font-weight:bold;')}>${s.totalOvertimeHours}</td>
  <td ${cellStyle('background-color:#333;color:#fff;font-weight:bold;')}>${s.totalLateHours}</td>
  <td ${cellStyle('background-color:#222;color:#fff;')}></td>
</tr>

<!-- minimal gap between employees (1 empty row, no extra height) -->
<tr><td colspan="8" style="height:4px;border:none;background-color:#fff;"></td></tr>
`;
    });

    html += `
</tbody>
</table>`;

    // ── download ─────────────────────────────────────────────
    const suffix = `${fStart.replace(/-/g, '_')}_to_${fEnd.replace(/-/g, '_')}`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${suffix}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};