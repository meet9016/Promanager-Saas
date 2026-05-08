// src/utils/exportUtils/DetailDailyReport/pdfExport.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

/* ---------------- Fonts ---------------- */
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 }
    ]
});

/* ---------------- Utils ---------------- */
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));
const safe = (v, def = '—') => (v === null || v === undefined || v === '' ? def : v);

const formatDateHuman = (d) => {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return `${dt.toLocaleString('en-US', { month: 'short' })} ${pad2(dt.getDate())} ${dt.getFullYear()}`;
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

// 12h with AM/PM (for A.In / A.Out cells)
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

    // Handle "11:08 AM" format
    if (t.includes('AM') || t.includes('PM')) {
        const parts = t.split(' ');
        if (parts.length === 2) {
            const [time] = parts;
            const [hh, mm] = time.split(':');
            return `${hh}:${mm}`;
        }
    }

    // Handle "HH:MM:SS" format
    if (t.includes(':')) {
        const [hh, mm] = t.split(':');
        const H = parseInt(hh, 10);
        const h12 = H % 12 || 12;
        return `${h12}:${mm}`;
    }

    return t;
};

const fmtHours = (h) => {
    if (!h || h === '0') return '—';
    const n = parseFloat(h);
    if (!Number.isFinite(n) || n === 0) return '—';
    return `${n}h`;
};

/* Punch helpers — condense and cap count */
const MAX_PUNCH_CHIPS = 6;

const buildPunchChips = (emp) => {
    const list = Array.isArray(emp.attendance_history) ? emp.attendance_history : [];
    if (!list.length) return [];

    const chips = [];

    // Process attendance_history - alternating in/out pattern
    for (let i = 0; i < list.length; i += 2) {
        const inRecord = list[i];
        const outRecord = list[i + 1];

        if (!inRecord) continue;

        // Extract time from "30-10-2025 11:08 AM" format
        const extractTime = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            const parts = dateTimeStr.split(' ');
            if (parts.length < 3) return '';
            return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`; // "11:08 AM"
        };

        const inTime = fmtShort(extractTime(inRecord.clock_date_time));
        const outTime = outRecord ? fmtShort(extractTime(outRecord.clock_date_time)) : '';

        if (inTime && outTime) {
            chips.push(`${inTime}–${outTime}`);     // "12:10–12:12"
        } else if (inTime) {
            chips.push(`${inTime}→`);              // open interval
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

    // Check if last entry is an IN without corresponding OUT
    // attendance_history has alternating pattern: even indices are IN, odd are OUT
    const hasOpenPunch = arr.length % 2 !== 0; // odd length means last IN has no OUT

    return hasOpenPunch ? ' (No OutPunch)' : '';
};

/* ---------------- Layout ---------------- */
const PAGE_PADDING = 16;

/* Column widths (sum ≈ 100). */
const COLS = {
    sno: 4.5,
    emp: 20.5,
    shift: 6.5,
    shiftTime: 10.0,
    cin: 7.3,
    cout: 7.3,
    work: 7.0,
    ot: 5.3,
    tot: 7.0,
    late: 6.3,
    early: 6.3,
    status: 8.3,
    punches: 13.7
};

const styles = StyleSheet.create({
    page: {
        padding: PAGE_PADDING,
        fontFamily: 'Roboto',
        backgroundColor: '#FFFFFF'
    },

    /* Header */
    headerWrap: {
        position: 'absolute',
        top: PAGE_PADDING,
        left: PAGE_PADDING,
        right: PAGE_PADDING
    },
    header: {
        paddingBottom: 6,
        marginBottom: 6,
        borderBottom: '1 solid #000'
    },
    title: { fontSize: 12, fontWeight: 700, textAlign: 'center', color: '#000' },
    subtitle: { fontSize: 9, fontWeight: 500, textAlign: 'center', color: '#000', marginTop: 2 },
    infoRow: {
        marginTop: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#000'
    },
    filtersLine: { marginTop: 3, fontSize: 7, color: '#111' },

    /* Table area begins below header */
    tableArea: { marginTop: 72 }, // a bit more air so row #1 never touches header

    /* Table base */
    row: { flexDirection: 'row' },

    th: {
        paddingVertical: 4,
        paddingHorizontal: 4,
        fontSize: 7,
        fontWeight: 700,
        color: '#000',
        lineHeight: 1.12,
        borderTop: '0.8 solid #000',
        borderBottom: '0.8 solid #000',
        backgroundColor: '#F3F3F3'
    },
    td: {
        paddingVertical: 3,
        paddingHorizontal: 4,
        fontSize: 7.1,
        color: '#000',
        lineHeight: 1.12,         // compact row height across table
        borderBottom: '0.5 solid #DADADA'
    },

    /* Alignments */
    left: { textAlign: 'left' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' },

    /* Widths */
    wSno: { width: `${COLS.sno}%` },
    wEmp: { width: `${COLS.emp}%` },
    wShift: { width: `${COLS.shift}%` },
    wShiftTime: { width: `${COLS.shiftTime}%` },
    wCin: { width: `${COLS.cin}%` },
    wCout: { width: `${COLS.cout}%` },
    wWork: { width: `${COLS.work}%` },
    wOT: { width: `${COLS.ot}%` },
    wTot: { width: `${COLS.tot}%` },
    wLate: { width: `${COLS.late}%` },
    wEarly: { width: `${COLS.early}%` },
    wStatus: { width: `${COLS.status}%` },
    wPunch: { width: `${COLS.punches}%` },

    /* Status tones (mono-friendly) */
    stPresent: { color: '#000000', fontWeight: 500 },
    stWeekOff: { color: '#4b2e83', fontWeight: 500 },
    stAbsent: { color: '#666666', fontWeight: 500 },
    stLeave: { color: '#a07900', fontWeight: 500 },
    stHalf: { color: '#114c7f', fontWeight: 500 },
    stOver: { color: '#0a4d7a', fontWeight: 500 },

    statusTight: { fontSize: 7, fontWeight: 500, lineHeight: 1.08 },

    /* Punch Records — super condensed chips */
    prWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    prPill: {
        border: '0.4 solid #BDBDBD',
        borderRadius: 2.5,
        paddingVertical: 0.3,
        paddingHorizontal: 1.6,
        marginRight: 1.6,
        marginBottom: 1.6,
        fontSize: 6.2,             // smaller
        color: '#111',
        backgroundColor: '#FFFFFF',
        lineHeight: 1.05
    },

    /* Footer */
    footer: {
        position: 'absolute',
        left: PAGE_PADDING,
        right: PAGE_PADDING,
        bottom: PAGE_PADDING - 2,
        fontSize: 7,
        color: '#666',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
});

const statusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'present') return styles.stPresent;
    if (s === 'week off' || s === 'weekoff') return styles.stWeekOff;
    if (s === 'absent') return styles.stAbsent;
    if (s === 'leave') return styles.stLeave;
    if (s === 'half day') return styles.stHalf;
    if (s === 'overtime') return styles.stOver;
    return styles.stPresent;
};

/* ---------- Header row ---------- */
const TableHeader = () => (
    <View style={styles.row}>
        <Text style={[styles.th, styles.center, styles.wSno]}>S.No.</Text>
        <Text style={[styles.th, styles.left, styles.wEmp]}>Employee</Text>
        <Text style={[styles.th, styles.left, styles.wShift]}>Shift</Text>
        <Text style={[styles.th, styles.center, styles.wShiftTime]}>Shift Time</Text>
        <Text style={[styles.th, styles.center, styles.wCin]}>A. InTime</Text>
        <Text style={[styles.th, styles.center, styles.wCout]}>A. OutTime</Text>
        <Text style={[styles.th, styles.right, styles.wWork]}>Work Dur.</Text>
        <Text style={[styles.th, styles.right, styles.wTot]}>Tot. Dur.</Text>
        <Text style={[styles.th, styles.right, styles.wLate]}>Remain Hrs</Text>
        <Text style={[styles.th, styles.right, styles.wOT]}>OT</Text>
        <Text style={[styles.th, styles.right, styles.wEarly]}>EarlyGoing</Text>
        <Text style={[styles.th, styles.center, styles.wStatus]}>Status</Text>
        <Text style={[styles.th, styles.left, styles.wPunch]}>Punch Records</Text>
    </View>
);
const estimateFilterLines = (txt) => {
    if (!txt) return 0;
    // approx characters that fit one line at styles.filtersLine (A4-landscape, 7pt)
    const CHARS_PER_LINE = 95;
    return Math.max(1, Math.ceil(txt.length / CHARS_PER_LINE));
};

// helper: compute dynamic top offset for the tableArea
const computeTableOffset = (filterText) => {
    // measured/empirical constants for your header sizes (react-pdf):
    const BASE_BLOCK = 48;   // title + subtitle + infoRow + divider
    const TABLE_HEADER = 20; // the column header row ("S.No.", "Employee", etc)
    const FILTER_LINE_HEIGHT = 10; // per line of filtersLine
    const SAFETY_GAP = 6;    // breathing space between header & first data row

    const filterLines = estimateFilterLines(filterText);
    return BASE_BLOCK + TABLE_HEADER + (filterLines * FILTER_LINE_HEIGHT) + SAFETY_GAP;
};
/* ---------- Body row ---------- */
const Row = ({ i, emp }) => {
    const employeeLabel = `${safe(emp.employee_name, '')}${emp.employee_code ? ` (${emp.employee_code})` : ''}`;
    const shiftTime = emp.shift_from_time && emp.shift_to_time
        ? `${emp.shift_from_time} - ${emp.shift_to_time}` : '—';
    const statusWithNote = `${safe(emp.status, '—')}${statusSuffix(emp)}`;

    const workDur = (emp.shift_working_hours);
    const totDur = (emp.attandance_hours);
    const otDur = (emp.overtime_hours);
    const lateBy = (emp.late_hours);
    const early = emp.early_going_by ? (emp.early_going_by) : '—';
    const chips = buildPunchChips(emp);
    const isFirst = i === 0;

    return (
        <View style={[styles.row, isFirst && { marginTop: 6 }]} wrap={false}>
            <Text style={[styles.td, styles.center, styles.wSno]}>{emp.sno || i + 1}</Text>

            {/* Keep on one line to stop tall first rows */}
            <Text style={[styles.td, styles.left, styles.wEmp]} wrap={false}>
                {employeeLabel || '—'}
            </Text>

            <Text style={[styles.td, styles.left, styles.wShift]}>{safe(emp.shift_name, '—')}</Text>
            <Text style={[styles.td, styles.center, styles.wShiftTime]}>{shiftTime}</Text>
            <Text style={[styles.td, styles.center, styles.wCin]}>{fmtTime(emp.attandance_first_clock_in) || '—'}</Text>
            <Text style={[styles.td, styles.center, styles.wCout]}>{fmtTime(emp.attandance_last_clock_out) || '—'}</Text>
            <Text style={[styles.td, styles.right, styles.wWork]}>{workDur}</Text>
            <Text style={[styles.td, styles.right, styles.wTot]}>{totDur}</Text>
            <Text style={[styles.td, styles.right, styles.wLate]}>{lateBy}</Text>
            <Text style={[styles.td, styles.right, styles.wOT]}>{otDur}</Text>
            <Text style={[styles.td, styles.right, styles.wEarly]}>{early}</Text>
            <Text style={[styles.td, styles.center, styles.wStatus, styles.statusTight, statusStyle(emp.status)]}>
                {statusWithNote}
            </Text>

            {/* Punch Records — condensed chips */}
            <View style={[styles.td, styles.wPunch]}>
                {chips.length === 0 ? (
                    <Text style={{ fontSize: 7, color: '#333', lineHeight: 1.08 }}>—</Text>
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

/* ---------- Document ---------- */
const DetailedDailyDocument = ({ rows, reportDate, companyName, filterLabels }) => {
    const fl = Object.entries(filterLabels || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`)
        .join('  |  ');

    const tableTop = computeTableOffset(fl); // ← dynamic marginTop

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View fixed style={styles.headerWrap}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Detailed Daily Attendance</Text>
                        <Text style={styles.subtitle}>Attendance Date: {formatDateHuman(reportDate)}</Text>
                        <View style={styles.infoRow}>
                            <Text>Company: {companyName || '—'}</Text>
                            <Text>Printed On: {formatPrintedOn(new Date())}</Text>
                        </View>
                        {fl ? <Text style={styles.filtersLine}>{fl}</Text> : null}
                    </View>
                    <TableHeader />
                </View>

                {/* apply dynamic top margin here */}
                <View style={[styles.tableArea, { marginTop: tableTop }]}>
                    {rows.map((r, idx) => (
                        <Row key={r.employee_id || r.employee_code || idx} i={idx} emp={r} />
                    ))}
                </View>

                <View fixed style={styles.footer}>
                    <Text>Generated: {formatDateHuman(new Date())}</Text>
                    <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
                </View>
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

    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const fn = `${fileName}.pdf`;
    saveAs(blob, fn);

    return { success: true, fileName: fn, recordCount: dataWithSno.length };
};
