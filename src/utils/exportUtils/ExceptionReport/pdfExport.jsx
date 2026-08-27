// utils/exportUtils/ExceptionReport/pdfExport.js
import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
    commonPdfStyles as styles,
    formatAsHeaderDate,
    PDFHeaderBanner,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

// ─── Helper ───────────────────────────────────────────────────────────────────
const parseHoursToMinutes = (str) => {
    if (!str || str === '--' || str === '0h 0m') return 0;
    const match = String(str).match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

// ─── Column schemas ───────────────────────────────────────────────────────────
const getColumns = (tabKey) => {
    if (tabKey === 'all_employees' || !tabKey) {
        return [
            { label: '#', key: 'sno', width: '4%', get: (e, i) => String(i + 1) },
            { label: 'Employee', key: 'name', width: '16%', get: (e) => e.employee_name || '--' },
            { label: 'Code', key: 'code', width: '8%', get: (e) => e.employee_code || '--' },
            { label: 'Work Days', key: 'shift', width: '9%', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
            { label: 'Clock In', key: 'ci', width: '8%', get: (e) => e.attandance_first_clock_in || (e.lateDays !== undefined ? `Late: ${e.lateDays}d` : '--') },
            { label: 'Clock Out', key: 'co', width: '8%', get: (e) => e.attandance_last_clock_out || (e.earlyDays !== undefined ? `Early: ${e.earlyDays}d` : '--') },
            { label: 'Work Hrs', key: 'wh', width: '7%', get: (e) => e.shift_working_hours || (e.shortHoursDays !== undefined ? `Short: ${e.shortHoursDays}d` : '--') },
            { label: 'Att Hrs', key: 'ah', width: '7%', get: (e) => e.attandance_hours || (e.missedPunchDays !== undefined ? `Missed: ${e.missedPunchDays}d` : '--') },
            { label: 'Late By', key: 'late', width: '8%', get: (e) => (e.exception_types || []).includes('late_coming') ? (e.late_coming_time || (e.totalLateTime ? `${e.lateDays}d (${e.totalLateTime})` : '--')) : '--', accent: true },
            { label: 'Early By', key: 'early', width: '8%', get: (e) => (e.exception_types || []).includes('early_going') ? (e.early_going_time || (e.totalEarlyTime ? `${e.earlyDays}d (${e.totalEarlyTime})` : '--')) : '--', accent: true },
            {
                label: 'Exceptions', key: 'ex', width: '17%', get: (e) => {
                    const t = e.exception_types || [];
                    if (t.length === 0) return 'On Time';
                    return t.map(x => ({ late_coming: 'Late', early_going: 'Early Going', short_hours: 'Short Hrs', missed_punch: 'Missed Punch' }[x] || x)).join(' | ');
                }
            },
        ];
    }

    const base = [
        { label: '#', key: 'sno', width: '4%', get: (e, i) => String(i + 1) },
        { label: 'Employee', key: 'name', width: '20%', get: (e) => e.employee_name || '--' },
        { label: 'Code', key: 'code', width: '10%', get: (e) => e.employee_code || '--' },
        { label: 'Total Days', key: 'total_days', width: '12%', get: (e) => e.totalDays ? `${e.totalDays} Days` : (e.shift_name || '--') },
    ];

    const extras = {
        late_coming: [
            { label: 'Late Days', key: 'late_days', width: '14%', get: (e) => e.lateDays !== undefined ? `${e.lateDays} Days` : (e.shift_from_time || '--') },
            { label: 'Total Late Time', key: 'total_late', width: '20%', get: (e) => e.totalLateTime || e.late_coming_time || '--', accent: true },
        ],
        early_going: [
            { label: 'Early Days', key: 'early_days', width: '14%', get: (e) => e.earlyDays !== undefined ? `${e.earlyDays} Days` : (e.shift_to_time || '--') },
            { label: 'Total Early Time', key: 'total_early', width: '20%', get: (e) => e.totalEarlyTime || e.early_going_time || '--', accent: true },
        ],
        short_hours: [
            { label: 'Short Days', key: 'short_days', width: '14%', get: (e) => e.shortHoursDays !== undefined ? `${e.shortHoursDays} Days` : (e.shift_working_hours || '--') },
            { label: 'Total Short Time', key: 'total_short', width: '20%', get: (e) => e.totalShortTime || '--', accent: true },
        ],
        missed_punch: [
            { label: 'Missed Punch Days', key: 'missed_days', width: '24%', get: (e) => e.missedPunchDays !== undefined ? `${e.missedPunchDays} Days` : String((e.attendance_history || []).length), accent: true },
        ],
    };

    return [...base, ...(extras[tabKey] || [])];
};

// ─── PDF Document ─────────────────────────────────────────────────────────────
const ExceptionPDFDocument = ({ data, selectedDate, tabKey, tabLabel = 'All Employees', companyName = 'Your Company Name' }) => {
    const columns = getColumns(tabKey);
    const formatDate = (d) => formatAsHeaderDate(d);
    const safeTitleLabel = String(tabLabel || 'All Employees').toUpperCase();

    const chunkSize = 30;
    const chunks = [];
    for (let i = 0; i < (data || []).length; i += chunkSize) chunks.push(data.slice(i, i + chunkSize));
    if (chunks.length === 0) chunks.push([]);

    return (
        <Document>
            {chunks.map((chunk, pageIdx) => (
                <Page key={pageIdx} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <PDFHeaderBanner
                        title={`ATTENDANCE EXCEPTION REPORT – ${safeTitleLabel}`}
                        companyName={companyName}
                        dateRangeText={`Date / Period: ${formatDate(selectedDate)}`}
                    />

                    {/* Table */}
                    <View style={styles.content}>
                        <View style={styles.table}>
                            {/* Header row */}
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                {columns.map((col, cIdx) => (
                                    <View key={col.key} style={[styles.tableCol, { width: col.width }, cIdx === columns.length - 1 && { borderRightWidth: 0 }]}>
                                        <Text style={styles.th}>{col.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Data rows */}
                            {chunk.map((emp, idx) => (
                                <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.zebra]}>
                                    {columns.map((col, cIdx) => (
                                        <View key={col.key} style={[styles.tableCol, { width: col.width }, cIdx === columns.length - 1 && { borderRightWidth: 0 }]}>
                                            <Text style={col.accent ? styles.inactiveStatus : styles.tdCenter}>
                                                {col.get(emp, pageIdx * chunkSize + idx)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Footer */}
                    <PDFFooter totalCount={(data || []).length} itemLabel="Records" />
                </Page>
            ))}
        </Document>
    );
};

// ─── Export function ──────────────────────────────────────────────────────────
export const exportExceptionToPDF = async (data, selectedDate, tabKey, tabLabel, filename = 'exception_report', companyName = 'Your Company Name') => {
    if (!data || data.length === 0) throw new Error('No data available to export');

    const doc = <ExceptionPDFDocument data={data} selectedDate={selectedDate} tabKey={tabKey} tabLabel={tabLabel} companyName={companyName} />;
    const dateStr = selectedDate ? (selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : String(selectedDate).split('T')[0]) : 'report';
    await downloadPdfDocument(doc, `${filename}_${dateStr}.pdf`);
    return { success: true, message: 'PDF exported successfully!' };
};