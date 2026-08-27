import { exportToStyledExcel } from '../commonExcelExport';

const parseHoursToMinutes = (str) => {
    if (!str || str === '--' || str === '0h 0m') return 0;
    const match = str.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

/**
 * Excel export for Attendance Exception Report - Styled Purple Theme
 * @param {Array}  data      - Filtered exception records for the active tab
 * @param {Date}   reportDate
 * @param {string} tabKey    - 'late_coming' | 'early_going' | 'short_hours' | 'missed_punch'
 * @param {string} tabLabel  - Human-readable tab name
 * @param {string} filename
 * @param {Object} options
 */
export const exportExceptionToExcel = async (data, reportDate, tabKey, tabLabel, filename, options = {}) => {
    if (!data || data.length === 0) throw new Error('No data available to export');

    const columnSchemas = {
        all_employees: [
            { header: 'S.No.', get: (e, i) => i + 1 },
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
            { header: 'S.No.', get: (e, i) => i + 1 },
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
            { header: 'S.No.', get: (e, i) => i + 1 },
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
            { header: 'S.No.', get: (e, i) => i + 1 },
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
            { header: 'S.No.', get: (e, i) => i + 1 },
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
    const headers = schema.map(s => s.header);

    const formattedData = data.map((emp, i) => {
        const rowObj = {};
        schema.forEach((col) => {
            rowObj[col.header] = col.get(emp, i) ?? '';
        });
        return rowObj;
    });

    const summaryCards = [
        { label: 'Total Records', value: data.length },
    ];

    if (tabKey === 'all_employees') {
        const exCount = data.filter((e) => (e.exception_types || []).length > 0).length;
        summaryCards.push({ label: 'With Exceptions', value: exCount });
        summaryCards.push({ label: 'Clean Records', value: data.length - exCount });
    } else if (tabKey === 'late_coming') {
        const avgMins = data.reduce((a, e) => a + parseInt(e.late_coming_minutes || 0, 10), 0) / data.length;
        summaryCards.push({ label: 'Avg Late Mins', value: `${Math.round(avgMins)} min` });
    } else if (tabKey === 'early_going') {
        const avgMins = data.reduce((a, e) => a + parseInt(e.early_going_minutes || 0, 10), 0) / data.length;
        summaryCards.push({ label: 'Avg Early Mins', value: `${Math.round(avgMins)} min` });
    } else if (tabKey === 'missed_punch') {
        const noClockIn = data.filter((e) => !e.attandance_first_clock_in).length;
        const noClockOut = data.filter((e) => !e.attandance_last_clock_out && e.attandance_first_clock_in).length;
        summaryCards.push({ label: 'Missing Clock-In', value: noClockIn });
        summaryCards.push({ label: 'Missing Clock-Out', value: noClockOut });
    }

    let formattedDate = '';
    if (reportDate) {
        try {
            formattedDate = new Date(reportDate).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch (e) {
            formattedDate = String(reportDate);
        }
    }

    await exportToStyledExcel({
        title: `ATTENDANCE EXCEPTION REPORT – ${tabLabel.toUpperCase()}`,
        companyName: options.companyName || 'Your Company Name',
        dateRangeText: formattedDate ? `Date: ${formattedDate}` : '',
        summaryCards,
        headers,
        data: formattedData,
        filename: filename || `exception_report_${tabKey}_${formattedDate.replace(/,/g, '').replace(/\s+/g, '_')}`,
        sheetName: tabLabel.slice(0, 30),
    });
};

/**
 * Excel export function for Monthly Exception Report - Styled Purple Theme
 * @param {Array} data - Array of employee monthly exception objects
 * @param {string} monthYear - Month & Year string e.g. "2026-08"
 * @param {string} tabKey - Active tab key ('all_employees', 'late_coming', etc.)
 * @param {string} tabLabel - Human-readable tab label
 * @param {string} filename - Filename string
 * @param {Object} options - Additional options including companyName
 */
export const exportMonthlyExceptionToExcel = async (
    data,
    monthYear,
    tabKey,
    tabLabel,
    filename,
    options = {}
) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    const columnSchemas = {
        all_employees: [
            { header: 'S.No.', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Working Days', get: (e) => e.totalDays ?? e.total_days ?? '--' },
            { header: 'Late Days', get: (e) => e.lateDays ?? e.late_days ?? 0 },
            { header: 'Early Days', get: (e) => e.earlyDays ?? e.early_days ?? 0 },
            { header: 'Short Hours Days', get: (e) => e.shortHoursDays ?? e.short_days ?? 0 },
            { header: 'Missed Punch Days', get: (e) => e.missedPunchDays ?? e.missed_days ?? 0 },
            {
                header: 'Exception Details', get: (e) => {
                    const exTypes = e.exception_types || [];
                    const details = [];
                    if (exTypes.includes('late_coming')) details.push(`Late: ${e.lateDays || 0}d (${e.totalLateTime || '0m'})`);
                    if (exTypes.includes('early_going')) details.push(`Early: ${e.earlyDays || 0}d (${e.totalEarlyTime || '0m'})`);
                    if (exTypes.includes('short_hours')) details.push(`Short: ${e.shortHoursDays || 0}d (${e.totalShortTime || '0m'})`);
                    if (exTypes.includes('missed_punch')) details.push(`Missed: ${e.missedPunchDays || 0}d`);
                    return details.length > 0 ? details.join(', ') : 'Clean Record';
                }
            },
        ],
        late_coming: [
            { header: 'S.No.', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Working Days', get: (e) => e.totalDays ?? e.total_days ?? '--' },
            { header: 'Late Days', get: (e) => e.lateDays ?? e.late_days ?? 0 },
            { header: 'Total Late Time', get: (e) => e.totalLateTime || e.total_late || '--' },
        ],
        early_going: [
            { header: 'S.No.', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Working Days', get: (e) => e.totalDays ?? e.total_days ?? '--' },
            { header: 'Early Days', get: (e) => e.earlyDays ?? e.early_days ?? 0 },
            { header: 'Total Early Time', get: (e) => e.totalEarlyTime || e.total_early || '--' },
        ],
        short_hours: [
            { header: 'S.No.', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Working Days', get: (e) => e.totalDays ?? e.total_days ?? '--' },
            { header: 'Short Hours Days', get: (e) => e.shortHoursDays ?? e.short_days ?? 0 },
            { header: 'Total Short Time', get: (e) => e.totalShortTime || e.total_short || '--' },
        ],
        missed_punch: [
            { header: 'S.No.', get: (e, i) => i + 1 },
            { header: 'Employee Name', get: (e) => e.employee_name || '--' },
            { header: 'Employee Code', get: (e) => e.employee_code || '--' },
            { header: 'Working Days', get: (e) => e.totalDays ?? e.total_days ?? '--' },
            { header: 'Missed Punch Days', get: (e) => e.missedPunchDays ?? e.missed_days ?? 0 },
        ],
    };

    const schema = columnSchemas[tabKey] || columnSchemas.all_employees;
    const headers = schema.map(s => s.header);

    const formattedData = data.map((emp, i) => {
        const rowObj = {};
        schema.forEach((col) => {
            rowObj[col.header] = col.get(emp, i) ?? '';
        });
        return rowObj;
    });

    const summaryCards = [
        { label: 'Total Employees', value: data.length },
    ];

    if (tabKey === 'all_employees') {
        const exCount = data.filter((e) => (e.exception_types || []).length > 0).length;
        summaryCards.push({ label: 'With Exceptions', value: exCount });
        summaryCards.push({ label: 'Clean Records', value: data.length - exCount });
    } else if (tabKey === 'late_coming') {
        const totalLateDays = data.reduce((sum, e) => sum + Number(e.lateDays || 0), 0);
        summaryCards.push({ label: 'Total Late Days', value: totalLateDays });
    } else if (tabKey === 'early_going') {
        const totalEarlyDays = data.reduce((sum, e) => sum + Number(e.earlyDays || 0), 0);
        summaryCards.push({ label: 'Total Early Days', value: totalEarlyDays });
    } else if (tabKey === 'short_hours') {
        const totalShortDays = data.reduce((sum, e) => sum + Number(e.shortHoursDays || 0), 0);
        summaryCards.push({ label: 'Total Short Days', value: totalShortDays });
    } else if (tabKey === 'missed_punch') {
        const totalMissedDays = data.reduce((sum, e) => sum + Number(e.missedPunchDays || 0), 0);
        summaryCards.push({ label: 'Total Missed Days', value: totalMissedDays });
    }

    let dateRangeText = '';
    if (monthYear) {
        try {
            const [y, m] = monthYear.split('-');
            const d = new Date(Number(y), Number(m) - 1, 1);
            dateRangeText = `Month: ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        } catch (e) {
            dateRangeText = `Month: ${monthYear}`;
        }
    }

    await exportToStyledExcel({
        title: `MONTHLY EXCEPTION REPORT – ${tabLabel.toUpperCase()}`,
        companyName: options.companyName || 'Your Company Name',
        dateRangeText,
        summaryCards,
        headers,
        data: formattedData,
        filename: filename || `monthly_exception_report_${tabKey}_${monthYear}`,
        sheetName: tabLabel.slice(0, 30),
    });
};