// src/utils/exportUtils/DetailDailyReport/pdfExport.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import {
    commonPdfStyles as commonStyles,
    formatAsHeaderDate,
    formatPrintedOn,
    PDFHeaderBanner,
    PDFFiltersSection,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

const pad2 = (n) => (n < 10 ? `0${n}` : String(n));
const safe = (v, def = '—') => (v === null || v === undefined || v === '' ? def : v);

const fmtTime = (t) => {
    if (!t || t === '00:00:00') return '—';
    if (t.includes('AM') || t.includes('PM')) return t;
    const [hh, mm] = t.split(':');
    const H = parseInt(hh, 10);
    const h12 = H % 12 || 12;
    const ap = H < 12 ? 'AM' : 'PM';
    return `${h12}:${mm} ${ap}`;
};

const fmtShort = (t) => {
    if (!t || t === '00:00:00') return '';
    if (t.includes('AM') || t.includes('PM')) {
        const parts = t.split(' ');
        if (parts.length === 2) {
            const [time] = parts;
            const [hh, mm] = time.split(':');
            return `${hh}:${mm}`;
        }
    }
    if (t.includes(':')) {
        const [hh, mm] = t.split(':');
        const H = parseInt(hh, 10);
        const h12 = H % 12 || 12;
        return `${h12}:${mm}`;
    }
    return t;
};

const MAX_PUNCH_CHIPS = 6;

const buildPunchChips = (emp) => {
    const list = Array.isArray(emp.attendance_history) ? emp.attendance_history : [];
    if (!list.length) return [];

    const chips = [];
    for (let i = 0; i < list.length; i += 2) {
        const inRecord = list[i];
        const outRecord = list[i + 1];
        if (!inRecord) continue;

        const extractTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            const parts = dateTimeStr.split(' ');
            if (parts.length < 3) return '';
            return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
        };

        const inTime = fmtShort(extractTime(inRecord.clock_date_time));
        const outTime = outRecord ? fmtShort(extractTime(outRecord.clock_date_time)) : '';

        if (inTime && outTime) {
            chips.push(`${inTime}–${outTime}`);
        } else if (inTime) {
            chips.push(`${inTime}→`);
        }
    }

    if (chips.length > MAX_PUNCH_CHIPS) {
        const visible = chips.slice(0, MAX_PUNCH_CHIPS);
        const more = chips.length - MAX_PUNCH_CHIPS;
        return [...visible, `+${more} more`];
    }
    return chips;
};

const statusSuffix = (emp) => {
    const arr = Array.isArray(emp.attendance_history) ? emp.attendance_history : [];
    if (!arr.length) return '';
    const hasOpenPunch = arr.length % 2 !== 0;
    return hasOpenPunch ? ' (No OutPunch)' : '';
};

const COLS = {
    sno: 4.5,
    emp: 20.5,
    shift: 6.5,
    shiftTime: 10.0,
    cin: 7.3,
    cout: 7.3,
    work: 7.0,
    tot: 7.0,
    late: 6.3,
    ot: 5.3,
    early: 6.3,
    status: 8.3,
    punches: 13.7
};

const styles = StyleSheet.create({
    prWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    prPill: {
        borderWidth: 0.4,
        borderColor: '#d8b4fe',
        borderRadius: 2.5,
        paddingVertical: 0.3,
        paddingHorizontal: 1.6,
        marginRight: 1.6,
        marginBottom: 1.6,
        fontSize: 6.2,
        color: '#581c87',
        backgroundColor: '#f3e8ff',
        lineHeight: 1.05
    }
});

const TableHeader = () => (
    <View style={[commonStyles.tableRow, commonStyles.tableHeaderRow]}>
        <View style={[commonStyles.tableCol, { width: `${COLS.sno}%` }]}><Text style={commonStyles.th}>S.No.</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.emp}%` }]}><Text style={commonStyles.th}>Employee</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.shift}%` }]}><Text style={commonStyles.th}>Shift</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.shiftTime}%` }]}><Text style={commonStyles.th}>Shift Time</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.cin}%` }]}><Text style={commonStyles.th}>A. InTime</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.cout}%` }]}><Text style={commonStyles.th}>A. OutTime</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.work}%` }]}><Text style={commonStyles.th}>Work Dur.</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.tot}%` }]}><Text style={commonStyles.th}>Tot. Dur.</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.late}%` }]}><Text style={commonStyles.th}>Remain Hrs</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.ot}%` }]}><Text style={commonStyles.th}>OT</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.early}%` }]}><Text style={commonStyles.th}>EarlyGoing</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.status}%` }]}><Text style={commonStyles.th}>Status</Text></View>
        <View style={[commonStyles.tableCol, { width: `${COLS.punches}%`, borderRightWidth: 0 }]}><Text style={commonStyles.th}>Punch Records</Text></View>
    </View>
);

const Row = ({ i, emp }) => {
    const employeeLabel = `${safe(emp.employee_name, '')}${emp.employee_code ? ` (${emp.employee_code})` : ''}`;
    const shiftTime = emp.shift_from_time && emp.shift_to_time ? `${emp.shift_from_time} - ${emp.shift_to_time}` : '—';
    const statusWithNote = `${safe(emp.status, '—')}${statusSuffix(emp)}`;

    const workDur = emp.shift_working_hours || '—';
    const totDur = emp.attandance_hours || '—';
    const otDur = emp.overtime_hours || '—';
    const lateBy = emp.late_hours || '—';
    const early = emp.early_going_by ? emp.early_going_by : '—';
    const chips = buildPunchChips(emp);
    const isAbsent = (emp.status || '').toLowerCase().includes('absent');

    return (
        <View style={[commonStyles.tableRow, i % 2 === 1 && commonStyles.zebra]} wrap={false}>
            <View style={[commonStyles.tableCol, { width: `${COLS.sno}%` }]}><Text style={commonStyles.tdCenter}>{emp.sno || i + 1}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.emp}%` }]}><Text style={commonStyles.empNameText}>{employeeLabel || '—'}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.shift}%` }]}><Text style={commonStyles.tdLeft}>{safe(emp.shift_name, '—')}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.shiftTime}%` }]}><Text style={commonStyles.tdCenter}>{shiftTime}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.cin}%` }]}><Text style={commonStyles.tdCenter}>{fmtTime(emp.attandance_first_clock_in) || '—'}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.cout}%` }]}><Text style={commonStyles.tdCenter}>{fmtTime(emp.attandance_last_clock_out) || '—'}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.work}%` }]}><Text style={commonStyles.tdCenter}>{workDur}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.tot}%` }]}><Text style={commonStyles.tdCenter}>{totDur}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.late}%` }]}><Text style={commonStyles.tdCenter}>{lateBy}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.ot}%` }]}><Text style={commonStyles.tdCenter}>{otDur}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.early}%` }]}><Text style={commonStyles.tdCenter}>{early}</Text></View>
            <View style={[commonStyles.tableCol, { width: `${COLS.status}%` }]}>
                <Text style={[commonStyles.tdCenter, isAbsent ? commonStyles.inactiveStatus : commonStyles.activeStatus]}>
                    {statusWithNote}
                </Text>
            </View>
            <View style={[commonStyles.tableCol, { width: `${COLS.punches}%`, borderRightWidth: 0 }]}>
                {chips.length === 0 ? (
                    <Text style={commonStyles.tdCenter}>—</Text>
                ) : (
                    <View style={styles.prWrap}>
                        {chips.map((txt, idx) => (
                            <Text key={idx} style={styles.prPill}>{txt}</Text>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

const DetailedDailyDocument = ({ rows, reportDate, companyName, filterLabels }) => {
    const appliedList = Object.entries(filterLabels || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={commonStyles.page}>
                <PDFHeaderBanner
                    title="DETAILED DAILY ATTENDANCE"
                    companyName={companyName}
                    dateRangeText={`Attendance Date: ${formatAsHeaderDate(reportDate)}`}
                />

                <View style={commonStyles.content}>
                    {appliedList.length > 0 && <PDFFiltersSection appliedFilters={appliedList} />}

                    <View style={commonStyles.table}>
                        <TableHeader />
                        {rows.map((r, idx) => (
                            <Row key={r.employee_id || r.employee_code || idx} i={idx} emp={r} />
                        ))}
                    </View>
                </View>

                <PDFFooter totalCount={rows.length} itemLabel="Records" />
            </Page>
        </Document>
    );
};

/* ---------- Public API ---------- */
export const exportToPDF = async (
    dataWithSno,
    selectedDate,
    companyName = 'Your Company Name',
    fileName = `detailed_daily_attendance_${new Date().toISOString().slice(0, 10)}`,
    _appliedFilters = {},
    filterLabels = {}
) => {
    if (!Array.isArray(dataWithSno) || dataWithSno.length === 0) {
        throw new Error('No data available to export');
    }

    const doc = (
        <DetailedDailyDocument
            rows={dataWithSno}
            reportDate={selectedDate}
            companyName={companyName}
            filterLabels={filterLabels}
        />
    );

    const fn = `${fileName}.pdf`;
    await downloadPdfDocument(doc, fn);

    return { success: true, fileName: fn, recordCount: dataWithSno.length };
};
