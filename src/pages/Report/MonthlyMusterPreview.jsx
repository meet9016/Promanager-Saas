// src/pages/Reports/MonthlyMusterPreview.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    ArrowLeft, Calendar, Users, Building, Award, User,
    Filter, RefreshCw, HelpCircle, Download,
    ChevronDown, FileDown, FileSpreadsheet, Play
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Toast } from '../../Components/ui/Toast';

// Exporters
import { exportMusterToPDF } from '../../utils/exportUtils/MonthlyMuster/pdfExport';
import { exportMusterToExcel } from '../../utils/exportUtils/MonthlyMuster/excelExport';

/** ------------------- Anchored positioning helpers ------------------- **/
const getScrollParents = (node) => {
    const parents = [];
    if (!node) return parents;
    let parent = node.parentNode;
    const scrollRegex = /(auto|scroll|overlay)/;
    while (parent && parent.nodeType === 1) {
        const style = window.getComputedStyle(parent);
        const overflow = `${style.overflow}${style.overflowY}${style.overflowX}`;
        if (scrollRegex.test(overflow)) parents.push(parent);
        parent = parent.parentNode;
    }
    parents.push(window);
    return parents;
};

const useAnchoredPosition = (anchorRef, isOpen, opts = {}) => {
    const { placement = 'bottom-end', offset = 10, minWidth = 192 } = opts;
    const [pos, setPos] = useState({ top: -9999, left: -9999, width: 0, ready: false });
    const cleanupRef = useRef([]);

    const compute = useCallback(() => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        let top = rect.bottom + scrollY + offset;
        let left;

        if (placement === 'bottom-start') {
            left = rect.left + scrollX;
        } else if (placement === 'bottom-center') {
            left = rect.left + scrollX + rect.width / 2 - minWidth / 2;
        } else {
            // bottom-end
            left = rect.left + scrollX + rect.width - minWidth;
        }

        setPos({ top, left, width: rect.width, ready: true });
    }, [anchorRef, offset, placement, minWidth]);

    useLayoutEffect(() => {
        if (!isOpen) {
            cleanupRef.current.forEach((fn) => fn && fn());
            cleanupRef.current = [];
            setPos((p) => ({ ...p, ready: false }));
            return;
        }

        compute();

        const parents = getScrollParents(anchorRef.current);
        const rafThrottle = (fn) => {
            let ticking = false;
            return () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    fn();
                    ticking = false;
                });
            };
        };
        const handler = rafThrottle(() => compute());

        parents.forEach((p) => p.addEventListener('scroll', handler, { passive: true }));
        window.addEventListener('resize', handler, { passive: true });

        const remove = () => {
            parents.forEach((p) => p.removeEventListener('scroll', handler));
            window.removeEventListener('resize', handler);
        };
        cleanupRef.current.push(remove);

        return () => {
            remove();
            cleanupRef.current = [];
        };
    }, [isOpen, compute, anchorRef]);

    return pos;
};
/** -------------------------------------------------------------------- **/

/* ------------ utils ------------ */
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

/* Parse "YYYY-MM-DD" as LOCAL date to avoid off-by-one */
const localDateFromYmd = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const getDaysInMonth = (yyyyMm) => {
    if (!yyyyMm) return 31;
    const [y, m] = yyyyMm.split('-').map(Number);
    return new Date(y, m, 0).getDate();
};

const CODE_LABELS = {
    P: 'Present',
    A: 'Absent',
    WO: 'Week Off',
    '½P': 'Half Present',
    H: 'Holiday',
    INC: 'Incomplete',
    OT: 'Overtime',
};

const CELL_DISPLAY_CODES = {
    P: 'P',
    A: 'A',
    L: 'L',
    WO: 'WO',
    '½P': '½P',
    H: 'H',
    INC: 'INC',
    OT: 'OT'
};

/* Legend order must stay fixed */
const TOTALS_ORDER = ['P', 'A', 'WO', '½P', 'H', 'INC', 'OT'];

/* Enhanced status colors matching the design */
const CODE_COLORS = {
    P: 'bg-[var(--color-code-p-bg)] text-[var(--color-code-p-text)] border border-[var(--color-code-p-border)]',
    A: 'bg-[var(--color-code-a-bg)] text-[var(--color-a-text)] border border-[var(--color-code-a-border)]',
    L: 'bg-[var(--color-code-l-bg)] text-[var(--color-code-l-text)] border border-[var(--color-code-l-border)]',
    "½P": 'bg-[var(--color-code-halfp-bg)] text-[var(--color-code-halfp-text)] border border-[var(--color-code-halfp-border)]',
    WO: 'bg-[var(--color-code-wo-bg)] text-[var(--color-code-wo-text)] border border-[var(--color-code-wo-border)]',
    H: 'bg-[var(--color-code-h-bg)] text-[var(--color-code-h-text)] border border-[var(--color-code-h-border)]',
    INC: 'bg-[var(--color-code-l-bg)] text-[var(--color-code-l-text)] border border-[var(--color-code-l-border)]',
    OT: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const CELL_STATUS_COLORS = {
    P: 'bg-[var(--color-cell-p-bg)] text-[var(--color-cell-p-text)] border-l-4 border-l-[var(--color-cell-p-border)]',
    A: 'bg-[var(--color-cell-a-bg)] text-[var(--color-cell-a-text)] border-l-4 border-l-[var(--color-cell-a-border)]',
    L: 'bg-[var(--color-cell-l-bg)] text-[var(--color-cell-l-text)] border-l-4 border-l-[var(--color-cell-l-border)]',
    "½P": 'bg-[var(--color-cell-halfp-bg)] text-[var(--color-cell-halfp-text)] border-l-4 border-l-[var(--color-cell-halfp-border)]',
    WO: 'bg-[var(--color-cell-wo-bg)] text-[var(--color-cell-wo-text)] border-l-4 border-l-[var(--color-cell-wo-border)]',
    H: 'bg-[var(--color-cell-h-bg)] text-[var(--color-cell-h-text)] border-l-4 border-l-[var(--color-cell-h-border)]',
    INC: 'bg-[var(--color-cell-l-bg)] text-[var(--color-cell-l-text)] border-l-4 border-l-[var(--color-cell-l-border)]',
    OT: 'bg-purple-50 text-purple-700 border-l-4 border-l-purple-400',
};


/* Compact cell sizes */
const CELL_W = 70;  // Wider for better readability but still compact
const CELL_H = 40;  // Consistent height

const normalizeCode = (rawShort, rawStatus) => {
    let s = (rawShort || '').toString().trim().toUpperCase();
    if (s === '1/2P' || s === '1/2' || s === 'HALF' || s === 'HALF PRESENT' || s === 'HP') s = '½P';
    if (s === 'INC' || s === 'INCOMPLETE') s = 'INC';
    if (TOTALS_ORDER.includes(s) || s === 'L') return s;

    const status = (rawStatus || '').toLowerCase();
    if (status.includes('incomplete')) return 'INC';
    if (status.includes('week') && status.includes('off')) return 'WO';
    if (status.includes('half') && status.includes('present')) return '½P';
    if (status.includes('present')) return 'P';
    if (status.includes('absent')) return 'A';
    if (status.includes('holiday')) return 'H';
    if (status === 'late') return 'L';
    return '';
};

/* Human labels used in export headers/footers */
const getFilterLabels = (filters, branches, departments, designations, employees) => {
    const labels = {};
    if (filters.branch_id) {
        const b = branches.find(x => String(x.id) === String(filters.branch_id));
        labels.branch = b?.name || '';
    }
    if (filters.department_id) {
        const d = departments.find(x => String(x.id) === String(filters.department_id));
        labels.department = d?.name || '';
    }
    if (filters.designation_id) {
        const d = designations.find(x => String(x.id) === String(filters.designation_id));
        labels.designation = d?.name || '';
    }
    if (filters.employee_id) {
        const e = employees.find(x => String(x.id) === String(filters.employee_id));
        labels.employee = e?.name || '';
    }
    return labels;
};

const MonthlyMusterPreview = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    /* Filters */
    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_id: '',
        month_year: new Date().toISOString().slice(0, 7),
    });

    // Export dropdown (anchored)
    const [exportDropdown, setExportDropdown] = useState(false);
    const exportBtnRef = useRef(null);
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 192
    });

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type) => setToast({ message, type });
    const closeToast = () => setToast(null);

    /* Dropdowns */
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    /* Data */
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]); // raw API rows
    const [error, setError] = useState('');
    const [hasGenerated, setHasGenerated] = useState(false); // Track if data has been generated

    const containerRef = useRef(null);

    const daysInMonth = useMemo(() => getDaysInMonth(filters.month_year), [filters.month_year]);

    /* Simple day meta (no weekend styling) */
    const dayMeta = useMemo(() => {
        if (!filters.month_year) return [];
        return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1 }));
    }, [filters.month_year, daysInMonth]);

    // Auto-close export dropdown if anchor goes off-screen
    useEffect(() => {
        if (exportDropdown && exportBtnRef.current) {
            const rect = exportBtnRef.current.getBoundingClientRect();
            const off =
                rect.bottom < 0 ||
                rect.top > window.innerHeight ||
                rect.right < 0 ||
                rect.left > window.innerWidth;
            if (off) setExportDropdown(false);
        }
    }, [exportDropdown, exportPos]);

    /* Dropdown data */
    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            setError('');
            if (!user?.user_id) throw new Error('User ID is required');
            const form = new FormData();
            const res = await api.post('employee_drop_down_list', form);
            if (res.data?.success && res.data.data) {
                const data = res.data.data;
                setBranches((data.branch_list || []).map(b => ({ id: b.branch_id, name: b.name })));
                setDepartments((data.department_list || []).map(d => ({ id: d.department_id, name: d.name })));
                setDesignations((data.designation_list || []).map(d => ({ id: d.designation_id, name: d.name })));
            } else {
                throw new Error(res.data?.message || 'Failed to load filter options');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to load dropdown options');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id]);

    const fetchEmployees = useCallback(async () => {
        try {
            setError('');
            if (!user?.user_id) throw new Error('User ID is required');
            const form = new FormData();
            if (filters.branch_id) form.append('branch_id', filters.branch_id);
            if (filters.department_id) form.append('department_id', filters.department_id);
            if (filters.designation_id) form.append('designation_id', filters.designation_id);
            const res = await api.post('report_employee_list_drop_down', form);
            if (res.data?.success && res.data.data) {
                const list = res.data.data.employee_list || [];
                setEmployees(list.map(emp => ({
                    id: emp.employee_id,
                    name: `${emp.full_name}`,
                })));
            } else {
                throw new Error(res.data?.message || 'Failed to fetch employees');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to load employees');
        }
    }, [user?.user_id, filters.branch_id, filters.department_id, filters.designation_id]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    /* API */
    const fetchReportData = useCallback(async () => {
        if (!user?.user_id) throw new Error('User ID is required');
        if (!filters.month_year) throw new Error('Please select Month & Year');

        const form = new FormData();
        form.append('month_year', filters.month_year);
        if (filters.branch_id) form.append('branch_id', filters.branch_id);
        if (filters.department_id) form.append('department_id', filters.department_id);
        if (filters.designation_id) form.append('designation_id', filters.designation_id);
        if (filters.employee_id) form.append('employee_id', filters.employee_id);

        const res = await api.post('monthly_attendance_report_list', form);
        if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
        throw new Error(res.data?.message || 'Failed to fetch report data');
    }, [user?.user_id, filters]);

    // Generate button handler - replaces automatic loading
    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await fetchReportData();
            setRows(data || []);
            setHasGenerated(true);
            showToast('Report generated successfully!', 'success');
            // Always start from day 1
            if (containerRef.current) containerRef.current.scrollLeft = 0;
        } catch (e) {
            console.error(e);
            setError(e.message || 'Failed to load data');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const gridData = useMemo(() => {
        if (!rows?.length) return [];
        const byEmp = new Map();

        rows.forEach(r => {
            const key = `${r.employee_code}||${r.employee_name}`;
            if (!byEmp.has(key)) {
                byEmp.set(key, {
                    employee_code: r.employee_code,
                    employee_name: r.employee_name,
                    dayCodes: Array.from({ length: daysInMonth }, () => ''),
                    totals: TOTALS_ORDER.reduce((acc, c) => (acc[c] = 0, acc), {}),
                });
            }
            const obj = byEmp.get(key);
            const d = localDateFromYmd(r.date);
            if (!d || isNaN(d)) return;

            const day = d.getDate();
            const c = normalizeCode(r.short_status, r.status);
            if (day >= 1 && day <= daysInMonth && c) {
                obj.dayCodes[day - 1] = c;
                if (c in obj.totals) obj.totals[c] += 1;
            }
        });

        return Array.from(byEmp.values());
    }, [rows, daysInMonth]);

    const gridTemplate = useMemo(() => {
        const empCodeWidth = '120px';
        const nameWidth = '200px';
        const dayWidth = `${CELL_W}px`;
        const totalsWidth = '250px';
        return `${empCodeWidth} ${nameWidth} repeat(${daysInMonth}, ${dayWidth}) ${totalsWidth}`;
    }, [daysInMonth]);

    /* Legend always shows full set (report order) */
    const legendCodes = TOTALS_ORDER;

    /* Filter change */
    const handleFilterChange = (key, value) => {
        setRows([]); // clear data when filters change
        setError('');
        setHasGenerated(false); // Reset generated state
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'branch_id') { next.department_id = ''; next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'department_id') { next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'designation_id') { next.employee_id = ''; }
            return next;
        });
    };

    const resetFilters = () => {
        setFilters({
            branch_id: '',
            department_id: '',
            designation_id: '',
            employee_id: '',
            month_year: new Date().toISOString().slice(0, 7),
        });
        setRows([]);
        setError('');
        setHasGenerated(false);
    };

    const formatMonthYear = (monthYear) => {
        if (!monthYear) return '--';
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    /* Export handlers */
    const handleExportToPDF = async () => {
        try {
            if (!gridData?.length) {
                showToast('No data available to export', 'error');
                return;
            }
            const niceMonth = formatMonthYear(filters.month_year);
            const companyName = 'Your Company Name';
            const filterLabels = getFilterLabels(filters, branches, departments, designations, employees);

            const payload = gridData.map((emp, idx) => ({
                sno: idx + 1,
                employee_code: emp.employee_code,
                employee_name: emp.employee_name,
                dayCodes: emp.dayCodes,
                totals: emp.totals
            }));

            await exportMusterToPDF({
                rows: payload,
                monthYear: filters.month_year,
                monthLabel: niceMonth,
                companyName,
                dayMeta,
                filterLabels,
                fileName: `monthly_attendance_muster_${niceMonth.replace(/\s+/g, '_')}`
            });

            showToast('PDF exported successfully!', 'success');
            setExportDropdown(false);
        } catch (err) {
            showToast(`Failed to export PDF: ${err.message || err}`, 'error');
            setExportDropdown(false);
        }
    };

    const handleExportToExcel = async () => {
        try {
            if (!gridData?.length) {
                showToast('No data available to export', 'error');
                return;
            }
            const niceMonth = formatMonthYear(filters.month_year);
            const filterLabels = getFilterLabels(filters, branches, departments, designations, employees);

            const daysCount = dayMeta.length;
            const rowsForExcel = gridData.map(emp => {
                const base = {
                    'Employee Code': emp.employee_code,
                    'Employee Name': emp.employee_name
                };
                for (let i = 0; i < daysCount; i++) {
                    base[`Day ${i + 1}`] = emp.dayCodes[i] || '';
                }
                TOTALS_ORDER.forEach(code => {
                    const v = emp.totals[code] || 0;
                    base[CODE_LABELS[code]] = Number.isInteger(v) ? v : Number(v).toFixed(1);
                });
                return base;
            });

            await exportMusterToExcel({
                rows: rowsForExcel,
                monthYear: filters.month_year,
                monthLabel: niceMonth,
                filterLabels,
                fileName: `monthly_attendance_muster_${niceMonth.replace(/\s+/g, '_')}`
            });

            showToast('Excel exported successfully!', 'success');
            setExportDropdown(false);
        } catch (err) {
            showToast(`Failed to export Excel: ${err.message || err}`, 'error');
            setExportDropdown(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8  mx-auto">
                {/* Header card with inner gradient bar */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        Monthly Attendance Muster
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Export button */}
                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={() => setExportDropdown((v) => !v)}
                                        disabled={!hasGenerated || gridData.length === 0}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${hasGenerated && gridData.length > 0
                                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)]'
                                            : 'bg-[var(--color-bg-gray-light)] text-[var(--color-text-muted)] cursor-not-allowed'
                                            }`}
                                    >
                                        <Download className="h-4 w-4" />
                                        Export
                                        <ChevronDown className="h-4 w-4" />
                                    </button>

                                    {/* Export dropdown (anchored, scroll/resize-safe) */}
                                    {exportDropdown &&
                                        exportPos.ready &&
                                        createPortal(
                                            <>
                                                <div
                                                    className="fixed inset-0 z-[40]"
                                                    onClick={() => setExportDropdown(false)}
                                                />
                                                <div
                                                    className="absolute z-[50] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] py-2"
                                                    style={{
                                                        position: 'absolute',
                                                        top: exportPos.top,
                                                        left: exportPos.left,
                                                        width: Math.max(192, exportPos.width),
                                                        minWidth: 192
                                                    }}
                                                >
                                                    <button
                                                        onClick={handleExportToExcel}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
                                                    >
                                                        <FileSpreadsheet className="h-4 w-4 text-[var(--color-success)]" />
                                                        Export to Excel
                                                    </button>
                                                    <button
                                                        onClick={handleExportToPDF}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
                                                    >
                                                        <FileDown className="h-4 w-4 text-[var(--color-error)]" />
                                                        Export to PDF
                                                    </button>
                                                </div>
                                            </>,
                                            document.body
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-[var(--color-error-light)] border border-[var(--color-error-lighter)] rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-[var(--color-error-dark)]">
                            <HelpCircle size={16} />
                            <span className="font-medium">Error:</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--color-icon-primary-bg)] rounded-lg">
                                <Filter className="h-5 w-5 text-[var(--color-primary)]" />
                            </div>
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors duration-200"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {/* Month Year */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Month & Year <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <DatePicker
                                selected={filters.month_year ? new Date(`${filters.month_year}-01`) : null}
                                onChange={(date) => {
                                    const iso = date ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}` : '';
                                    handleFilterChange('month_year', iso);
                                }}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                showFullMonthYearPicker
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent"
                                placeholderText="Select month and year"
                                maxDate={new Date()}
                                showPopperArrow={false}
                            />
                        </div>

                        {/* Branch */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Building className="inline h-4 w-4 mr-1" />
                                Branch
                            </label>
                            <select
                                value={filters.branch_id}
                                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        {/* Department */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Users className="inline h-4 w-4 mr-1" />
                                Department
                            </label>
                            <select
                                value={filters.department_id}
                                onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Designation */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Award className="inline h-4 w-4 mr-1" />
                                Designation
                            </label>
                            <select
                                value={filters.designation_id}
                                onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Designations</option>
                                {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Employee (optional) */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <User className="inline h-4 w-4 mr-1" />
                                Employee (optional)
                            </label>
                            <select
                                value={filters.employee_id}
                                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Employees</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>

                        {/* Generate Button */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-transparent mb-2">Generate</label>
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading || !filters.month_year}
                                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${loading || !filters.month_year
                                    ? 'bg-[var(--color-bg-gray-light)] text-[var(--color-text-muted)] cursor-not-allowed'
                                    : 'bg-[var(--color-primary)] text-[var(--color-text-white)] hover:bg-[var(--color-primary-dark)] shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        Generate Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legend + Grid */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden mb-8">
                    {/* Legend/Header bar */}
                    <div className="px-4 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                                    Monthly Attendance Report - {formatMonthYear(filters.month_year)}
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    {hasGenerated
                                        ? `${gridData.length} employee${gridData.length !== 1 ? 's' : ''} found`
                                        : 'Click "Generate Report" to load data'
                                    }
                                </p>
                            </div>

                            {/* Legend - only show when data is loaded */}
                            {hasGenerated && (
                                <div className="flex flex-wrap gap-2">
                                    {legendCodes.map((c) => (
                                        <div
                                            key={c}
                                            className={`px-2 py-1 rounded text-xs font-medium ${CODE_COLORS[c] || 'bg-[var(--color-card-detail-bg)] text-[var(--color-text-secondary)] border border-[var(--color-card-detail-border)]'} border`}
                                        >
                                            <span className="font-bold">{c}</span>
                                            <span className="ml-1 hidden sm:inline">{CODE_LABELS[c]}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loading indicator (thin bar) */}
                    {loading && (
                        <div className="relative h-1 bg-[var(--color-bg-gray-light)]">
                            <div className="absolute inset-y-0 left-0 bg-[var(--color-primary)] animate-pulse w-1/3" />
                        </div>
                    )}

                    {/* Data Grid Container */}
                    <div
                        ref={containerRef}
                        className="overflow-auto max-h-[70vh] "
                        style={{ minWidth: '100%' }}
                    >
                        <div style={{ minWidth: `${140 + 240 + (daysInMonth * CELL_W) + 300}px` }}>
                            {/* Header row - only show when data is generated */}
                            {hasGenerated && (
                                <div
                                    className="sticky top-0 z-20 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]"
                                    style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
                                >
                                    <div className="px-3 py-3 text-sm font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border-primary)] sticky left-0 z-30 bg-[var(--color-bg-primary)]">
                                        Employee Code
                                    </div>
                                    <div className="px-3 py-3 text-sm font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border-primary)] sticky left-[120px] z-30 bg-[var(--color-bg-primary)]">
                                        Employee Name
                                    </div>

                                    {dayMeta.map(({ day }) => (
                                        <div
                                            key={day}
                                            className="text-xs font-semibold text-center border-r border-[var(--color-border-primary)] flex items-center justify-center text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] relative z-0"
                                            style={{ height: `${CELL_H}px` }}
                                        >
                                            {day}
                                        </div>
                                    ))}

                                    <div className="px-3 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
                                        Summary Totals
                                    </div>
                                </div>
                            )}

                            {/* Empty state - show different messages based on state */}
                            {!hasGenerated && !loading && (
                                <div className="p-12 text-center ">
                                    <div className="text-[var(--color-text-muted)] mb-4">
                                        <Calendar size={64} className="mx-auto" />
                                    </div>
                                    <p className="text-[var(--color-text-primary)] font-medium text-lg mb-2">Ready to Generate Report</p>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        Select your filters and click "Generate Report" to view attendance data
                                    </p>
                                </div>
                            )}

                            {hasGenerated && gridData.length === 0 && !loading && (
                                <div className="p-8 text-center "
                                    style={{
                                        scrollbarWidth: 'none', /* Firefox */
                                        msOverflowStyle: 'none'  /* IE and Edge */
                                    }}
                                >
                                    <div className="text-[var(--color-text-muted)] mb-2">
                                        <Users size={48} className="mx-auto" />
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] font-medium">No attendance data found</p>
                                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                        Try adjusting your filters or select a different month
                                    </p>
                                </div>
                            )}

                            {/* Data rows */}
                            {hasGenerated && gridData.map((r, rowIndex) => {
                                return (
                                    <div
                                        key={`${r.employee_code}-${rowIndex}`}
                                        className={`border-b border-[var(--color-border-secondary)]  transition-colors duration-150 bg-[var(--color-bg-secondary)]`}
                                        style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
                                    >
                                        {/* Employee Code - Sticky */}
                                        <div className={`px-4 py-3 text-sm font-medium  text-gray-900 border-b border-[var(--color-border-secondary)] sticky left-0 z-10 bg-[var(--color-bg-secondary)]`}>
                                            {r.employee_code}
                                        </div>

                                        {/* Employee Name - Sticky */}
                                        <div className={`px-4 py-3 text-sm text-gray-700 border-b border-[var(--color-border-secondary)] sticky left-[120px] z-10 bg-[var(--color-bg-secondary)] truncate`}>
                                            {r.employee_name}
                                        </div>

                                        {/* Day cells with enhanced styling */}
                                        {r.dayCodes.map((c, dayIndex) => (
                                            <div
                                                key={dayIndex}
                                                className="flex items-center justify-center text-xs font-medium py-1 mr-1 ml-1 relative z-0"
                                            >
                                                {c && (
                                                    <div className={`w-full h-full rounded-md flex items-center justify-center text-xs font-bold ${CELL_STATUS_COLORS[c] || 'bg-gray-100 text-gray-600 border-l-4 border-l-gray-300'}`}>
                                                        {CELL_DISPLAY_CODES[c] || c}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Totals column */}
                                        <div className="px-3 py-2 flex flex-wrap items-center gap-1">
                                            {TOTALS_ORDER.filter(k => r.totals[k] > 0).map(k => (
                                                <span
                                                    key={k}
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${CODE_COLORS[k] || 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    <span className="font-bold">{k}</span>
                                                    <span className="bg-white/50 px-1 rounded text-xs font-bold">
                                                        {Number.isInteger(r.totals[k]) ? r.totals[k] : r.totals[k].toFixed(1)}
                                                    </span>
                                                </span>
                                            ))}
                                            {TOTALS_ORDER.every(k => r.totals[k] === 0) && (
                                                <span className="text-gray-500 text-sm">No records</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default MonthlyMusterPreview;