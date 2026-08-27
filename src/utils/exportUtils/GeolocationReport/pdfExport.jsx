import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import {
    commonPdfStyles as styles,
    PDF_COLORS,
    formatAsHeaderDate,
    PDFHeaderBanner,
    PDFFiltersSection,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

const geoStyles = StyleSheet.create({
    locationText: {
        fontSize: 6,
        color: '#4c1d95',
        textDecoration: 'underline',
        textAlign: 'center',
    },
    deviceText: {
        fontSize: 6.5,
        color: PDF_COLORS.textDark,
        textAlign: 'center',
    },
    employeeGroupRow: {
        backgroundColor: PDF_COLORS.purpleLight,
        fontWeight: 'bold',
    }
});

// PDF Document Component
const GeolocationPDFDocument = ({ data, selectedDate, companyName = 'Your Company Name', appliedFilters = {}, filterLabels = {} }) => {
    const formatDate = (date) => formatAsHeaderDate(date);

    const formatTime = (time) => {
        if (!time || time === '--') return '--';
        return time;
    };

    const getDeviceTypeName = (type, typeName) => {
        if (typeName) return typeName;
        switch (type) {
            case 1:
                return "Web Browser";
            case 2:
                return "Desktop App";
            case 3:
                return "Mobile Device";
            default:
                return "Unknown";
        }
    };

    const formatLocationForPrint = (mapLink) => {
        if (!mapLink || mapLink === "https://www.google.com/maps?q=,") {
            return { text: "--", link: null };
        }
        return { text: "View", link: mapLink };
    };

    const getActiveFiltersList = () => {
        const hasAppliedFilters = appliedFilters && Object.values(appliedFilters).some(v => v !== '' && v !== null && v !== undefined);
        if (!hasAppliedFilters) return [];
        const active = [];
        if (appliedFilters.attendance_status_id && filterLabels.attendance_status) active.push(`Status: ${filterLabels.attendance_status}`);
        if (appliedFilters.branch_id && filterLabels.branch) active.push(`Branch: ${filterLabels.branch}`);
        if (appliedFilters.department_id && filterLabels.department) active.push(`Department: ${filterLabels.department}`);
        if (appliedFilters.designation_id && filterLabels.designation) active.push(`Designation: ${filterLabels.designation}`);
        if (appliedFilters.shift_id && filterLabels.shift) active.push(`Shift: ${filterLabels.shift}`);
        return active;
    };

    const activeFiltersList = getActiveFiltersList();

    // Process data to show each punch in/out as separate rows with employee grouping
    const processedData = [];
    let serialNumber = 1;

    (data || []).forEach((employee) => {
        const pairs = [];
        if (Array.isArray(employee.attendance_history) && employee.attendance_history.length > 0) {
            for (let i = 0; i < employee.attendance_history.length; i += 2) {
                const clockIn = employee.attendance_history[i];
                const clockOut = employee.attendance_history[i + 1];

                pairs.push({
                    clock_in: clockIn?.clock_date_time || '--',
                    clock_out: clockOut?.clock_date_time || '--',
                    clock_in_type: clockIn?.clock_type,
                    clock_in_type_name: clockIn?.clock_type_name,
                    clock_out_type: clockOut?.clock_type,
                    clock_out_type_name: clockOut?.clock_type_name,
                    clock_in_map_link: clockIn?.map_link,
                    clock_out_map_link: clockOut?.map_link,
                    clock_in_face_img: clockIn?.face_img,
                    clock_out_face_img: clockOut?.face_img
                });
            }
        }

        processedData.push({
            type: 'employee_header',
            serialNumber: serialNumber++,
            employee_code: employee.employee_code,
            employee_name: employee.employee_name,
            shift_name: employee.shift_name,
            shift_from_time: employee.shift_from_time,
            shift_to_time: employee.shift_to_time,
            status: employee.status,
            attandance_hours: employee.attandance_hours,
            shift_working_hours: employee.shift_working_hours,
            total_punches: pairs.length
        });

        if (pairs.length > 0) {
            pairs.forEach((entry, entryIndex) => {
                processedData.push({
                    type: 'punch_entry',
                    serialNumber: '',
                    employee_code: '',
                    employee_name: '',
                    shift_name: '',
                    punch_number: entryIndex + 1,
                    clock_in: entry.clock_in,
                    clock_out: entry.clock_out,
                    clock_in_type: entry.clock_in_type,
                    clock_in_type_name: entry.clock_in_type_name,
                    clock_out_type: entry.clock_out_type,
                    clock_out_type_name: entry.clock_out_type_name,
                    clock_in_map_link: entry.clock_in_map_link,
                    clock_out_map_link: entry.clock_out_map_link,
                    clock_in_face_img: entry.clock_in_face_img,
                    clock_out_face_img: entry.clock_out_face_img
                });
            });
        } else {
            processedData.push({
                type: 'punch_entry',
                serialNumber: '',
                employee_code: '',
                employee_name: '',
                shift_name: '',
                punch_number: '--',
                clock_in: '--',
                clock_out: '--',
                clock_in_type: null,
                clock_in_type_name: '',
                clock_out_type: null,
                clock_out_type_name: '',
                clock_in_map_link: '',
                clock_out_map_link: '',
                clock_in_face_img: '',
                clock_out_face_img: ''
            });
        }
    });

    const chunkSize = activeFiltersList.length > 0 ? 13 : 15;
    const dataChunks = [];
    for (let i = 0; i < processedData.length; i += chunkSize) {
        dataChunks.push(processedData.slice(i, i + chunkSize));
    }
    if (!dataChunks.length) dataChunks.push([]);

    return (
        <Document>
            {dataChunks.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <PDFHeaderBanner
                        title="GEOLOCATION ATTENDANCE REPORT"
                        companyName={companyName}
                        dateRangeText={`Date: ${formatDate(selectedDate)}`}
                    />

                    <View style={styles.content}>
                        {pageIndex === 0 && activeFiltersList.length > 0 && (
                            <PDFFiltersSection appliedFilters={activeFiltersList} />
                        )}

                        {/* Table */}
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                <View style={[styles.tableCol, { width: '4%' }]}><Text style={styles.th}>S.No</Text></View>
                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.th}>Emp Code</Text></View>
                                <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.th}>Name</Text></View>
                                <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.th}>Shift</Text></View>
                                <View style={[styles.tableCol, { width: '6%' }]}><Text style={styles.th}>Punch#</Text></View>
                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.th}>Check-in</Text></View>
                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.th}>In Device</Text></View>
                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.th}>In Location</Text></View>
                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.th}>Check-out</Text></View>
                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.th}>Out Device</Text></View>
                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.th}>Out Location</Text></View>
                                <View style={[styles.tableCol, { width: '5%' }]}><Text style={styles.th}>Status</Text></View>
                                <View style={[styles.tableCol, { width: '5%', borderRightWidth: 0 }]}><Text style={styles.th}>Total Hrs</Text></View>
                            </View>

                            {/* Table Rows */}
                            {chunk.map((row, index) => {
                                const isHeaderRow = row.type === 'employee_header';
                                const isAbsent = (row.status || '').toLowerCase().includes('absent');

                                return (
                                    <View
                                        style={[
                                            styles.tableRow,
                                            isHeaderRow ? geoStyles.employeeGroupRow : (index % 2 === 1 && styles.zebra)
                                        ]}
                                        key={`${row.type}-${index}`}
                                    >
                                        <View style={[styles.tableCol, { width: '4%' }]}>
                                            <Text style={styles.tdCenter}>{row.serialNumber}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '8%' }]}>
                                            <Text style={styles.tdCenter}>{row.employee_code || ''}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '10%' }]}>
                                            <Text style={styles.empNameText}>{row.employee_name || ''}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '10%' }]}>
                                            <Text style={styles.tdCenter}>
                                                {row.shift_name || ''}
                                                {row.shift_from_time && row.shift_to_time && `\n${row.shift_from_time}-${row.shift_to_time}`}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '6%' }]}>
                                            <Text style={styles.tdCenter}>
                                                {isHeaderRow
                                                    ? (row.total_punches > 0 ? `${row.total_punches} punches` : 'No punches')
                                                    : row.punch_number
                                                }
                                            </Text>
                                        </View>

                                        {isHeaderRow ? (
                                            <>
                                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.tdCenter}></Text></View>
                                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.tdCenter}></Text></View>
                                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.tdCenter}></Text></View>
                                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.tdCenter}></Text></View>
                                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.tdCenter}></Text></View>
                                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.tdCenter}></Text></View>
                                                <View style={[styles.tableCol, { width: '5%' }]}>
                                                    <Text style={[styles.tdCenter, isAbsent ? styles.inactiveStatus : styles.activeStatus]}>
                                                        {row.status || '--'}
                                                    </Text>
                                                </View>
                                                <View style={[styles.tableCol, { width: '5%', borderRightWidth: 0 }]}>
                                                    <Text style={styles.tdCenter}>{row.attandance_hours || '--'}</Text>
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <View style={[styles.tableCol, { width: '9%' }]}>
                                                    <Text style={styles.tdCenter}>{formatTime(row.clock_in)}</Text>
                                                </View>
                                                <View style={[styles.tableCol, { width: '9%' }]}>
                                                    <Text style={geoStyles.deviceText}>
                                                        {getDeviceTypeName(row.clock_in_type, row.clock_in_type_name)}
                                                    </Text>
                                                </View>
                                                <View style={[styles.tableCol, { width: '8%' }]}>
                                                    {(() => {
                                                        const locationInfo = formatLocationForPrint(row.clock_in_map_link);
                                                        return locationInfo.link ? (
                                                            <Link src={locationInfo.link} style={geoStyles.locationText}>
                                                                {locationInfo.text}
                                                            </Link>
                                                        ) : (
                                                            <Text style={styles.tdCenter}>{locationInfo.text}</Text>
                                                        );
                                                    })()}
                                                </View>
                                                <View style={[styles.tableCol, { width: '9%' }]}>
                                                    <Text style={styles.tdCenter}>{formatTime(row.clock_out)}</Text>
                                                </View>
                                                <View style={[styles.tableCol, { width: '9%' }]}>
                                                    <Text style={geoStyles.deviceText}>
                                                        {getDeviceTypeName(row.clock_out_type, row.clock_out_type_name)}
                                                    </Text>
                                                </View>
                                                <View style={[styles.tableCol, { width: '8%' }]}>
                                                    {(() => {
                                                        const locationInfo = formatLocationForPrint(row.clock_out_map_link);
                                                        return locationInfo.link ? (
                                                            <Link src={locationInfo.link} style={geoStyles.locationText}>
                                                                {locationInfo.text}
                                                            </Link>
                                                        ) : (
                                                            <Text style={styles.tdCenter}>{locationInfo.text}</Text>
                                                        );
                                                    })()}
                                                </View>
                                                <View style={[styles.tableCol, { width: '5%' }]}>
                                                    <Text style={styles.tdCenter}></Text>
                                                </View>
                                                <View style={[styles.tableCol, { width: '5%', borderRightWidth: 0 }]}>
                                                    <Text style={styles.tdCenter}></Text>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <PDFFooter totalCount={data.length} itemLabel="Employees" />
                </Page>
            ))}
        </Document>
    );
};

// Export function
export const exportToPDF = async (data, selectedDate, companyName = 'Your Company Name', filename = 'geolocation_attendance_report', appliedFilters = {}, filterLabels = {}) => {
    try {
        if (!data || data.length === 0) {
            throw new Error('No data available to export');
        }

        const doc = <GeolocationPDFDocument
            data={data}
            selectedDate={selectedDate}
            companyName={companyName}
            appliedFilters={appliedFilters}
            filterLabels={filterLabels}
        />;

        const dateStr = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : 'report';
        await downloadPdfDocument(doc, `${filename}_multiple_punches_${dateStr}.pdf`);

        return { success: true, message: 'PDF exported successfully!' };
    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error(`Failed to export PDF: ${error.message}`);
    }
};