import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users,
  Calendar,
  IndianRupee,
  RefreshCw,
  XCircle,
  FileText,
  ArrowLeft,
  Clock,
  TrendingUp,
  Edit,
  Save,
  X,
  Calendar as CalendarIcon,
  Plus,
  Minus,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Building,
  Award,
  Filter,
  AlertTriangle,
  ChevronUp,
  User
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import { Toast } from '../../Components/ui/Toast';
import { ConfirmDialog } from '../../Components/ui/ConfirmDialog';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';

// ---------------------------------------------------------------------------
// Multi-Select Searchable Dropdown (chips)
// ---------------------------------------------------------------------------
const MultiSelectDropdown = ({ options, selected, onChange, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    options.filter(o => o.full_name?.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o.employee_id)),
    [options, search, selected]
  );

  const selectedEmployees = useMemo(() =>
    options.filter(o => selected.includes(o.employee_id)),
    [options, selected]
  );

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else onChange([...selected, id]);
  };

  const removeChip = (id, e) => { e.stopPropagation(); onChange(selected.filter(s => s !== id)); };

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => !disabled && setOpen(v => !v)}
        className={`min-h-[42px] w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg flex flex-wrap gap-1 items-center transition-colors
          ${disabled
            ? 'bg-[var(--color-bg-secondary)] cursor-not-allowed'
            : 'bg-[var(--color-bg-secondary)] cursor-pointer hover:border-[var(--color-primary-dark)]'
          }`}
      >
        {selectedEmployees.length === 0 && (
          <span className="text-sm text-[var(--color-text-secondary)]">{placeholder}</span>
        )}
        {selectedEmployees.map(emp => (
          <span key={emp.employee_id} className="inline-flex items-center gap-1 bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] text-xs px-2 py-1 rounded-full font-medium">
            {emp.full_name}
            <button onClick={(e) => removeChip(emp.employee_id, e)} className="hover:text-red-600 ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] ml-auto flex-shrink-0 transition-transform ${open && !disabled ? 'rotate-180' : ''}`} />
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-[var(--color-border-secondary)]">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] bg-[var(--color-bg-secondary)]"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">
                <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
                {options.length === 0 ? 'No employees available' : 'No results found'}
              </div>
            ) : (
              filtered.map(emp => (
                <div
                  key={emp.employee_id}
                  onClick={() => toggle(emp.employee_id)}
                  className="px-4 py-2 text-sm hover:bg-[var(--color-primary-lightest)] cursor-pointer text-[var(--color-text-primary)] border-b border-[var(--color-border-secondary)] last:border-b-0 transition-colors"
                >
                  {emp.full_name}
                </div>
              ))
            )}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-[var(--color-border-secondary)] flex justify-between items-center bg-[var(--color-bg-secondary)]">
              <span className="text-xs text-[var(--color-text-secondary)]">{selected.length} selected</span>
              <button onClick={() => onChange([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helpers shared across employee payroll blocks
// ---------------------------------------------------------------------------
const groupHolidaysById = (arr = []) => {
  const map = {};
  arr.forEach(h => {
    const id = h.holiday_id;
    if (!map[id]) map[id] = { holiday_id: id, holiday_name: h.holiday_name, dates: [] };
    map[id].dates.push({
      holiday_date_id: h.holiday_date_id,
      holiday_date: h.holiday_date,
      holiday_paid: `${h.holiday_paid}`,
      holiday_amount: `${h.holiday_amount || '0'}`
    });
  });
  return Object.values(map);
};

// ---------------------------------------------------------------------------
// Single Employee Payroll Block (accordion)
// ---------------------------------------------------------------------------
const EmployeePayrollBlock = ({ empData, permissions, onDataChange, onUnsavedChange }) => {
  const { employee_id, employee_name, payrollData } = empData;

  const [expandedShiftId, setExpandedShiftId] = useState(null);
  const [baseSalary] = useState(payrollData.total_salary || '0');
  const [monthlySalary] = useState(payrollData.monthly_salary || payrollData.salary || '0');

  // allowances
  const [selectedAllowances, setSelectedAllowances] = useState(() => {
    const init = {};
    payrollData.employee_allowance_arr?.forEach(a => { init[a.employee_allowance_id] = true; });
    return init;
  });
  const [editableAllowances, setEditableAllowances] = useState(() => {
    const init = {};
    payrollData.employee_allowance_arr?.forEach(a => { init[a.employee_allowance_id] = a.allowance_amount; });
    return init;
  });
  const [editingAllowanceId, setEditingAllowanceId] = useState(null);

  // deductions
  const [selectedDeductions, setSelectedDeductions] = useState(() => {
    const init = {};
    payrollData.employee_deduction_arr?.forEach(d => { init[d.employee_deduction_id] = true; });
    return init;
  });
  const [editableDeductions, setEditableDeductions] = useState(() => {
    const init = {};
    payrollData.employee_deduction_arr?.forEach(d => { init[d.employee_deduction_id] = d.deduction_amount; });
    return init;
  });
  const [editingDeductionId, setEditingDeductionId] = useState(null);

  // holidays
  const groupedHolidays = useMemo(() => groupHolidaysById(payrollData.holiday_list_arr || []), [payrollData]);
  const [selectedHolidays, setSelectedHolidays] = useState(() => {
    const init = {};
    groupHolidaysById(payrollData.holiday_list_arr || []).forEach(g => {
      init[g.holiday_id] = g.dates.some(d => d.holiday_paid === '1');
    });
    return init;
  });
  const [editableHolidayAmounts, setEditableHolidayAmounts] = useState(() => {
    const init = {};
    (payrollData.holiday_list_arr || []).forEach(h => {
      init[h.holiday_date_id] = h.holiday_paid === '1' ? `${h.holiday_amount || '0'}` : '0';
    });
    return init;
  });
  const [editingHolidayDateId, setEditingHolidayDateId] = useState(null);
  const [expandedHolidayId, setExpandedHolidayId] = useState(null);

  // loans & advances
  const [selectedLoans, setSelectedLoans] = useState(() => {
    const init = {};
    payrollData.employee_loan_arr?.forEach(l => { init[l.loan_items_id] = true; });
    return init;
  });
  const [selectedAdvances, setSelectedAdvances] = useState(() => {
    const init = {};
    payrollData.employee_advance_arr?.forEach(a => { init[a.advance_id] = true; });
    return init;
  });
  const [editableAdvances, setEditableAdvances] = useState(() => {
    const init = {};
    payrollData.employee_advance_arr?.forEach(a => { init[a.advance_id] = a.advance_amount; });
    return init;
  });
  const [editingAdvanceId, setEditingAdvanceId] = useState(null);

  // final payable
  const [finalPayableManuallyEdited, setFinalPayableManuallyEdited] = useState(false);
  const [isEditingFinalPayable, setIsEditingFinalPayable] = useState(false);
  const [editableFinalPayable, setEditableFinalPayable] = useState('0');

  // remark
  const [hasAnyEdit, setHasAnyEdit] = useState(false);
  const [editRemark, setEditRemark] = useState('');

  // local toast
  const [localToast, setLocalToast] = useState(null);
  const showToast = (msg, type) => { setLocalToast({ msg, type }); setTimeout(() => setLocalToast(null), 3000); };

  // ---- Computed values ----
  const overtimeAndWeekoff = useMemo(() => {
    let totalOvertime = 0, overtimePay = 0;
    payrollData.main_attendance_arr?.forEach(s => s.attendance_arr?.forEach(a => {
      totalOvertime += parseFloat(a.overtime || 0) || 0;
      overtimePay += parseFloat(a.overtime_salary_for_day || 0) || 0;
    }));
    return { totalOvertimeHours: totalOvertime, overtimePay, weekoffPay: parseFloat(payrollData.week_of_salary || 0) || 0 };
  }, [payrollData]);

  const paySalary = useMemo(() =>
    (parseFloat(baseSalary || 0) || 0) + overtimeAndWeekoff.overtimePay + overtimeAndWeekoff.weekoffPay,
    [baseSalary, overtimeAndWeekoff]
  );

  const totalAllowances = useMemo(() =>
    Object.keys(selectedAllowances).reduce((s, id) => s + (selectedAllowances[id] ? parseFloat(editableAllowances[id] || 0) || 0 : 0), 0),
    [selectedAllowances, editableAllowances]
  );

  const totalDeductions = useMemo(() =>
    Object.keys(selectedDeductions).reduce((s, id) => s + (selectedDeductions[id] ? parseFloat(editableDeductions[id] || 0) || 0 : 0), 0),
    [selectedDeductions, editableDeductions]
  );

  const totalHolidays = useMemo(() => {
    let s = 0;
    groupedHolidays.forEach(g => {
      if (!selectedHolidays[g.holiday_id]) return;
      g.dates.forEach(d => { if (d.holiday_paid === '1') s += parseFloat(editableHolidayAmounts[d.holiday_date_id] || 0) || 0; });
    });
    return s;
  }, [groupedHolidays, selectedHolidays, editableHolidayAmounts]);

  const totalLoans = useMemo(() =>
    (payrollData.employee_loan_arr || []).reduce((s, l) => s + (selectedLoans[l.loan_items_id] ? parseFloat(l.installment_amount || 0) || 0 : 0), 0),
    [payrollData, selectedLoans]
  );

  const totalAdvances = useMemo(() =>
    Object.keys(selectedAdvances).reduce((s, id) => s + (selectedAdvances[id] ? parseFloat(editableAdvances[id] || 0) || 0 : 0), 0),
    [selectedAdvances, editableAdvances]
  );

  // Auto-recalculate final payable
  useEffect(() => {
    const auto = paySalary + totalAllowances - totalDeductions + totalHolidays - totalLoans - totalAdvances;
    if (!isEditingFinalPayable && !finalPayableManuallyEdited) {
      setEditableFinalPayable(auto.toString());
    }
  }, [paySalary, totalAllowances, totalDeductions, totalHolidays, totalLoans, totalAdvances, isEditingFinalPayable, finalPayableManuallyEdited]);

  // Notify parent of unsaved state
  useEffect(() => {
    const hasUnsaved = editingAllowanceId !== null || editingDeductionId !== null || editingHolidayDateId !== null || editingAdvanceId !== null || isEditingFinalPayable;
    onUnsavedChange(employee_id, hasUnsaved);
  }, [editingAllowanceId, editingDeductionId, editingHolidayDateId, editingAdvanceId, isEditingFinalPayable, employee_id, onUnsavedChange]);

  // Notify parent of data changes for submission
  useEffect(() => {
    onDataChange(employee_id, {
      total_salary: baseSalary,
      week_of_salary: (overtimeAndWeekoff.weekoffPay || 0).toString(),
      overtime_salary: (overtimeAndWeekoff.overtimePay || 0).toString(),
      pay_salary: paySalary.toString(),
      total_pay_salary: editableFinalPayable,
      remark_for_edit: hasAnyEdit ? editRemark : '',
      main_attendance_arr: payrollData.main_attendance_arr || [],
      employee_allowance_arr: (payrollData.employee_allowance_arr || []).filter(a => selectedAllowances[a.employee_allowance_id]).map(a => ({ ...a, allowance_amount: editableAllowances[a.employee_allowance_id] })),
      employee_deduction_arr: (payrollData.employee_deduction_arr || []).filter(d => selectedDeductions[d.employee_deduction_id]).map(d => ({ ...d, deduction_amount: editableDeductions[d.employee_deduction_id] })),
      holiday_list_arr: (() => {
        const arr = [];
        groupedHolidays.forEach(g => {
          if (!selectedHolidays[g.holiday_id]) return;
          g.dates.forEach(d => {
            arr.push({ holiday_id: g.holiday_id, holiday_name: g.holiday_name, holiday_date_id: d.holiday_date_id, holiday_date: d.holiday_date, holiday_paid: d.holiday_paid, holiday_amount: d.holiday_paid === '1' ? (editableHolidayAmounts[d.holiday_date_id] || '0') : '0' });
          });
        });
        return arr;
      })(),
      employee_loan_arr: (payrollData.employee_loan_arr || []).filter(l => selectedLoans[l.loan_items_id]),
      employee_advance_arr: (payrollData.employee_advance_arr || []).filter(a => selectedAdvances[a.advance_id]).map(a => ({ ...a, advance_amount: editableAdvances[a.advance_id] })),
      hasAnyEdit,
      editRemark,
    });
  }, [
    editableFinalPayable, hasAnyEdit, editRemark, selectedAllowances, editableAllowances,
    selectedDeductions, editableDeductions, selectedHolidays, editableHolidayAmounts,
    selectedLoans, selectedAdvances, editableAdvances, paySalary,
    baseSalary, overtimeAndWeekoff, groupedHolidays, payrollData, employee_id, onDataChange
  ]);

  const finalPayable = parseFloat(editableFinalPayable || 0);

  // ---- Handlers ----
  const markEdited = () => setHasAnyEdit(true);

  return (
    <div className="space-y-4 p-4">
      {/* Local toast */}
      {localToast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${localToast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {localToast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
          <p className="text-xs font-medium text-purple-700">Monthly Salary</p>
          <p className="text-base font-bold text-purple-900">₹{parseFloat(monthlySalary || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-primary-lightest)] rounded-lg p-3 border border-[var(--color-primary-light)]">
          <p className="text-xs font-medium text-[var(--color-primary-dark)]">Base Salary</p>
          <p className="text-base font-bold text-[var(--color-primary-dark)]">₹{parseFloat(baseSalary || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-3 border border-primary-200">
          <p className="text-xs font-medium text-primary-700">Overtime <span className="text-xs">({overtimeAndWeekoff.totalOvertimeHours.toFixed(2)}h)</span></p>
          <p className="text-base font-bold text-primary-900">₹{overtimeAndWeekoff.overtimePay.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-cell-p-bg)] rounded-lg p-3 border border-[var(--color-cell-p-border)]">
          <p className="text-xs font-medium text-[var(--color-cell-p-text)]">Week-off Pay</p>
          <p className="text-base font-bold text-[var(--color-cell-p-text)]">₹{overtimeAndWeekoff.weekoffPay.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-cell-wo-bg)] rounded-lg p-3 border border-[var(--color-cell-wo-border)]">
          <p className="text-xs font-medium text-[var(--color-cell-wo-text)]">Pay Salary</p>
          <p className="text-base font-bold text-[var(--color-cell-wo-text)]">₹{paySalary.toLocaleString()}</p>
        </div>
      </div>

      {/* Attendance accordion */}
      <div className="bg-[var(--color-bg-secondary)] rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-[var(--color-text-primary)] flex items-center"><Calendar className="w-4 h-4 mr-2" />Attendance Details</h4>
          <span className="text-xs text-[var(--color-text-secondary)]">{payrollData.main_attendance_arr?.length || 0} Shift(s)</span>
        </div>
        <div className="space-y-2">
          {payrollData.main_attendance_arr?.map((shift, idx) => {
            const isExp = expandedShiftId === idx;
            const presentDays = shift.attendance_arr?.filter(a => ['Complete hours', 'Incomplete hours', 'Overtime hours'].includes(a.status_name)).length || 0;
            return (
              <div key={idx} className="border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                <button onClick={() => setExpandedShiftId(isExp ? null : idx)} className="w-full px-4 py-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExp ? <ChevronDown className="w-4 h-4 text-[var(--color-primary-dark)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-primary-dark)]" />}
                    <div className="text-left">
                      <div className="font-medium text-sm text-[var(--color-text-primary)]">{shift.shift_name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{presentDays}/{shift.attendance_arr?.length || 0} days present · Working days: {shift.total_working_days}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[var(--color-primary-dark)]">₹{parseFloat(shift.total_salary || 0).toLocaleString()}</div>
                </button>
                {isExp && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-[var(--color-bg-secondary)]">
                        <tr>
                          {['Date', 'Status', 'Working Hrs', 'OT Hrs', 'Hourly Rate', 'Daily Salary', 'Total'].map(h => (
                            <th key={h} className="px-3 py-2 text-center font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-primary)]">
                        {shift.attendance_arr?.map((a, i) => (
                          <tr key={i} className="hover:bg-[var(--color-primary-lightest)]">
                            <td className="px-3 py-2 text-center">{new Date(a.attendance_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status_name === 'Complete hours' ? 'bg-green-100 text-green-800' : a.status_name === 'Incomplete hours' ? 'bg-yellow-100 text-yellow-800' : a.status_name === 'Overtime hours' ? 'bg-primary-100 text-primary-800' : 'bg-red-100 text-red-800'}`}>
                                {a.status_name}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">{a.actual_hours}</td>
                            <td className="px-3 py-2 text-center text-primary-600">{a.overtime || '0'}</td>
                            <td className="px-3 py-2 text-center">₹{parseFloat(a.hourly_salary_for_day || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-center">₹{parseFloat(a.daily_salary_for_day || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-center font-bold text-[var(--color-primary-dark)]">₹{((parseFloat(a.daily_salary_for_day || 0) || 0) + (parseFloat(a.overtime_salary_for_day || 0) || 0)).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[var(--color-primary-lightest)]">
                        <tr>
                          <td colSpan="6" className="px-3 py-2 text-right text-xs font-semibold">Shift Total:</td>
                          <td className="px-3 py-2 text-center font-bold text-[var(--color-primary-dark)]">₹{parseFloat(shift.total_salary || 0).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Allowances & Deductions */}
      {(payrollData.employee_allowance_arr?.length > 0 || payrollData.employee_deduction_arr?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payrollData.employee_allowance_arr?.length > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">Allowances</h4>
                <span className="text-green-600 font-medium text-sm">+ ₹{totalAllowances.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {payrollData.employee_allowance_arr.map(a => (
                  <div key={a.employee_allowance_id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={!!selectedAllowances[a.employee_allowance_id]} onChange={() => { setSelectedAllowances(p => ({ ...p, [a.employee_allowance_id]: !p[a.employee_allowance_id] })); markEdited(); }} className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-medium">{a.allowance_name}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Type {a.allowance_type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingAllowanceId === a.employee_allowance_id ? (
                        <>
                          <input type="number" value={editableAllowances[a.employee_allowance_id] || '0'} onChange={e => setEditableAllowances(p => ({ ...p, [a.employee_allowance_id]: e.target.value }))} className="w-24 px-2 py-1 border rounded text-xs" min="0" step="0.01" />
                          <button onClick={() => { const amt = parseFloat(editableAllowances[a.employee_allowance_id]); if (isNaN(amt) || amt < 0) return showToast('Invalid amount', 'error'); setEditingAllowanceId(null); markEdited(); }} className="p-1 text-green-600"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditingAllowanceId(null); setEditableAllowances(p => ({ ...p, [a.employee_allowance_id]: a.allowance_amount })); }} className="p-1 text-gray-500"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-green-600">₹{parseFloat(editableAllowances[a.employee_allowance_id] || 0).toLocaleString()}</span>
                          {permissions.salary_edit && selectedAllowances[a.employee_allowance_id] && <button onClick={() => setEditingAllowanceId(a.employee_allowance_id)} className="p-1 text-[var(--color-text-secondary)]"><Edit className="w-3.5 h-3.5" /></button>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payrollData.employee_deduction_arr?.length > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">Deductions</h4>
                <span className="text-red-600 font-medium text-sm">- ₹{totalDeductions.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {payrollData.employee_deduction_arr.map(d => (
                  <div key={d.employee_deduction_id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={!!selectedDeductions[d.employee_deduction_id]} onChange={() => { setSelectedDeductions(p => ({ ...p, [d.employee_deduction_id]: !p[d.employee_deduction_id] })); markEdited(); }} className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-medium">{d.deduction_name}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Type {d.deduction_type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingDeductionId === d.employee_deduction_id ? (
                        <>
                          <input type="number" value={editableDeductions[d.employee_deduction_id] || '0'} onChange={e => setEditableDeductions(p => ({ ...p, [d.employee_deduction_id]: e.target.value }))} className="w-24 px-2 py-1 border rounded text-xs" min="0" step="0.01" />
                          <button onClick={() => { const amt = parseFloat(editableDeductions[d.employee_deduction_id]); if (isNaN(amt) || amt < 0) return showToast('Invalid amount', 'error'); setEditingDeductionId(null); markEdited(); }} className="p-1 text-green-600"><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setEditingDeductionId(null); setEditableDeductions(p => ({ ...p, [d.employee_deduction_id]: d.deduction_amount })); }} className="p-1 text-gray-500"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-red-600">₹{parseFloat(editableDeductions[d.employee_deduction_id] || 0).toLocaleString()}</span>
                          {permissions.salary_edit && selectedDeductions[d.employee_deduction_id] && <button onClick={() => setEditingDeductionId(d.employee_deduction_id)} className="p-1 text-[var(--color-text-secondary)]"><Edit className="w-3.5 h-3.5" /></button>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Holidays */}
      {groupedHolidays.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">Holidays</h4>
            <span className="text-green-700 font-medium text-sm">+ ₹{totalHolidays.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            {groupedHolidays.map(g => {
              const groupTotal = g.dates.reduce((s, d) => s + (d.holiday_paid === '1' ? parseFloat(editableHolidayAmounts[d.holiday_date_id] || 0) || 0 : 0), 0);
              const included = !!selectedHolidays[g.holiday_id];
              return (
                <div key={g.holiday_id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={included} onChange={() => { setSelectedHolidays(p => ({ ...p, [g.holiday_id]: !p[g.holiday_id] })); markEdited(); }} className="w-3.5 h-3.5" />
                      <div>
                        <div className="text-sm font-medium">{g.holiday_name} <span className="text-xs text-[var(--color-text-secondary)]">({g.dates.length} days)</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">₹{groupTotal.toLocaleString()}</span>
                      <button onClick={() => setExpandedHolidayId(p => p === g.holiday_id ? null : g.holiday_id)} className="p-1 rounded hover:bg-[var(--color-bg-gray-light)]">
                        {expandedHolidayId === g.holiday_id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {expandedHolidayId === g.holiday_id && (
                    <div className="mt-2 pl-6 space-y-1">
                      {g.dates.map(d => (
                        <div key={d.holiday_date_id} className="flex items-center justify-between p-2 border rounded text-xs">
                          <div>
                            <div className="font-medium">{new Date(d.holiday_date).toLocaleDateString('en-GB')}</div>
                            <div className="text-[var(--color-text-secondary)]">{d.holiday_paid === '1' ? 'Paid' : 'Unpaid'}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            {editingHolidayDateId === d.holiday_date_id ? (
                              <>
                                <input type="number" value={editableHolidayAmounts[d.holiday_date_id] || '0'} onChange={e => setEditableHolidayAmounts(p => ({ ...p, [d.holiday_date_id]: e.target.value }))} className="w-20 px-2 py-1 border rounded" min="0" step="0.01" />
                                <button onClick={() => { if (d.holiday_paid === '2') { setEditableHolidayAmounts(p => ({ ...p, [d.holiday_date_id]: '0' })); setEditingHolidayDateId(null); return; } const amt = parseFloat(editableHolidayAmounts[d.holiday_date_id]); if (isNaN(amt) || amt < 0) return showToast('Invalid amount', 'error'); setEditingHolidayDateId(null); markEdited(); }} className="p-1 text-green-600"><Save className="w-3 h-3" /></button>
                                <button onClick={() => { setEditingHolidayDateId(null); setEditableHolidayAmounts(p => ({ ...p, [d.holiday_date_id]: d.holiday_paid === '1' ? d.holiday_amount : '0' })); }} className="p-1 text-gray-500"><X className="w-3 h-3" /></button>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold">₹{parseFloat(editableHolidayAmounts[d.holiday_date_id] || 0).toLocaleString()}</span>
                                {d.holiday_paid === '1' && permissions.salary_edit && included && <button onClick={() => setEditingHolidayDateId(d.holiday_date_id)} className="p-1 text-[var(--color-text-secondary)]"><Edit className="w-3 h-3" /></button>}
                                {d.holiday_paid === '2' && <span className="text-[var(--color-text-secondary)] border rounded px-1">Unpaid</span>}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loans & Advances */}
      {(payrollData.employee_loan_arr?.length > 0 || payrollData.employee_advance_arr?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payrollData.employee_loan_arr?.length > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Loan Deductions</h4>
                <span className="text-red-600 font-medium text-sm">- ₹{totalLoans.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {payrollData.employee_loan_arr.map(loan => (
                  <div key={loan.loan_items_id} className="flex items-center justify-between p-2 border rounded text-xs">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={!!selectedLoans[loan.loan_items_id]} onChange={() => { setSelectedLoans(p => ({ ...p, [loan.loan_items_id]: !p[loan.loan_items_id] })); markEdited(); }} className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-medium">Loan Installment</div>
                        <div className="text-[var(--color-text-secondary)]">Amount: ₹{parseFloat(loan.loan_amount || 0).toLocaleString()} | {loan.interest_rate}% | {loan.tenure}m</div>
                        <div className="text-[var(--color-text-secondary)]">Due: {new Date(loan.loan_payment_date).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-red-600">₹{parseFloat(loan.installment_amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payrollData.employee_advance_arr?.length > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Advance Deductions</h4>
                <span className="text-red-600 font-medium text-sm">- ₹{totalAdvances.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {payrollData.employee_advance_arr.map(adv => (
                  <div key={adv.advance_id} className="flex items-center justify-between p-2 border rounded text-xs">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={!!selectedAdvances[adv.advance_id]} onChange={() => { setSelectedAdvances(p => ({ ...p, [adv.advance_id]: !p[adv.advance_id] })); markEdited(); }} className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-medium">Advance Payment</div>
                        <div className="text-[var(--color-text-secondary)]">Max: ₹{parseFloat(adv.advance_amount || 0).toLocaleString()} | {new Date(adv.advance_disbursement_date).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingAdvanceId === adv.advance_id ? (
                        <>
                          <input type="number" value={editableAdvances[adv.advance_id] || '0'} onChange={e => setEditableAdvances(p => ({ ...p, [adv.advance_id]: e.target.value }))} className="w-20 px-2 py-1 border rounded" min="0" max={adv.advance_amount} step="0.01" />
                          <button onClick={() => {
                            const amt = parseFloat(editableAdvances[adv.advance_id]);
                            const max = parseFloat(adv.advance_amount);
                            if (isNaN(amt) || amt < 0) return showToast('Invalid amount', 'error');
                            if (amt > max) return showToast(`Cannot exceed ₹${max.toLocaleString()}`, 'error');
                            setEditingAdvanceId(null); markEdited();
                          }} className="p-1 text-green-600"><Save className="w-3 h-3" /></button>
                          <button onClick={() => { setEditingAdvanceId(null); setEditableAdvances(p => ({ ...p, [adv.advance_id]: adv.advance_amount })); }} className="p-1 text-gray-500"><X className="w-3 h-3" /></button>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-red-600">₹{parseFloat(editableAdvances[adv.advance_id] || 0).toLocaleString()}</span>
                          {permissions.salary_edit && selectedAdvances[adv.advance_id] && <button onClick={() => setEditingAdvanceId(adv.advance_id)} className="p-1 text-[var(--color-text-secondary)]"><Edit className="w-3 h-3" /></button>}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete breakdown */}
      <div className="bg-[var(--color-bg-secondary)] rounded-lg border p-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center"><IndianRupee className="w-4 h-4 mr-1" /> Complete Salary Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Monthly Salary</span><span className="font-semibold text-purple-700">₹{parseFloat(monthlySalary || 0).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Base Salary</span><span className="font-semibold">₹{parseFloat(baseSalary || 0).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Overtime Pay</span><span>+ ₹{overtimeAndWeekoff.overtimePay.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Week-off Pay</span><span>+ ₹{overtimeAndWeekoff.weekoffPay.toLocaleString()}</span></div>
          <div className="flex justify-between py-2 bg-[var(--color-primary-lightest)] px-3 rounded border"><span className="font-semibold">Pay Salary</span><span className="font-bold">₹{paySalary.toLocaleString()}</span></div>
          {totalAllowances > 0 && <div className="flex justify-between"><span className="text-green-600 flex items-center"><Plus className="w-3 h-3 mr-1" />Total Allowances</span><span className="font-semibold text-green-600">+ ₹{totalAllowances.toLocaleString()}</span></div>}
          {totalDeductions > 0 && <div className="flex justify-between"><span className="text-red-600 flex items-center"><Minus className="w-3 h-3 mr-1" />Total Deductions</span><span className="font-semibold text-red-600">- ₹{totalDeductions.toLocaleString()}</span></div>}
          {totalHolidays > 0 && <div className="flex justify-between"><span className="text-green-700">Holiday Paid Amount</span><span className="font-semibold text-green-700">+ ₹{totalHolidays.toLocaleString()}</span></div>}
          {totalLoans > 0 && <div className="flex justify-between"><span className="text-red-600 flex items-center"><Minus className="w-3 h-3 mr-1" />Loan Deductions</span><span className="font-semibold text-red-600">- ₹{totalLoans.toLocaleString()}</span></div>}
          {totalAdvances > 0 && <div className="flex justify-between"><span className="text-red-600 flex items-center"><Minus className="w-3 h-3 mr-1" />Advance Deductions</span><span className="font-semibold text-red-600">- ₹{totalAdvances.toLocaleString()}</span></div>}

          {/* Final payable */}
          <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-green-100 px-3 rounded-lg border-2 border-green-300 mt-2">
            <div className="font-bold text-green-800">
              Final Payable
              {finalPayableManuallyEdited && <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Manually Adjusted</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-900">₹{finalPayable.toLocaleString()}</span>
              {permissions.salary_edit && (isEditingFinalPayable ? (
                <>
                  <input type="number" value={editableFinalPayable} onChange={e => setEditableFinalPayable(e.target.value)} className="w-28 px-2 py-1 border rounded text-sm" min="0" step="0.01" />
                  <button onClick={() => { const amt = parseFloat(editableFinalPayable); if (isNaN(amt) || amt < 0) return showToast('Invalid amount', 'error'); setIsEditingFinalPayable(false); setFinalPayableManuallyEdited(true); markEdited(); }} className="p-1.5 bg-green-600 text-white rounded"><Save className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setIsEditingFinalPayable(false); setFinalPayableManuallyEdited(false); }} className="p-1.5 bg-gray-500 text-white rounded"><X className="w-3.5 h-3.5" /></button>
                </>
              ) : (
                <button onClick={() => setIsEditingFinalPayable(true)} className="p-1 text-[var(--color-text-secondary)]"><Edit className="w-4 h-4" /></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Remark */}
      {hasAnyEdit && (
        <div className="bg-[var(--color-bg-secondary)] rounded-lg border-2 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[var(--color-primary-lighter)] rounded"><Edit className="w-4 h-4 text-[var(--color-primary-dark)]" /></div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Remark required for changes</h4>
              <textarea value={editRemark} onChange={e => setEditRemark(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded text-sm" placeholder="Enter remark for edits..." />
              {editRemark.trim() && <div className="text-xs text-green-600 mt-1">✓ Remark added</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main MonthlyPayroll Component
// ---------------------------------------------------------------------------
const MonthlyPayroll = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  // dropdown data
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // payroll results
  const [allPayrollData, setAllPayrollData] = useState([]); // [{ employee_id, employee_name, payrollData }]
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // per-employee expanded accordion
  const [expandedEmployees, setExpandedEmployees] = useState({});

  // per-employee payroll data collected from child components
  const [employeePayloads, setEmployeePayloads] = useState({});
  // per-employee unsaved edits tracking
  const [unsavedByEmployee, setUnsavedByEmployee] = useState({});

  // confirm & toast
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const navigate = useNavigate();
  const permissions = useSelector(state => state.permissions) || {};
  const { user, isAuthenticated, logout } = useAuth();

  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const showToast = (message, type) => setToast({ message, type });
  const closeToast = () => setToast(null);

  // Has any employee unsaved edits?
  const hasAnyUnsaved = useMemo(() => Object.values(unsavedByEmployee).some(Boolean), [unsavedByEmployee]);

  // Validate: all employees with edits must have a remark
  const missingRemarks = useMemo(() =>
    allPayrollData.filter(e => {
      const payload = employeePayloads[e.employee_id];
      return payload?.hasAnyEdit && !payload?.editRemark?.trim();
    }).map(e => e.employee_name),
    [allPayrollData, employeePayloads]
  );

  // Callbacks for child components
  const handleDataChange = useCallback((employeeId, data) => {
    setEmployeePayloads(prev => ({ ...prev, [employeeId]: data }));
  }, []);

  const handleUnsavedChange = useCallback((employeeId, hasUnsaved) => {
    setUnsavedByEmployee(prev => ({ ...prev, [employeeId]: hasUnsaved }));
  }, []);

  // Fetch branches & departments
  const fetchDropdownData = useCallback(async () => {
    try {
      setDropdownLoading(true);
      if (!user?.user_id) return;
      const formData = new FormData();
      const response = await api.post('employee_drop_down_list', formData);
      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        setBranches((data.branch_list || []).map(b => ({ branch_id: b.branch_id, name: b.name })));
        setDepartments((data.department_list || []).map(d => ({ department_id: d.department_id, name: d.name })));
      }
    } catch (err) {
      showToast('Failed to load filter options', 'error');
    } finally {
      setDropdownLoading(false);
    }
  }, [user]);

  // Fetch employees for multi-select
  const fetchEmployees = useCallback(async () => {
    if (!user?.user_id || !selectedBranch || !selectedDepartment || !selectedMonth || !selectedYear) {
      setEmployees([]);
      return;
    }
    try {
      setEmployeesLoading(true);
      const formData = new FormData();
      formData.append('month_year', `${selectedYear}-${selectedMonth}`);
      formData.append('branch_id', selectedBranch);
      formData.append('department_id', selectedDepartment);
      const response = await api.post('branch_and_department_wise_fetch_employee', formData);
      if (response.data?.success) {
        setEmployees(response.data.data || []);
      }
    } catch (err) {
      showToast('Failed to load employees', 'error');
    } finally {
      setEmployeesLoading(false);
    }
  }, [user, selectedBranch, selectedDepartment, selectedMonth, selectedYear]);

  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
  useEffect(() => { fetchEmployees(); setSelectedEmployeeIds([]); }, [fetchEmployees]);

  useEffect(() => {
    if (isAuthenticated() && user?.user_id) {
      const now = new Date();
      setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
      setSelectedYear(String(currentYear));
    }
  }, [isAuthenticated, user?.user_id, currentYear]);

  const canGenerate = selectedBranch && selectedDepartment && selectedMonth && selectedYear;

  const handleGeneratePayroll = async () => {
    if (!canGenerate) { showToast('Please select Branch, Department, Month and Year', 'error'); return; }
    try {
      setLoading(true);
      setError(null);
      setAllPayrollData([]);
      setEmployeePayloads({});
      setUnsavedByEmployee({});
      setExpandedEmployees({});

      const formData = new FormData();
      formData.append('month_year', `${selectedYear}-${selectedMonth}`);
      formData.append('branch_id', selectedBranch);
      formData.append('department_id', selectedDepartment);
      if (selectedEmployeeIds.length > 0) {
        formData.append('employee_id', selectedEmployeeIds.join(','));
      }

      const response = await api.post('all_employee_wise_search_salary', formData);
      if (!response.data?.success) throw new Error(response.data?.message || 'Failed to fetch payroll data');

      const rawList = response.data.data;
      // API may return an array of employee payroll objects
      const list = Array.isArray(rawList) ? rawList : [rawList];

      if (list.length === 0) { showToast('No payroll data found for the selected filters', 'error'); setLoading(false); return; }

      const processed = list.map(item => ({
        employee_id: item.employee_id,
        employee_name: item.employee_name || item.full_name || `Employee ${item.employee_id}`,
        status: item.status || 'ready',
        payrollData: item.data || item   // API wraps actual data inside .data key
      }));

      setAllPayrollData(processed);
      // Expand first employee by default
      if (processed.length > 0) setExpandedEmployees({ [processed[0].employee_id]: true });
      showToast(`Payroll data generated for ${processed.length} employee(s)`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load payroll data';
      showToast(msg, 'error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId) => {
    setExpandedEmployees(prev => {
      const isCurrentlyOpen = !!prev[employeeId];
      const allClosed = {};
      Object.keys(prev).forEach(id => { allClosed[id] = false; });
      return isCurrentlyOpen ? allClosed : { ...allClosed, [employeeId]: true };
    });
  };

  const handleSubmitPayroll = () => {
    if (allPayrollData.length === 0) return showToast('No payroll data to submit', 'error');
    if (hasAnyUnsaved) return showToast('Please save all pending edits before submitting', 'error');
    if (missingRemarks.length > 0) return showToast(`Missing remarks for: ${missingRemarks.join(', ')}`, 'error');
    setConfirmModal({ isOpen: true });
  };

  const confirmSubmitPayroll = async () => {
    try {
      setSubmitting(true);
      setConfirmModal({ isOpen: false });

      const formData = new FormData();
      formData.append('month_year', `${selectedYear}-${selectedMonth}`);

      const employeesData = allPayrollData.map(emp => {
        const payload = employeePayloads[emp.employee_id] || {};
        return {
          employee_id: emp.employee_id,
          total_salary: parseFloat(parseFloat(payload.total_salary || 0).toFixed(2)).toString(),
          week_of_salary: parseFloat(parseFloat(payload.week_of_salary || 0).toFixed(2)).toString(),
          overtime_salary: parseFloat(parseFloat(payload.overtime_salary || 0).toFixed(2)).toString(),
          pay_salary: parseFloat(parseFloat(payload.pay_salary || 0).toFixed(2)).toString(),
          total_pay_salary: parseFloat(parseFloat(payload.total_pay_salary || 0).toFixed(2)).toString(),
          remark_for_edit: payload.hasAnyEdit ? (payload.editRemark || '') : '',
          employee_allowance_arr: payload.employee_allowance_arr || [],
          employee_deduction_arr: payload.employee_deduction_arr || [],
          holiday_list_arr: payload.holiday_list_arr || [],
          employee_loan_arr: payload.employee_loan_arr || [],
          employee_advance_arr: payload.employee_advance_arr || [],
        };
      });

      formData.append('employees_data', JSON.stringify(employeesData));

      const response = await api.post('add_all_monthly_employee_salary', formData);
      if (response.data?.success) {
        showToast('Payroll submitted successfully for all employees', 'success');
        setAllPayrollData([]);
        setEmployeePayloads({});
        setUnsavedByEmployee({});
        setExpandedEmployees({});
        setSelectedEmployeeIds([]);
      } else {
        throw new Error(response.data?.message || 'Failed to submit payroll');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit payroll';
      if (err.response?.status === 401) { showToast('Session expired. Please login again.', 'error'); setTimeout(() => logout?.(), 1500); }
      else showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  if (!permissions['salary_view']) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)]">
        <div className="p-8  mx-auto">
          <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-error-dark)] mb-2">Access Denied</h3>
            <p className="text-[var(--color-text-error)] mb-4">You don't have permission to access payroll data.</p>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-md hover:bg-[var(--color-error-lighter)]">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalFinalPayable = allPayrollData.reduce((s, emp) => s + parseFloat(employeePayloads[emp.employee_id]?.total_pay_salary || 0), 0);

  return (
    <>
      <div className="min-h-screen bg-[var(--color-bg-secondary)]">
        <div className="p-8  mx-auto">

          {/* Page header */}
          <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8 rounded-2xl shadow-xl mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--color-text-white)] px-3 py-2 rounded-lg bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)]">
                <ArrowLeft size={18} /> Back
              </button>
              <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Monthly Payroll</h1>
            </div>
          </div>

          {/* Filters card */}
          <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-secondary)] p-5 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-[var(--color-primary-lightest)] rounded-lg">
                <Filter className="h-5 w-5 text-[var(--color-primary-dark)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Payroll Filters</h2>
              <span className="ml-1 text-xs text-[var(--color-text-secondary)]">* Branch and Department are required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" /> Month <span className="text-red-500">*</span>
                </label>
                <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setAllPayrollData([]); }} className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] bg-[var(--color-bg-secondary)]">
                  <option value="">Choose Month</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" /> Year <span className="text-red-500">*</span>
                </label>
                <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setAllPayrollData([]); }} className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] bg-[var(--color-bg-secondary)]">
                  <option value="">Choose Year</option>
                  {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  <Building className="w-4 h-4 inline mr-1" /> Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={e => { setSelectedBranch(e.target.value); setSelectedDepartment(''); setSelectedEmployeeIds([]); setAllPayrollData([]); }}
                  className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] bg-[var(--color-bg-secondary)]"
                  disabled={dropdownLoading}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.name}</option>)}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  <Users className="w-4 h-4 inline mr-1" /> Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDepartment}
                  onChange={e => { setSelectedDepartment(e.target.value); setSelectedEmployeeIds([]); setAllPayrollData([]); }}
                  className={`w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] transition-colors
                    ${!selectedBranch || dropdownLoading
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-not-allowed'
                      : 'bg-[var(--color-bg-secondary)] cursor-pointer'
                    }`}
                  disabled={dropdownLoading || !selectedBranch}
                >
                  <option value="" disabled>{!selectedBranch ? 'Select branch first' : 'Choose Department'}</option>
                  {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                </select>
              </div>

              {/* Employee multi-select */}
              <div className="xl:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  <User className="w-4 h-4 inline mr-1" /> Employees{' '}
                  <span className="text-xs font-normal">(optional — leave empty for all in department)</span>
                  {employeesLoading && <RefreshCw className="w-3 h-3 inline ml-2 animate-spin text-[var(--color-primary-dark)]" />}
                </label>
                <MultiSelectDropdown
                  options={employees}
                  selected={selectedEmployeeIds}
                  onChange={(ids) => { setSelectedEmployeeIds(ids); setAllPayrollData([]); }}
                  placeholder={
                    !selectedBranch
                      ? 'Select branch first'
                      : !selectedDepartment
                        ? 'Select department first'
                        : employeesLoading
                          ? 'Loading employees...'
                          : 'Search and select employees...'
                  }
                  disabled={!selectedBranch || !selectedDepartment || employeesLoading}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleGeneratePayroll}
                disabled={loading || !canGenerate}
                className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors ${!canGenerate || loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] text-white'}`}
              >
                <IndianRupee className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Payroll'}
              </button>
            </div>
          </div>

          {/* Content area */}
          {loading ? (
            <div className="p-8 bg-[var(--color-bg-secondary)] rounded-xl border"><LoadingSpinner /></div>
          ) : error ? (
            <div className="p-8 bg-[var(--color-bg-secondary)] rounded-xl border text-center">
              <XCircle className="w-10 h-10 text-[var(--color-error)] mx-auto mb-3" />
              <p className="text-[var(--color-error-dark)] font-medium mb-3">{error}</p>
              <button onClick={handleGeneratePayroll} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] rounded-md">
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : allPayrollData.length === 0 ? (
            <div className="px-6 py-12 text-center bg-[var(--color-bg-secondary)] rounded-xl border">
              <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">No Payroll Data</p>
              <p className="text-[var(--color-text-secondary)] text-sm">Select Branch, Department, Month and Year, then click Generate Payroll.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Warnings */}
              {hasAnyUnsaved && (
                <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-800">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Some employees have unsaved edits. Please save them before submitting.</span>
                </div>
              )}
              {missingRemarks.length > 0 && (
                <div className="flex items-start gap-3 bg-orange-50 border border-orange-300 rounded-lg p-4 text-orange-800">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Missing remarks for employees with edits:</div>
                    <div className="mt-1">{missingRemarks.join(', ')}</div>
                  </div>
                </div>
              )}

              {/* Employee accordion cards */}
              {allPayrollData.map((emp) => {
                const isExpanded = !!expandedEmployees[emp.employee_id];
                const payload = employeePayloads[emp.employee_id];
                const finalPay = parseFloat(payload?.total_pay_salary || 0);
                const hasUnsaved = !!unsavedByEmployee[emp.employee_id];
                const hasEdit = payload?.hasAnyEdit;
                const missingRemark = hasEdit && !payload?.editRemark?.trim();

                return (
                  <div key={emp.employee_id} className={`bg-[var(--color-bg-secondary)] rounded-xl border-2 overflow-hidden shadow-sm transition-all ${hasUnsaved ? 'border-yellow-400' : missingRemark ? 'border-orange-400' : 'border-[var(--color-border-primary)]'}`}>
                    {/* Accordion header */}
                    <button
                      onClick={() => toggleEmployee(emp.employee_id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--color-bg-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${isExpanded ? 'bg-[var(--color-primary-lighter)]' : 'bg-[var(--color-bg-gray-light)]'}`}>
                          <User className={`w-5 h-5 ${isExpanded ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-text-secondary)]'}`} />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-[var(--color-text-primary)] text-base">{emp.employee_name}</div>
                          <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Employee ID: {emp.employee_id}</div>
                        </div>
                        {/* Status badges */}
                        <div className="flex items-center gap-2 ml-2">
                          {hasUnsaved && <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full">Unsaved edits</span>}
                          {!hasUnsaved && hasEdit && !missingRemark && <span className="text-xs bg-primary-100 text-primary-700 border border-primary-300 px-2 py-0.5 rounded-full">Edited</span>}
                          {missingRemark && !hasUnsaved && <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full">Missing remark</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-[var(--color-text-secondary)]">Final Payable</div>
                          <div className="text-lg font-bold text-green-700">₹{finalPay.toLocaleString()}</div>
                        </div>
                        {isExpanded
                          ? <ChevronUp className="w-5 h-5 text-[var(--color-text-secondary)]" />
                          : <ChevronDown className="w-5 h-5 text-[var(--color-text-secondary)]" />
                        }
                      </div>
                    </button>

                    {/* Accordion body — always mounted to preserve state, hidden via CSS when collapsed */}
                    <div className={`border-t border-[var(--color-border-primary)] ${isExpanded ? 'block' : 'hidden'}`}>
                      <EmployeePayrollBlock
                        empData={emp}
                        permissions={permissions}
                        onDataChange={handleDataChange}
                        onUnsavedChange={handleUnsavedChange}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Submit all section */}
              <div className="bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] rounded-xl p-8 border-2 border-[var(--color-border-primary)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Ready to Submit Payroll?</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {allPayrollData.length} employee(s) · Total payable: <strong className="text-green-700">₹{totalFinalPayable.toLocaleString()}</strong>
                    </p>
                    {hasAnyUnsaved && <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Save all pending edits first</p>}
                    {missingRemarks.length > 0 && <p className="text-xs text-orange-700 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Add remarks for all edited employees</p>}
                  </div>
                  {permissions['add_salary_payment'] && (
                    <button
                      onClick={handleSubmitPayroll}
                      disabled={submitting || hasAnyUnsaved || missingRemarks.length > 0}
                      className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors ${submitting || hasAnyUnsaved || missingRemarks.length > 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      {submitting ? 'Submitting...' : 'Submit All Payroll'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Confirm dialog */}
      {confirmModal.isOpen && (
        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false })}
          onConfirm={confirmSubmitPayroll}
          title="Confirm Payroll Submission"
          message={
            <div>
              <p className="mb-4">You are about to submit payroll for <strong>{allPayrollData.length} employee(s)</strong> for <strong>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>.</p>
              <div className="bg-[var(--color-primary-lightest)] p-4 rounded space-y-2 text-sm max-h-64 overflow-y-auto">
                {allPayrollData.map(emp => {
                  const payload = employeePayloads[emp.employee_id] || {};
                  return (
                    <div key={emp.employee_id} className="flex justify-between border-b pb-1 last:border-b-0">
                      <span className="text-[var(--color-text-secondary)]">{emp.employee_name}</span>
                      <span className="font-bold text-green-800">₹{parseFloat(payload.total_pay_salary || 0).toLocaleString()}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 border-t-2 bg-green-50 p-2 rounded">
                  <span className="font-bold text-green-800">Total Payable</span>
                  <span className="font-bold text-green-900">₹{totalFinalPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          }
          confirmText="Submit Payroll"
          cancelText="Cancel"
          type="warning"
        />
      )}
    </>
  );
};

export default MonthlyPayroll;