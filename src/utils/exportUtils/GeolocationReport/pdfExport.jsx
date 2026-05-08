// utils/exportUtils/GeolocationReport/pdfExport.js
import { Document, Page, Text, View, StyleSheet, pdf, Link } from '@react-pdf/renderer';

// Create styles for PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontSize: 8,
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000000',
    },
    dateText: {
        fontSize: 10,
        color: '#000000',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 5,
    },
    filtersSection: {
        marginTop: 10,
        marginBottom: 10,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    filtersTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 5,
    },
    filtersText: {
        fontSize: 9,
        color: '#000000',
        lineHeight: 1.4,
    },
    table: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000000',
        fontSize: 7,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    tableCell: {
        borderRightWidth: 1,
        borderRightColor: '#000000',
        padding: 4,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableColSno: {
        width: '4%',
    },
    tableColCode: {
        width: '8%',
    },
    tableColName: {
        width: '10%',
    },
    tableColShift: {
        width: '10%',
    },
    tableColPunchNo: {
        width: '6%',
    },
    tableColDevice: {
        width: '9%',
    },
    tableColTime: {
        width: '9%',
    },
    tableColLocation: {
        width: '8%',
    },
    tableColStatus: {
        width: '8%',
    },
    tableColHours: {
        width: '7%',
    },
    tableColTotalHours: {
        width: '8%',
    },
    locationText: {
        fontSize: 6,
        color: '#0066cc',
        textDecoration: 'underline',
    },
    deviceText: {
        fontSize: 7,
        color: '#000000',
    },
    employeeGroupRow: {
        backgroundColor: '#f8f9fa',
        fontWeight: 'bold',
    },
    punchEntryRow: {
        backgroundColor: '#ffffff',
    },
    centeredText: {
        textAlign: 'center',
    },
    statusText: {
        fontSize: 7,
        fontWeight: 'bold',
    },
    presentText: {
        color: '#008000',
    },
    absentText: {
        color: '#ff0000',
    },
    incompleteText: {
        color: '#ff8c00',
    },
    weekoffText: {
        color: '#800080',
    },
    footer: {
        position: 'absolute',
        fontSize: 8,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#000000',
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 8,
        bottom: 15,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#000000',
    }
});

// PDF Document Component
const GeolocationPDFDocument = ({ data, selectedDate, companyName = 'Your Company Name', appliedFilters = {}, filterLabels = {} }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

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
        const coordMatch = mapLink.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
            return {
                text: "View",
                link: mapLink
            };
        }
        return { text: "View", link: mapLink };
    };

    const getStatusStyle = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'present':
                return [styles.statusText, styles.presentText];
            case 'absent':
                return [styles.statusText, styles.absentText];
            case 'incomplete':
                return [styles.statusText, styles.incompleteText];
            case 'week off':
            case 'weekoff':
                return [styles.statusText, styles.weekoffText];
            default:
                return [styles.statusText];
        }
    };

    // Check if any filters are applied
    const hasAppliedFilters = appliedFilters && Object.values(appliedFilters).some(value => value !== '' && value !== null && value !== undefined);

    // Format applied filters for display
    const formatAppliedFilters = () => {
        if (!hasAppliedFilters) return '';

        const activeFilters = [];

        if (appliedFilters.attendance_status_id && filterLabels.attendance_status) {
            activeFilters.push(`Status: ${filterLabels.attendance_status}`);
        }
        if (appliedFilters.branch_id && filterLabels.branch) {
            activeFilters.push(`Branch: ${filterLabels.branch}`);
        }
        if (appliedFilters.department_id && filterLabels.department) {
            activeFilters.push(`Department: ${filterLabels.department}`);
        }
        if (appliedFilters.designation_id && filterLabels.designation) {
            activeFilters.push(`Designation: ${filterLabels.designation}`);
        }
        if (appliedFilters.shift_id && filterLabels.shift) {
            activeFilters.push(`Shift: ${filterLabels.shift}`);
        }

        return activeFilters.join(' | ');
    };

    // Process data to show each punch in/out as separate rows with employee grouping
    const processedData = [];
    let serialNumber = 1;

    data.forEach((employee, empIndex) => {
        // Process attendance_history into pairs
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

        // Add employee header row with basic info
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

        // Add each punch pair as separate rows
        if (pairs.length > 0) {
            pairs.forEach((entry, entryIndex) => {
                processedData.push({
                    type: 'punch_entry',
                    serialNumber: '', // Empty for punch entries
                    employee_code: '', // Empty for punch entries
                    employee_name: '', // Empty for punch entries
                    shift_name: '', // Empty for punch entries
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
            // If no punch records, add a single empty punch entry
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

    // Split data into chunks for pagination (15 rows per page to accommodate more details)
    const chunkSize = hasAppliedFilters ? 13 : 15;
    const dataChunks = [];
    for (let i = 0; i < processedData.length; i += chunkSize) {
        dataChunks.push(processedData.slice(i, i + chunkSize));
    }

    return (
        <Document>
            {dataChunks.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <Text style={styles.companyName}>{companyName}</Text>
                            <Text style={styles.dateText}>Date: {formatDate(selectedDate)}</Text>
                        </View>
                        <Text style={styles.title}>Geolocation Attendance Report - Multiple Punch Records</Text>

                        {/* Applied Filters Section - Only show if filters are applied */}
                        {hasAppliedFilters && (
                            <View style={styles.filtersSection}>
                                <Text style={styles.filtersTitle}>Applied Filters:</Text>
                                <Text style={styles.filtersText}>{formatAppliedFilters()}</Text>
                            </View>
                        )}
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <View style={[styles.tableCell, styles.tableColSno]}>
                                <Text>S.No</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColCode]}>
                                <Text>Emp Code</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColName]}>
                                <Text>Name</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColShift]}>
                                <Text>Shift</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColPunchNo]}>
                                <Text>Punch#</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColTime]}>
                                <Text>Check-in</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColDevice]}>
                                <Text>In Device</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColLocation]}>
                                <Text>In Location</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColTime]}>
                                <Text>Check-out</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColDevice]}>
                                <Text>Out Device</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColLocation]}>
                                <Text>Out Location</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColStatus]}>
                                <Text>Status</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColTotalHours, { borderRightWidth: 0 }]}>
                                <Text>Total Hours</Text>
                            </View>
                        </View>

                        {/* Table Rows */}
                        {chunk.map((row, index) => (
                            <View
                                style={[
                                    styles.tableRow,
                                    row.type === 'employee_header' ? styles.employeeGroupRow : styles.punchEntryRow
                                ]}
                                key={`${row.type}-${index}`}
                            >
                                <View style={[styles.tableCell, styles.tableColSno]}>
                                    <Text>{row.serialNumber}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColCode]}>
                                    <Text>{row.employee_code || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColName]}>
                                    <Text>{row.employee_name || ''}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColShift]}>
                                    <Text>
                                        {row.shift_name || ''}
                                        {row.shift_from_time && row.shift_to_time &&
                                            `\n${row.shift_from_time}-${row.shift_to_time}`}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColPunchNo]}>
                                    <Text>
                                        {row.type === 'employee_header'
                                            ? (row.total_punches > 0 ? `${row.total_punches} punches` : 'No punches')
                                            : row.punch_number
                                        }
                                    </Text>
                                </View>

                                {row.type === 'employee_header' ? (
                                    // Employee header row - show summary info (no dashes for multiple punches)
                                    <>
                                        <View style={[styles.tableCell, styles.tableColTime]}>
                                            <Text></Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColDevice]}>
                                            <Text></Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColLocation]}>
                                            <Text></Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColTime]}>
                                            <Text></Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColDevice]}>
                                            <Text></Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColLocation]}>
                                            <Text></Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColStatus]}>
                                            <Text style={getStatusStyle(row.status)}>
                                                {row.status || '--'}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColTotalHours, { borderRightWidth: 0 }]}>
                                            <Text>{row.attandance_hours || '--'}</Text>
                                        </View>
                                    </>
                                ) : (
                                    // Punch entry row - show punch details (no status/total hours for individual punches)
                                    <>
                                        <View style={[styles.tableCell, styles.tableColTime]}>
                                            <Text>{formatTime(row.clock_in)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColDevice]}>
                                            <Text style={styles.deviceText}>
                                                {getDeviceTypeName(row.clock_in_type, row.clock_in_type_name)}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColLocation]}>
                                            {(() => {
                                                const locationInfo = formatLocationForPrint(row.clock_in_map_link);
                                                return locationInfo.link ? (
                                                    <Link src={locationInfo.link} style={styles.locationText}>
                                                        {locationInfo.text}
                                                    </Link>
                                                ) : (
                                                    <Text>{locationInfo.text}</Text>
                                                );
                                            })()}
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColTime]}>
                                            <Text>{formatTime(row.clock_out)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColDevice]}>
                                            <Text style={styles.deviceText}>
                                                {getDeviceTypeName(row.clock_out_type, row.clock_out_type_name)}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColLocation]}>
                                            {(() => {
                                                const locationInfo = formatLocationForPrint(row.clock_out_map_link);
                                                return locationInfo.link ? (
                                                    <Link src={locationInfo.link} style={styles.locationText}>
                                                        {locationInfo.text}
                                                    </Link>
                                                ) : (
                                                    <Text>{locationInfo.text}</Text>
                                                );
                                            })()}
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColStatus]}>
                                            <Text></Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableColTotalHours, { borderRightWidth: 0 }]}>
                                            <Text></Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Page Number */}
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) =>
                        `Page ${pageNumber} of ${totalPages}`
                    } fixed />
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

        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_multiple_punches_${new Date(selectedDate).toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, message: 'PDF exported successfully!' };
    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error(`Failed to export PDF: ${error.message}`);
    }
};