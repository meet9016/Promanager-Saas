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
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Work Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Clock In', get: (e) => e.attandance_first_clock_in || (e.lateDays !== undefined ? `Late: ${e.lateDays}d` : '--') },
            { header: 'Clock Out', get: (e) => e.attandance_last_clock_out || (e.earlyDays !== undefined ? `Early: ${e.earlyDays}d` : '--') },
            { header: 'Work Hrs', get: (e) => e.shift_working_hours || (e.shortHoursDays !== undefined ? `Short: ${e.shortHoursDays}d` : '--') },
            { header: 'Att Hrs', get: (e) => e.attandance_hours || (e.missedPunchDays !== undefined ? `Missed: ${e.missedPunchDays}d` : '--') },
            { header: 'Late By', get: (e) => (e.exception_types || []).includes('late_coming') ? (e.late_coming_time || (e.totalLateTime ? `${e.lateDays}d (${e.totalLateTime})` : '--')) : '--' },
            { header: 'Early By', get: (e) => (e.exception_types || []).includes('early_going') ? (e.early_going_time || (e.totalEarlyTime ? `${e.earlyDays}d (${e.totalEarlyTime})` : '--')) : '--' },
            {
                header: 'Exceptions', get: (e) => {
                    const t = e.exception_types || [];
                    if (t.length === 0) return 'On Time';
                    return t.map(x => ({ late_coming: 'Late', early_going: 'Early Going', short_hours: 'Short Hrs', missed_punch: 'Missed Punch' }[x] || x)).join(' | ');
                }
            },
        ],
        late_coming: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Late Days', get: (e) => e.lateDays !== undefined ? `${e.lateDays} Days` : (e.shift_from_time || '--') },
            { header: 'Total Late Time', get: (e) => e.totalLateTime || e.late_coming_time || '--' },
        ],
        early_going: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Early Days', get: (e) => e.earlyDays !== undefined ? `${e.earlyDays} Days` : (e.shift_to_time || '--') },
            { header: 'Total Early Time', get: (e) => e.totalEarlyTime || e.early_going_time || '--' },
        ],
        short_hours: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Short Days', get: (e) => e.shortHoursDays !== undefined ? `${e.shortHoursDays} Days` : (e.shift_working_hours || '--') },
            { header: 'Total Short Time', get: (e) => e.totalShortTime || '--' },
        ],
        missed_punch: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Missed Punch Days', get: (e) => e.missedPunchDays !== undefined ? `${e.missedPunchDays} Days` : String((e.attendance_history || []).length) },
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
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Work Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Clock In', get: (e) => e.attandance_first_clock_in || (e.lateDays !== undefined ? `Late: ${e.lateDays}d` : '--') },
            { header: 'Clock Out', get: (e) => e.attandance_last_clock_out || (e.earlyDays !== undefined ? `Early: ${e.earlyDays}d` : '--') },
            { header: 'Work Hrs', get: (e) => e.shift_working_hours || (e.shortHoursDays !== undefined ? `Short: ${e.shortHoursDays}d` : '--') },
            { header: 'Att Hrs', get: (e) => e.attandance_hours || (e.missedPunchDays !== undefined ? `Missed: ${e.missedPunchDays}d` : '--') },
            { header: 'Late By', get: (e) => (e.exception_types || []).includes('late_coming') ? (e.late_coming_time || (e.totalLateTime ? `${e.lateDays}d (${e.totalLateTime})` : '--')) : '--' },
            { header: 'Early By', get: (e) => (e.exception_types || []).includes('early_going') ? (e.early_going_time || (e.totalEarlyTime ? `${e.earlyDays}d (${e.totalEarlyTime})` : '--')) : '--' },
            {
                header: 'Exceptions', get: (e) => {
                    const t = e.exception_types || [];
                    if (t.length === 0) return 'On Time';
                    return t.map(x => ({ late_coming: 'Late', early_going: 'Early Going', short_hours: 'Short Hrs', missed_punch: 'Missed Punch' }[x] || x)).join(' | ');
                }
            },
        ],
        late_coming: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Late Days', get: (e) => e.lateDays !== undefined ? `${e.lateDays} Days` : (e.shift_from_time || '--') },
            { header: 'Total Late Time', get: (e) => e.totalLateTime || e.late_coming_time || '--' },
        ],
        early_going: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Early Days', get: (e) => e.earlyDays !== undefined ? `${e.earlyDays} Days` : (e.shift_to_time || '--') },
            { header: 'Total Early Time', get: (e) => e.totalEarlyTime || e.early_going_time || '--' },
        ],
        short_hours: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Short Days', get: (e) => e.shortHoursDays !== undefined ? `${e.shortHoursDays} Days` : (e.shift_working_hours || '--') },
            { header: 'Total Short Time', get: (e) => e.totalShortTime || '--' },
        ],
        missed_punch: [
            { header: '#', get: (e, i) => i + 1 },
            { header: 'Employee', get: (e) => e.employee_name || '--' },
            { header: 'Code', get: (e) => e.employee_code || '--' },
            { header: 'Total Days', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { header: 'Missed Punch Days', get: (e) => e.missedPunchDays !== undefined ? `${e.missedPunchDays} Days` : String((e.attendance_history || []).length) },
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