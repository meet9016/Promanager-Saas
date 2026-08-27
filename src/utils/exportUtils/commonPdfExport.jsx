import React from 'react';
import { Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';

// Register Helvetica font for PDF generation
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2', fontWeight: 'normal' },
        { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2', fontWeight: 'bold' }
    ]
});

/** --------- PAGE + LAYOUT CONSTANTS (A4 landscape ≈ 842 x 595pt) ---------- */
export const PDF_LAYOUT = {
    PAGE_W: 842,
    PAGE_H: 595,
    PAGE_PADDING: 20,
    INNER_H: 595 - 40, // PAGE_H - PAGE_PADDING * 2
    HEADER_H: 78,      // executive header banner height
    FILTERS_H: 48,     // applied filters section height
    TABLE_HDR_H: 20,   // table header row height
    ROW_H: 22,         // standard data row height
    FOOTER_H: 28,      // footer block height
    CONTENT_BOTTOM_SAFE: 8,
};

/** --------- BRAND COLOR PALETTE ---------- */
export const PDF_COLORS = {
    primaryDarker: '#2e1065',
    primaryDark: '#3b0764',
    primaryHeader: '#4c1d95',
    purpleLight: '#f3e8ff',
    purpleBorder: '#d8b4fe',
    purpleBorderDark: '#a855f7',
    purpleText: '#581c87',
    textDark: '#0f172a',
    textMuted: '#475569',
    white: '#ffffff',
    zebraBg: '#faf5ff',
    activeGreen: '#15803d',
    inactiveRed: '#b91c1c',
};

/** --------- COMMON STYLESHEET ---------- */
export const commonPdfStyles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 8,
        padding: PDF_LAYOUT.PAGE_PADDING,
        backgroundColor: '#ffffff',
        color: PDF_COLORS.textDark
    },

    // Executive Brand Header Banner
    headerBanner: {
        backgroundColor: PDF_COLORS.primaryDark,
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: PDF_COLORS.white,
        letterSpacing: 0.5
    },
    companyNameText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#f3e8ff',
    },
    headerBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255, 255, 255, 0.25)',
        paddingTop: 4,
        marginTop: 2
    },
    reportDateRange: {
        fontSize: 8,
        color: '#e9d5ff'
    },
    printedOnInfo: {
        fontSize: 8,
        color: '#e9d5ff',
        textAlign: 'right'
    },

    // Main Content container
    content: {
        marginBottom: PDF_LAYOUT.FOOTER_H + PDF_LAYOUT.CONTENT_BOTTOM_SAFE
    },

    // Applied Filters Card
    filtersSection: {
        marginBottom: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: PDF_COLORS.purpleLight,
        borderRadius: 4,
        borderWidth: 0.8,
        borderColor: PDF_COLORS.purpleBorder,
    },
    filtersTitle: {
        fontSize: 8.5,
        fontWeight: 'bold',
        color: PDF_COLORS.purpleText,
        marginBottom: 2
    },
    filtersText: {
        fontSize: 7.5,
        color: '#4c1d95',
        lineHeight: 1.3
    },

    // Table
    table: {
        display: 'table',
        width: '100%',
        borderRadius: 4,
        borderWidth: 0.8,
        borderColor: PDF_COLORS.primaryDark,
        overflow: 'hidden'
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: PDF_COLORS.primaryDark,
        minHeight: PDF_LAYOUT.TABLE_HDR_H,
        alignItems: 'center'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: PDF_COLORS.purpleBorder,
        minHeight: PDF_LAYOUT.ROW_H,
        alignItems: 'center'
    },
    zebra: {
        backgroundColor: PDF_COLORS.zebraBg
    },
    tableCol: {
        borderRightWidth: 0.5,
        borderRightColor: PDF_COLORS.purpleBorder,
        paddingVertical: 2,
        paddingHorizontal: 4,
        justifyContent: 'center'
    },

    th: {
        fontSize: 8,
        fontWeight: 'bold',
        color: PDF_COLORS.white,
        textAlign: 'center'
    },
    tdCenter: {
        fontSize: 7,
        textAlign: 'center',
        color: PDF_COLORS.textDark,
        lineHeight: 1.2
    },
    tdLeft: {
        fontSize: 7,
        textAlign: 'left',
        color: PDF_COLORS.textDark,
        lineHeight: 1.2
    },
    empNameText: {
        fontSize: 7,
        fontWeight: 'bold',
        color: PDF_COLORS.primaryDark
    },
    genderText: {
        fontSize: 5.8,
        color: PDF_COLORS.textMuted
    },
    contactInfo: {
        fontSize: 6.2,
        lineHeight: 1.1,
        textAlign: 'center',
        color: PDF_COLORS.textDark
    },
    exitInfo: {
        fontSize: 6.5,
        lineHeight: 1.2,
        textAlign: 'left',
        color: '#475569'
    },
    activeStatus: {
        color: PDF_COLORS.activeGreen,
        fontWeight: 'bold'
    },
    inactiveStatus: {
        color: PDF_COLORS.inactiveRed,
        fontWeight: 'bold'
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: PDF_LAYOUT.PAGE_PADDING,
        left: PDF_LAYOUT.PAGE_PADDING,
        right: PDF_LAYOUT.PAGE_PADDING,
        textAlign: 'center',
        fontSize: 7,
        color: PDF_COLORS.purpleText,
        borderTopWidth: 0.8,
        borderTopColor: PDF_COLORS.purpleBorder,
        paddingTop: 5
    }
});

/** ---------- HELPER FUNCTIONS ---------- */
export const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

export const formatAsHeaderDate = (d) => {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return String(d);
    const y = dt.getFullYear();
    const m = dt.toLocaleString('en-US', { month: 'short' });
    const day = pad2(dt.getDate());
    return `${m} ${day} ${y}`;
};

export const formatPrintedOn = (dt = new Date()) => {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    const y = d.getFullYear();
    const m = d.toLocaleString('en-US', { month: 'short' });
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${m} ${day} ${y} ${hh}:${mm}`;
};

export const formatDateCell = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return '--';
    try {
        const dt = new Date(dateString);
        if (isNaN(dt.getTime())) return '--';
        return dt.toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: '2-digit'
        });
    } catch { return '--'; }
};

export const currentDateGB = () =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const buildCenteredRange = (filters) => {
    const start = filters?.start_date || filters?.from_date || filters?.join_start_date;
    const end = filters?.end_date || filters?.to_date || filters?.join_end_date;
    if (start && end) return `${formatAsHeaderDate(start)}  To  ${formatAsHeaderDate(end)}`;
    return `As on ${formatAsHeaderDate(new Date())}`;
};

export const getAppliedFilters = (filters = {}) => {
    const f = [];
    if (filters.branch_name && filters.branch_name !== 'All Branches') f.push(`Branch: ${filters.branch_name}`);
    if (filters.department_name && filters.department_name !== 'All Departments') f.push(`Department: ${filters.department_name}`);
    if (filters.designation_name && filters.designation_name !== 'All Designations') f.push(`Designation: ${filters.designation_name}`);
    if (filters.employee_type_name && filters.employee_type_name !== 'All Employee Types') f.push(`Employee Type: ${filters.employee_type_name}`);
    if (filters.salary_type_name && filters.salary_type_name !== 'All Salary Types') f.push(`Salary Type: ${filters.salary_type_name}`);
    if (filters.gender_name && filters.gender_name !== 'All Genders') f.push(`Gender: ${filters.gender_name}`);
    if (filters.status_name && filters.status_name !== 'All Status') f.push(`Status: ${filters.status_name}`);
    if (filters.search && String(filters.search).trim() !== '') f.push(`Search: ${filters.search}`);
    return f;
};

export const rowsPerPage = (hasFilters, customRowH = PDF_LAYOUT.ROW_H, customHeaderH = PDF_LAYOUT.HEADER_H) => {
    const head = customHeaderH + (hasFilters ? PDF_LAYOUT.FILTERS_H : 0);
    const usable = PDF_LAYOUT.INNER_H - head - PDF_LAYOUT.FOOTER_H - PDF_LAYOUT.CONTENT_BOTTOM_SAFE;
    const roomForRows = usable - PDF_LAYOUT.TABLE_HDR_H;
    return Math.max(1, Math.floor(roomForRows / customRowH));
};

export const paginate = (rows, hasFilters, customRowH = PDF_LAYOUT.ROW_H, customHeaderH = PDF_LAYOUT.HEADER_H) => {
    const first = rowsPerPage(hasFilters, customRowH, customHeaderH);
    const next = rowsPerPage(false, customRowH, customHeaderH);
    const pages = [];

    if (!rows || rows.length <= first) {
        pages.push(rows || []);
        return pages;
    }
    pages.push(rows.slice(0, first));
    let cursor = first;
    while (cursor < rows.length) {
        pages.push(rows.slice(cursor, cursor + next));
        cursor += next;
    }
    return pages;
};

/** ---------- REUSABLE PDF COMPONENTS ---------- */
export const PDFHeaderBanner = ({ title, companyName = 'Your Company', dateRangeText }) => (
    <View style={commonPdfStyles.headerBanner}>
        <View style={commonPdfStyles.headerTopRow}>
            <Text style={commonPdfStyles.reportTitle}>{title}</Text>
            <Text style={commonPdfStyles.companyNameText}>{companyName}</Text>
        </View>
        <View style={commonPdfStyles.headerBottomRow}>
            <Text style={commonPdfStyles.reportDateRange}>{dateRangeText || `As on ${formatAsHeaderDate(new Date())}`}</Text>
            <Text style={commonPdfStyles.printedOnInfo}>Printed On: {formatPrintedOn()}</Text>
        </View>
    </View>
);

export const PDFFiltersSection = ({ appliedFilters = [] }) => {
    if (!appliedFilters || appliedFilters.length === 0) return null;
    return (
        <View style={commonPdfStyles.filtersSection}>
            <Text style={commonPdfStyles.filtersTitle}>Applied Filters:</Text>
            <Text style={commonPdfStyles.filtersText}>{appliedFilters.join('  |  ')}</Text>
        </View>
    );
};

export const PDFFooter = ({ totalCount = 0, itemLabel = 'Items' }) => (
    <Text
        style={commonPdfStyles.footer}
        render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}  |  Total ${itemLabel}: ${totalCount}  |  Generated on ${currentDateGB()}`
        }
        fixed
    />
);

/** ---------- DOWNLOAD UTILITY ---------- */
export const downloadPdfDocument = async (doc, filename = 'Report.pdf') => {
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
};
