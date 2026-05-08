// utils/exportUtils/ExceptionReport/pdfExport.js
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// ─── Helper ───────────────────────────────────────────────────────────────────
const parseHoursToMinutes = (str) => {
    if (!str || str === '--' || str === '0h 0m') return 0;
    const match = str.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

// ─── Tab metadata ─────────────────────────────────────────────────────────────
const TAB_META = {
    all_employees: { label: 'All Employees', accent: '#1d4ed8' },
    late_coming: { label: 'Late Coming', accent: '#b45309' },
    early_going: { label: 'Early Going', accent: '#c2410c' },
    short_hours: { label: 'Short Hours', accent: '#b91c1c' },
    missed_punch: { label: 'Missed Punch', accent: '#7e22ce' },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (accent) =>
    StyleSheet.create({
        page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 20, fontSize: 8 },
        header: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 8 },
        headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
        title: { fontSize: 14, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 4 },
        subTitle: { fontSize: 10, color: '#444', textAlign: 'center' },
        metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
        metaText: { fontSize: 8, color: '#555' },
        // Summary box
        summaryBox: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
        summaryCard: { flex: 1, borderWidth: 1, borderColor: accent, padding: 6, borderRadius: 4, minWidth: 80 },
        summaryLabel: { fontSize: 7, color: '#555', marginBottom: 2 },
        summaryValue: { fontSize: 12, fontWeight: 'bold', color: accent },
        // Table
        table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', fontSize: 7 },
        tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
        tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: accent },
        cell: { borderRightWidth: 1, borderRightColor: '#ccc', padding: 4, justifyContent: 'center', alignItems: 'center' },
        headerCell: { borderRightWidth: 1, borderRightColor: '#fff', padding: 4, justifyContent: 'center', alignItems: 'center' },
        cellText: { fontSize: 7, textAlign: 'center', color: '#222' },
        headerCellText: { fontSize: 7, textAlign: 'center', color: '#fff', fontWeight: 'bold' },
        accentCellText: { fontSize: 7, textAlign: 'center', color: accent, fontWeight: 'bold' },
        // Footer
        pageNumber: { position: 'absolute', fontSize: 7, bottom: 15, left: 0, right: 0, textAlign: 'center', color: '#888' },
        footer: { position: 'absolute', fontSize: 7, bottom: 28, left: 0, right: 0, textAlign: 'center', color: '#888' },
    });

// ─── Column schemas ───────────────────────────────────────────────────────────
const getColumns = (tabKey) => {
    if (tabKey === 'all_employees') {
        return [
            { label: '#', key: 'sno', width: '4%', get: (e, i) => String(i + 1) },
            { label: 'Employee', key: 'name', width: '14%', get: (e) => e.employee_name || '--' },
            { label: 'Code', key: 'code', width: '8%', get: (e) => e.employee_code || '--' },
            { label: 'Shift', key: 'shift', width: '9%', get: (e) => e.shift_name || '--' },
            { label: 'Clock In', key: 'ci', width: '8%', get: (e) => e.attandance_first_clock_in || '--' },
            { label: 'Clock Out', key: 'co', width: '8%', get: (e) => e.attandance_last_clock_out || '--' },
            { label: 'Work Hrs', key: 'wh', width: '7%', get: (e) => e.shift_working_hours || '--' },
            { label: 'Att Hrs', key: 'ah', width: '7%', get: (e) => e.attandance_hours || '--' },
            { label: 'Status', key: 'status', width: '8%', get: (e) => e.status || '--' },
            { label: 'Late By', key: 'late', width: '7%', get: (e) => (e.exception_types || []).includes('late_coming') ? (e.late_coming_time || '--') : '--', accent: true },
            { label: 'Early By', key: 'early', width: '7%', get: (e) => (e.exception_types || []).includes('early_going') ? (e.early_going_time || '--') : '--', accent: true },
            {
                label: 'Short By', key: 'short', width: '7%', get: (e) => {
                    if (!(e.exception_types || []).includes('short_hours')) return '--';
                    const a = parseHoursToMinutes(e.attandance_hours), s = parseHoursToMinutes(e.shift_working_hours), d = s - a;
                    return d > 0 ? `${Math.floor(d / 60)}h ${d % 60}m` : '--';
                }, accent: true
            },
            {
                label: 'Exceptions', key: 'ex', width: '16%', get: (e) => {
                    const t = e.exception_types || [];
                    if (t.length === 0) return e.attandance_first_clock_in ? 'On Time' : 'No Punch';
                    return t.map(x => ({ late_coming: 'Late', early_going: 'Early Going', short_hours: 'Short Hrs', missed_punch: 'Missed Punch' }[x] || x)).join(' | ');
                }
            },
        ];
    }

    const base = [
        { label: '#', key: 'sno', width: '4%', get: (e, i) => String(i + 1) },
        { label: 'Employee', key: 'name', width: '18%', get: (e) => e.employee_name || '--' },
        { label: 'Code', key: 'code', width: '9%', get: (e) => e.employee_code || '--' },
        { label: 'Shift', key: 'shift', width: '11%', get: (e) => e.shift_name || '--' },
        { label: 'Clock In', key: 'clock_in', width: '9%', get: (e) => e.attandance_first_clock_in || '--' },
        { label: 'Clock Out', key: 'clock_out', width: '9%', get: (e) => e.attandance_last_clock_out || '--' },
    ];

    const extras = {
        late_coming: [
            { label: 'Shift Start', key: 'shift_start', width: '9%', get: (e) => e.shift_from_time || '--' },
            { label: 'Late By', key: 'late_by', width: '9%', get: (e) => e.late_coming_time || '--', accent: true },
            { label: 'Status', key: 'status', width: '10%', get: (e) => e.status || '--' },
        ],
        early_going: [
            { label: 'Shift End', key: 'shift_end', width: '9%', get: (e) => e.shift_to_time || '--' },
            { label: 'Left Early By', key: 'early_by', width: '9%', get: (e) => e.early_going_time || '--', accent: true },
            { label: 'Status', key: 'status', width: '10%', get: (e) => e.status || '--' },
        ],
        short_hours: [
            { label: 'Required', key: 'req', width: '8%', get: (e) => e.shift_working_hours || '--' },
            { label: 'Worked', key: 'worked', width: '8%', get: (e) => e.attandance_hours || '--' },
            {
                label: 'Short By', key: 'short', width: '8%', get: (e) => {
                    const a = parseHoursToMinutes(e.attandance_hours);
                    const s = parseHoursToMinutes(e.shift_working_hours);
                    const d = s - a;
                    return d > 0 ? `${Math.floor(d / 60)}h ${d % 60}m` : '--';
                }, accent: true
            },
            { label: 'Status', key: 'status', width: '9%', get: (e) => e.status || '--' },
        ],
        missed_punch: [
            { label: 'Shift Time', key: 'shift_time', width: '12%', get: (e) => `${e.shift_from_time || '--'} – ${e.shift_to_time || '--'}` },
            { label: 'Punches', key: 'punches', width: '7%', get: (e) => String((e.attendance_history || []).length), accent: true },
            { label: 'Status', key: 'status', width: '9%', get: (e) => e.status || '--' },
        ],
    };

    return [...base, ...(extras[tabKey] || [])];
};

// ─── Summary stats per tab ────────────────────────────────────────────────────
const getSummaryCards = (data, tabKey) => {
    switch (tabKey) {
        case 'all_employees': {
            const exCount = data.filter((e) => (e.exception_types || []).length > 0).length;
            return [
                { label: 'Total Employees', value: data.length },
                { label: 'With Exceptions', value: exCount },
                { label: 'Clean', value: data.length - exCount },
            ];
        }
        case 'late_coming': {
            const avg = data.length
                ? Math.round(data.reduce((a, e) => a + parseInt(e.late_coming_minutes || 0, 10), 0) / data.length)
                : 0;
            return [
                { label: 'Total Late', value: data.length },
                { label: 'Avg Late (min)', value: avg },
            ];
        }
        case 'early_going': {
            const avg = data.length
                ? Math.round(data.reduce((a, e) => a + parseInt(e.early_going_minutes || 0, 10), 0) / data.length)
                : 0;
            return [
                { label: 'Total Early Going', value: data.length },
                { label: 'Avg Early (min)', value: avg },
            ];
        }
        case 'short_hours': {
            return [
                { label: 'Total Short Hours', value: data.length },
            ];
        }
        case 'missed_punch': {
            const noIn = data.filter((e) => !e.attandance_first_clock_in).length;
            const noOut = data.filter((e) => !e.attandance_last_clock_out && e.attandance_first_clock_in).length;
            return [
                { label: 'Total Missed Punch', value: data.length },
                { label: 'Missing Clock-In', value: noIn },
                { label: 'Missing Clock-Out', value: noOut },
            ];
        }
        default:
            return [{ label: 'Total', value: data.length }];
    }
};

// ─── PDF Document ─────────────────────────────────────────────────────────────
const ExceptionPDFDocument = ({ data, selectedDate, tabKey, tabLabel }) => {
    const meta = TAB_META[tabKey] || TAB_META.late_coming;
    const styles = makeStyles(meta.accent);
    const columns = getColumns(tabKey);
    const summaryCards = getSummaryCards(data, tabKey);

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const chunkSize = 30;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) chunks.push(data.slice(i, i + chunkSize));
    if (chunks.length === 0) chunks.push([]);

    return (
        <Document>
            {chunks.map((chunk, pageIdx) => (
                <Page key={pageIdx} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Attendance Exception Report – {tabLabel}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaText}>Date: {formatDate(selectedDate)}</Text>
                            <Text style={styles.metaText}>Generated: {new Date().toLocaleString()}</Text>
                            <Text style={styles.metaText}>Total Records: {data.length}</Text>
                        </View>
                    </View>

                    {/* Summary cards — only on first page */}
                    {pageIdx === 0 && (
                        <View style={styles.summaryBox}>
                            {summaryCards.map((card, i) => (
                                <View key={i} style={styles.summaryCard}>
                                    <Text style={styles.summaryLabel}>{card.label}</Text>
                                    <Text style={styles.summaryValue}>{card.value}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Header row */}
                        <View style={styles.tableHeaderRow}>
                            {columns.map((col) => (
                                <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                                    <Text style={styles.headerCellText}>{col.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Data rows */}
                        {chunk.map((emp, idx) => (
                            <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }]}>
                                {columns.map((col) => (
                                    <View key={col.key} style={[styles.cell, { width: col.width }]}>
                                        <Text style={col.accent ? styles.accentCellText : styles.cellText}>
                                            {col.get(emp, pageIdx * chunkSize + idx)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Footer */}
                    <Text style={styles.footer}>Attendance Exception Report – {tabLabel} | {formatDate(selectedDate)}</Text>
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
                </Page>
            ))}
        </Document>
    );
};

// ─── Export function ──────────────────────────────────────────────────────────
export const exportExceptionToPDF = async (data, selectedDate, tabKey, tabLabel, filename = 'exception_report') => {
    if (!data || data.length === 0) throw new Error('No data available to export');

    const doc = (
        <ExceptionPDFDocument
            data={data}
            selectedDate={selectedDate}
            tabKey={tabKey}
            tabLabel={tabLabel}
        />
    );

    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date(selectedDate).toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
};