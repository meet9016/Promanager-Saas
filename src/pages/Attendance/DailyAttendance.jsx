/* eslint-disable no-unused-vars */
// src/pages/Attendance/DailyAttendance.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  TrendingUp,
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarX,
  X,
  Loader2,
  User,
  Activity,
  Edit,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { createPortal } from 'react-dom';
import { Toast } from '../../Components/ui/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';


/** ---------- Small building blocks ---------- **/
const Th = ({ children, small, className = '' }) => (
  <th className={`px-2 sm:px-4 py-2 text-center ${small ? 'text-[11px]' : 'text-xs'} font-medium text-[var(--color-text-muted)] uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

const Td = ({ children, small, className = '', colSpan }) => (
  <td className={`px-2 sm:px-4 py-3 text-center ${small ? 'text-xs' : 'text-sm'} text-[var(--color-text-primary)] ${className}`} colSpan={colSpan}>
    {children}
  </td>
);

const SummaryCard = ({ label, value, icon: Icon, tone = 'text-[var(--color-text-primary)]', onClick, isActive = false }) => (
  <div
    onClick={onClick}
    style={isActive ? {
      outline: '2px solid #3b82f6',
      outlineOffset: '4px',
      boxShadow: '0 0 0 4px rgba(59,130,246,0.12), 0 4px 14px rgba(59,130,246,0.22)',
    } : {}}
    className={`rounded-xl p-4 sm:p-8 shadow-sm border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] transition-all duration-200 select-none
      ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold ${tone}`}>{value}</p>
      </div>
      <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${tone}`} />
    </div>
  </div>
);

const Legend = ({ color, label }) => (
  <span className="flex items-center text-xs sm:text-sm">
    <span className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 ${color}`} />
    <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden">{label.split(' ')[0]}</span>
  </span>
);

/** ---------- Mobile Card Component ---------- **/
const MobileAttendanceCard = ({ employee, onEdit, getTimeColor, getRowStyling }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeColorClass = getTimeColor(employee);

  return (
    <div className={`mb-3 rounded-lg border shadow-sm transition-all ${getRowStyling(employee.status, employee.edit_reason)}`}>
      {/* Main Card - Always Visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1 truncate">
              {employee.employee_name}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {employee.employee_code}
            </p>
          </div>
          <button className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Essential Info - Always Visible */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Clock In/Out */}
          <div className="flex items-start gap-2">
            <Clock className={`w-4 h-4 mt-0.5 ${timeColorClass} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-500 mb-0.5">In/Out</p>
              <p className={`text-xs font-medium ${timeColorClass} truncate`}>
                {employee.attandance_first_clock_in || '--'}
              </p>
              <p className={`text-xs font-medium ${timeColorClass} truncate`}>
                {employee.attandance_last_clock_out || '--'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-500 mb-1">Status</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${employee.status === 'Present'
                  ? 'bg-green-100 text-green-800'
                  : employee.status === 'Week Off'
                    ? 'bg-purple-100 text-purple-800'
                    : employee.status === 'Absent'
                      ? 'bg-red-100 text-red-800'
                      : employee.status === 'Leave'
                        ? 'bg-yellow-100 text-yellow-800'
                        : employee.status === 'Half Day'
                          ? 'bg-primary-100 text-primary-800'
                          : employee.status === 'Incomplete'
                            ? 'bg-orange-100 text-orange-800'
                            : employee.status === 'Overtime'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {employee.status || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Late / Early Going quick indicators — always visible */}
        {(employee.is_late || employee.is_early_going) && employee.attandance_first_clock_in && (
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {employee.is_late && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                <Clock className="w-2.5 h-2.5" />
                Late {employee.late_coming_time ? `· ${employee.late_coming_time}` : ''}
              </span>
            )}
            {employee.is_early_going && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                <LogOut className="w-2.5 h-2.5" />
                Early Out {employee.early_going_time ? `· ${employee.early_going_time}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Edit Indicator */}
        {employee.edit_reason && employee.edit_reason.trim() && (
          <div className="flex items-center gap-1 text-xs text-[var(--color-primary-darker)] mt-2">
            <span className="w-2 h-2 bg-[var(--color-primary-dark)] rounded-full animate-pulse" />
            <span>Edited</span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t bg-gray-50 p-4 space-y-3">
          {/* Shift Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Shift</p>
              <p className="text-xs font-medium truncate">{employee.shift_name || '--'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Shift Time</p>
              <p className="text-xs font-medium">
                {employee.shift_from_time && employee.shift_to_time
                  ? `${employee.shift_from_time} - ${employee.shift_to_time}`
                  : '--'}
              </p>
            </div>
          </div>

          {/* Hours Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Working Hours</p>
              <p className="text-xs font-medium">{employee.shift_working_hours || '--'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Attendance Hours</p>
              <p className="text-xs font-medium">{employee.attandance_hours || '--'}</p>
            </div>
          </div>

          {/* Late Coming & Early Going */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Late Coming</p>
              {!employee.attandance_first_clock_in ? (
                <span className="text-xs text-gray-400">--</span>
              ) : employee.is_late ? (
                <div className="flex flex-col gap-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 w-fit">
                    <Clock className="w-2.5 h-2.5 mr-0.5" /> Late
                  </span>
                  <span className="text-xs font-medium text-amber-700">{employee.late_coming_time || '--'}</span>
                </div>
              ) : (
                <span className="text-xs font-medium text-green-600">On Time</span>
              )}
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Early Going</p>
              {employee.is_early_going ? (
                <div className="flex flex-col gap-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 w-fit">
                    <LogOut className="w-2.5 h-2.5 mr-0.5" /> Early
                  </span>
                  <span className="text-xs font-medium text-teal-700">{employee.early_going_time || '--'}</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">--</span>
              )}
            </div>
          </div>

          {/* Late Hours & OT Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Late Hours</p>
              <p className={`text-xs font-medium ${parseFloat(employee.late_hours || 0) > 0 ? 'text-[var(--color-warning-dark)]' : ''}`}>
                {employee.late_hours && parseFloat(employee.late_hours) > 0 ? employee.late_hours : '--'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">OT Hours</p>
              <p className={`text-xs font-medium ${parseFloat(employee.overtime_hours || 0) > 0 ? 'text-[var(--color-primary-dark)]' : ''}`}>
                {employee.overtime_hours && parseFloat(employee.overtime_hours) > 0 ? employee.overtime_hours : '--'}
              </p>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(employee);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
          >
            <Edit className="h-4 w-4" />
            Edit Attendance
          </button>
        </div>
      )}
    </div>
  );
};

const EditAttendanceModal = ({ employee, onClose, onSave }) => {
  const [clockEntries, setClockEntries] = useState([]);
  const [editReason, setEditReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });
  const closeToast = () => setToast(null);

  const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const parseDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatToDDMMYYYY = (date) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const convertToTimeObject = (dateTimeStr) => {
    if (!dateTimeStr) return { hours: "", minutes: "", period: "AM" };
    const match = dateTimeStr.match(/^(\d{2}-\d{2}-\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return { hours: "", minutes: "", period: "AM" };
    const hours = match[2].padStart(2, '0');
    const minutes = match[3].padStart(2, '0');
    const period = match[4].toUpperCase();
    return { hours, minutes, period };
  };

  const timeToMinutes = (timeObj, dateObj) => {
    if (!timeObj.hours || !timeObj.minutes || !dateObj) return null;
    let hours = parseInt(timeObj.hours, 10);
    const minutes = parseInt(timeObj.minutes, 10);
    if (timeObj.period === "PM" && hours !== 12) hours += 12;
    if (timeObj.period === "AM" && hours === 12) hours = 0;
    const date = new Date(dateObj);
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  };

  const formatDisplayTime = (timeObj) => {
    if (!timeObj.hours || !timeObj.minutes) return "--:-- --";
    return `${timeObj.hours}:${timeObj.minutes} ${timeObj.period}`;
  };

  const formatDateTimeForAPI = (dateObj, timeObj) => {
    if (!dateObj || !timeObj.hours || !timeObj.minutes) return "";
    const dateStr = formatToDDMMYYYY(dateObj);
    return `${dateStr} ${timeObj.hours}:${timeObj.minutes} ${timeObj.period}`;
  };

  const validateEntries = () => {
    if (clockEntries.length === 0) {
      showToast("Please add at least one clock entry", 'error');
      return false;
    }
    for (let i = 0; i < clockEntries.length; i++) {
      const entry = clockEntries[i];
      if (!entry.date) { showToast(`Entry ${i + 1}: Please select a date`, 'error'); return false; }
      if (!entry.time.hours || !entry.time.minutes) { showToast(`Entry ${i + 1}: Please select time`, 'error'); return false; }
      const entryDate = entry.date;
      if (minDate && entryDate < minDate) { showToast(`Entry ${i + 1}: Date cannot be before ${formatToDDMMYYYY(minDate)}`, 'error'); return false; }
      if (maxDate && entryDate > maxDate) { showToast(`Entry ${i + 1}: Date cannot be after ${formatToDDMMYYYY(maxDate)}`, 'error'); return false; }
      if (i > 0) {
        const prevEntry = clockEntries[i - 1];
        const prevTimestamp = timeToMinutes(prevEntry.time, prevEntry.date);
        const currentTimestamp = timeToMinutes(entry.time, entry.date);
        if (currentTimestamp <= prevTimestamp) { showToast(`Entry ${i + 1}: Time must be after Entry ${i}`, 'error'); return false; }
      }
    }
    for (let i = 0; i < clockEntries.length; i++) {
      const expectedType = i % 2 === 0 ? "IN" : "OUT";
      if (clockEntries[i].type !== expectedType) { showToast(`Entry ${i + 1}: Must be "${expectedType}" (entries must alternate IN/OUT)`, 'error'); return false; }
    }
    return true;
  };

  useEffect(() => {
    if (employee?.edit_reason) setEditReason(employee.edit_reason);
    const minShiftDate = parseDDMMYYYY(employee?.shift_from_date);
    const maxShiftDate = parseDDMMYYYY(employee?.shift_to_date);
    let editAllowedAfter = null;
    if (maxShiftDate) {
      editAllowedAfter = new Date(maxShiftDate);
      editAllowedAfter.setDate(editAllowedAfter.getDate() + 1);
    }
    setMinDate(minShiftDate);
    setMaxDate(maxShiftDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const canEdit = editAllowedAfter && today >= editAllowedAfter;
    if (!canEdit && editAllowedAfter) {
      showToast(`Editing will be available from ${formatToDDMMYYYY(editAllowedAfter)}`, 'info');
      setIsEditMode(false);
    }
    if (employee?.attendance_history?.length > 0) {
      setClockEntries(
        employee.attendance_history.map((entry, idx) => {
          const dateMatch = entry.clock_date_time?.match(/^(\d{2}-\d{2}-\d{4})/);
          const dateStr = dateMatch ? dateMatch[1] : employee?.attendance_date || "";
          const dateObj = parseDDMMYYYY(dateStr);
          return {
            id: entry.clock_date_time_id || `existing-${idx}`,
            clock_date_time_id: entry.clock_date_time_id,
            date: dateObj,
            time: convertToTimeObject(entry.clock_date_time),
            type: idx % 2 === 0 ? "IN" : "OUT",
            isExisting: true,
          };
        })
      );
    } else {
      setClockEntries([]);
    }
  }, [employee]);

  const updateDate = (id, newDate) => {
    setClockEntries((prev) => prev.map((entry) => entry.id === id ? { ...entry, date: newDate } : entry));
  };

  const updateTime = (id, field, value) => {
    setClockEntries((prev) => prev.map((entry) => entry.id === id ? { ...entry, time: { ...entry.time, [field]: value } } : entry));
  };

  const addNewEntry = () => {
    const lastEntry = clockEntries[clockEntries.length - 1];
    const nextType = lastEntry?.type === "IN" ? "OUT" : "IN";
    const date = lastEntry?.date || (() => {
      const attendanceDate = employee?.attendance_date || new Date().toISOString().split('T')[0];
      const [year, month, day] = attendanceDate.split('-');
      return new Date(year, month - 1, day);
    })();
    let newTime = { hours: "11", minutes: "00", period: "AM" };
    if (lastEntry?.time.hours && lastEntry?.time.minutes) {
      let hours = parseInt(lastEntry.time.hours, 10);
      const minutes = lastEntry.time.minutes;
      const period = lastEntry.time.period;
      hours += 1;
      if (hours > 12) hours = 1;
      if (hours === 12 && period === "AM") newTime = { hours: String(hours).padStart(2, '0'), minutes, period: "PM" };
      else if (hours === 13) newTime = { hours: "01", minutes, period: period === "AM" ? "PM" : "AM" };
      else newTime = { hours: String(hours).padStart(2, '0'), minutes, period };
    }
    setClockEntries((prev) => [...prev, { id: Date.now(), clock_date_time_id: null, date, time: newTime, type: nextType, isExisting: false }]);
  };

  const removeEntry = (id) => {
    setClockEntries((prev) => {
      const filtered = prev.filter(entry => entry.id !== id);
      return filtered.map((entry, idx) => ({ ...entry, type: idx % 2 === 0 ? "IN" : "OUT" }));
    });
  };

  const handleSubmit = async () => {
    if (!editReason.trim()) { showToast("Edit reason is required!", "error"); return; }
    if (!validateEntries()) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("attendance_date", employee?.attendance_date || "");
      formData.append("shift_assign_id", employee?.shift_assign_id || "");
      formData.append("shift_day_date_id", employee?.shift_day_date_id || "");
      formData.append("employee_id", employee?.employee_id || "");
      formData.append("edit_reason", editReason.trim());
      clockEntries.forEach((e) => {
        formData.append("clock_date_time_id[]", e.clock_date_time_id || "");
        formData.append("clock_date_time[]", formatDateTimeForAPI(e.date, e.time) || "");
      });
      await api.post("update_employee_attendance_history", formData);
      showToast("Attendance updated successfully!", "success");
      onSave();
      onClose();
    } catch (err) {
      showToast("Failed to update attendance. Try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const maxShiftDate = parseDDMMYYYY(employee?.shift_to_date);
  const editAllowedAfter = maxShiftDate ? (() => { const date = new Date(maxShiftDate); date.setDate(date.getDate() + 1); return date; })() : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canEdit = editAllowedAfter ? today >= editAllowedAfter : true;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-white truncate">Edit Attendance</h2>
            <p className="text-xs sm:text-sm text-primary-100 truncate">
              <User className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {employee?.employee_name} {employee?.employee_code ? `• ${employee.employee_code}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 rounded-md hover:bg-white/20 flex-shrink-0 ml-2">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div><p className="text-gray-500">Shift</p><p className="font-medium truncate">{employee?.shift_name || "—"}</p></div>
            <div><p className="text-gray-500">Schedule</p><p className="font-medium text-xs sm:text-sm">{employee?.shift_from_time} - {employee?.shift_to_time || "—"}</p></div>
            <div><p className="text-gray-500">Working Hours</p><p className="font-medium">{employee?.shift_working_hours || "—"}</p></div>
            <div><p className="text-gray-500">Status</p>
              <span className={`px-2 py-0.5 rounded-full text-xs ${employee?.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {employee?.status || "—"}
              </span>
            </div>
          </div>

          {/* Date Range Info */}
          {minDate && maxDate && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-primary-800 font-medium">
                <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Allowed Date Range: {formatToDDMMYYYY(minDate)} to {formatToDDMMYYYY(maxDate)}
              </p>
            </div>
          )}

          {/* Edit Reason */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              Reason for Editing <span className="text-red-500">*</span>
            </label>
            {employee?.edit_reason && !isEditMode && (
              <div className="bg-gray-50 border rounded p-2 sm:p-3 text-xs sm:text-sm text-gray-600">
                <span className="font-medium text-gray-700">Previous Reason: </span>
                {employee.edit_reason}
              </div>
            )}
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 ${!isEditMode ? "bg-gray-100 text-gray-500" : ""}`}
              rows={3}
              placeholder="Enter reason for editing this record..."
            />
            {!editReason.trim() && isEditMode && (
              <p className="text-xs text-red-600">Edit reason is required</p>
            )}
          </div>

          {/* Time Entries */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h3 className="font-medium text-sm sm:text-base">Clock Entries (Alternating IN/OUT)</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={addNewEntry}
                  disabled={!isEditMode}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md flex items-center ${isEditMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-400"}`}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Add Entry
                </button>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  disabled={!canEdit && !isEditMode}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md flex items-center ${isEditMode
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : canEdit
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                  title={!canEdit ? `Editing available from ${formatToDDMMYYYY(editAllowedAfter)}` : ""}
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {isEditMode ? "Cancel Edit" : "Enable Edit"}
                </button>
              </div>
            </div>

            {clockEntries.map((entry, idx) => (
              <div key={entry.id} className="border rounded-md p-3 sm:p-4 bg-white shadow-sm">
                <div className="flex justify-between items-center text-xs sm:text-sm mb-2 sm:mb-3">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <span className="font-medium">Entry {idx + 1}</span>
                    <span className={`px-1.5 sm:px-2 py-0.5 text-xs rounded font-semibold ${entry.type === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {entry.type}
                    </span>
                    {entry.isExisting ? (
                      <span className="px-1.5 sm:px-2 py-0.5 text-xs rounded bg-primary-100 text-primary-700">Existing</span>
                    ) : (
                      <span className="px-1.5 sm:px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">New</span>
                    )}
                  </div>
                  {isEditMode && clockEntries.length > 1 && (
                    <button onClick={() => removeEntry(entry.id)} className="text-red-600 hover:text-red-700 p-1" title="Remove entry">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs mb-1 font-medium">Date</label>
                      <DatePicker
                        selected={entry.date}
                        onChange={(date) => updateDate(entry.id, date)}
                        dateFormat="dd-MM-yyyy"
                        minDate={minDate}
                        maxDate={maxDate}
                        className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholderText="Select date"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-1 font-medium">Time</label>
                      <div className="flex gap-2">
                        <select value={entry.time.hours} onChange={(e) => updateTime(entry.id, "hours", e.target.value)} className="border rounded px-1 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm flex-1 focus:ring-2 focus:ring-primary-500">
                          <option value="">HH</option>
                          {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select value={entry.time.minutes} onChange={(e) => updateTime(entry.id, "minutes", e.target.value)} className="border rounded px-1 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm flex-1 focus:ring-2 focus:ring-primary-500">
                          <option value="">MM</option>
                          {minuteOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={entry.time.period} onChange={(e) => updateTime(entry.id, "period", e.target.value)} className="border rounded px-1 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm flex-1 focus:ring-2 focus:ring-primary-500">
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs mb-1 font-medium text-gray-600">Date</label>
                      <p className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border rounded text-xs sm:text-sm">
                        {entry.date ? formatToDDMMYYYY(entry.date) : '--'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs mb-1 font-medium text-gray-600">Time</label>
                      <p className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border rounded text-xs sm:text-sm">
                        {formatDisplayTime(entry.time)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {clockEntries.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-xs sm:text-sm">No entries yet. Click "Add Entry" to start.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 flex justify-end gap-2 sm:gap-3">
          <button onClick={onClose} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md hover:bg-gray-100">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isEditMode}
            className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (<><Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />Saving...</>) : (<><Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />Save Changes</>)}
          </button>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>,
    document.body
  );
};


/** ---------- Main Component ---------- **/
const DailyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    weekOff: 0,
    late: 0,
    overtime: 0,
    incomplete: 0,
    earlyGoing: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeFilter, setActiveFilter] = useState('total'); // 'total'|'present'|'absent'|'weekOff'|'incomplete'|'late'|'overtime'|'earlyGoing'

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showToast = (message, type = 'info') => setToast({ message, type });
  const closeToast = () => setToast(null);

  const getRowStyling = (status, editReason) => {
    if (editReason && editReason.trim()) {
      return 'bg-[var(--color-primary-lightest)] border-l-4 border-[var(--color-primary-light)] shadow-sm';
    }
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'week off':
      case 'weekoff':
        return 'bg-[var(--color-primary-lightest)] border-l-4 border-[var(--color-primary-light)]';
      case 'holiday':
        return 'bg-[var(--color-warning-light)] border-l-4 border-[var(--color-warning)]';
      case 'absent':
        return 'bg-[var(--color-error-light)] border-l-4 border-[var(--color-error)]';
      case 'leave':
        return 'bg-[var(--color-yellow-light)] border-l-4 border-[var(--color-yellow-dark)]';
      case 'half day':
        return 'bg-[var(--color-primary-lighter)] border-l-4 border-[var(--color-primary-dark)]';
      case 'overtime':
        return 'bg-[var(--color-bg-secondary)] border-l-4 border-[var(--color-primary-dark)]';
      default:
        return '';
    }
  };

  const getTimeColor = (employee) => {
    const isLate = parseFloat(employee.late_hours || 0) > 0;
    const hasOvertime = parseFloat(employee.overtime_hours || 0) > 0;
    const isWeekOff = (employee.status || '').toLowerCase() === 'week off';
    const isIncomplete = (employee.status || '').toLowerCase() === 'incomplete';
    if (isWeekOff) return 'text-[var(--color-text-primary)] font-medium';
    if (isIncomplete) return 'text-[var(--color-warning-dark)] font-medium';
    if (isLate) return 'text-[var(--color-warning-dark)] font-medium';
    if (hasOvertime) return 'text-[var(--color-primary-dark)] font-medium';
    return 'text-[var(--color-text-primary)]';
  };

  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (date) => setSelectedDate(date);

  const fetchAttendanceData = useCallback(
    async (date) => {
      if (!user?.user_id) return;
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('date', date);

        const res = await api.post('employee_attendance_list', formData);

        if (res.data?.success && res.data?.data !== undefined) {
          const data = Array.isArray(res.data.data) ? res.data.data : [];
          setAttendanceData(data);

          const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
          const total = data.length;
          const present = data.filter((e) => norm(e.status) === 'present').length;
          const weekOff = data.filter((e) => ['weekoff', 'week_off'].includes(norm(e.status))).length;
          const absent = data.filter((e) => norm(e.status) === 'absent').length;
          const incomplete = data.filter((e) => norm(e.status) === 'incomplete').length;
          const late = data.filter((e) => e.is_late === true).length;
          const overtime = data.filter((e) => parseFloat(e.overtime_hours || 0) > 0).length;
          const earlyGoing = data.filter((e) => e.is_early_going === true).length;

          setSummaryStats({ total, present, absent, weekOff, late, overtime, incomplete, earlyGoing });
        } else {
          throw new Error(res.data?.message || 'Failed to fetch attendance data');
        }
      } catch (err) {
        const msg = err.message || 'An error occurred while fetching attendance data';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [user?.user_id]
  );

  useEffect(() => {
    fetchAttendanceData(formatDate(selectedDate));
  }, [selectedDate, user?.user_id, fetchAttendanceData]);

  const filteredData = useMemo(() => {
    const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
    let data = attendanceData;

    // Apply stat card filter first
    if (activeFilter && activeFilter !== 'total') {
      switch (activeFilter) {
        case 'present':
          data = data.filter((e) => norm(e.status) === 'present');
          break;
        case 'absent':
          data = data.filter((e) => norm(e.status) === 'absent');
          break;
        case 'weekOff':
          data = data.filter((e) => ['weekoff', 'week_off'].includes(norm(e.status)));
          break;
        case 'incomplete':
          data = data.filter((e) => norm(e.status) === 'incomplete');
          break;
        case 'late':
          data = data.filter((e) => e.is_late === true);
          break;
        case 'overtime':
          data = data.filter((e) => parseFloat(e.overtime_hours || 0) > 0);
          break;
        case 'earlyGoing':
          data = data.filter((e) => e.is_early_going === true);
          break;
        default:
          break;
      }
    }

    // Apply search query on top
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data;
    return data.filter(
      (emp) =>
        emp.employee_name?.toLowerCase().includes(q) ||
        emp.employee_code?.toLowerCase().includes(q) ||
        (emp.status || '').toLowerCase().includes(q) ||
        (emp.shift_name || '').toLowerCase().includes(q)
    );
  }, [attendanceData, searchQuery, activeFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = useMemo(() => Math.max(1, Math.ceil((filteredData?.length || 0) / rowsPerPage)), [filteredData?.length]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return (filteredData || []).slice(start, end);
  }, [filteredData, currentPage]);

  const emptyRowCount = useMemo(() => {
    const count = rowsPerPage - (paginatedData?.length || 0);
    return count > 0 ? count : 0;
  }, [paginatedData]);

  useEffect(() => {
    setCurrentPage(1);
    setActiveFilter('total');
  }, [selectedDate, attendanceData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  const truncateText = useCallback((text, maxLength = 12) => {
    if (!text) return '--';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  const handleEditEmployee = (employee) => setEditingEmployee(employee);

  const handleSaveAttendance = async () => {
    try {
      showToast('Attendance updated successfully!', 'success');
      setEditingEmployee(null);
      fetchAttendanceData(formatDate(selectedDate));
    } catch (error) {
      showToast('Failed to update attendance: ' + error.message, 'error');
    }
  };

  const handleFilterClick = (filterKey) => {
    setActiveFilter((prev) => (prev === filterKey && filterKey !== 'total') ? 'total' : filterKey);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="p-3 sm:p-8  mx-auto">
        {/* Header */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl sm:rounded-2xl shadow-xl mb-4 sm:mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-4 sm:p-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 sm:gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-sm text-xs sm:text-sm flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Back</span>
                </button>
               <h1 className="text-base sm:text-2xl font-bold text-[var(--color-text-white)] truncate">Daily Attendance</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards — 8 columns on large screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <SummaryCard icon={Users} label="Total" value={summaryStats.total} tone="text-[var(--color-primary-dark)]"
            onClick={() => handleFilterClick('total')} isActive={activeFilter === 'total'} />
          <SummaryCard icon={CheckCircle} label="Present" value={summaryStats.present} tone="text-green-600"
            onClick={() => handleFilterClick('present')} isActive={activeFilter === 'present'} />
          <SummaryCard icon={XCircle} label="Absent" value={summaryStats.absent} tone="text-red-600"
            onClick={() => handleFilterClick('absent')} isActive={activeFilter === 'absent'} />
          <SummaryCard icon={CalendarX} label="Week Off" value={summaryStats.weekOff} tone="text-purple-600"
            onClick={() => handleFilterClick('weekOff')} isActive={activeFilter === 'weekOff'} />
          <SummaryCard icon={AlertCircle} label="Incomplete" value={summaryStats.incomplete} tone="text-orange-600"
            onClick={() => handleFilterClick('incomplete')} isActive={activeFilter === 'incomplete'} />
          <SummaryCard icon={Clock} label="Late" value={summaryStats.late} tone="text-amber-600"
            onClick={() => handleFilterClick('late')} isActive={activeFilter === 'late'} />
          <SummaryCard icon={TrendingUp} label="Overtime" value={summaryStats.overtime} tone="text-primary-600"
            onClick={() => handleFilterClick('overtime')} isActive={activeFilter === 'overtime'} />
          <SummaryCard icon={LogOut} label="Early Going" value={summaryStats.earlyGoing} tone="text-teal-600"
            onClick={() => handleFilterClick('earlyGoing')} isActive={activeFilter === 'earlyGoing'} />
        </div>

        {/* Main content */}
        <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-text-white)] mr-2" />
                <h3 className="text-sm sm:text-lg font-medium text-[var(--color-text-white)]">Daily Attendance Details</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Date */}
                <div className="flex items-center space-x-2 z-[40]">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-white)]" />
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="DD-MM-YYYY"
                    className="w-full bg-[var(--color-bg-secondary-20)] border border-[var(--color-bg-secondary-30)] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--color-text-white)] placeholder-[var(--color-text-white-90)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-secondary-30)]"
                  />
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-xs sm:text-sm"
                  />
                  <Search className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-[var(--color-text-muted)]" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 sm:right-3 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          {isMobile ? (
            <div className="p-3">
              {loading ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                </div>
              ) : (filteredData?.length || 0) === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">No records found</div>
              ) : (
                <>
                  {paginatedData.map((emp, idx) => (
                    <MobileAttendanceCard
                      key={emp.employee_code || idx}
                      employee={emp}
                      onEdit={handleEditEmployee}
                      getTimeColor={getTimeColor}
                      getRowStyling={getRowStyling}
                    />
                  ))}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    loading={loading}
                  />
                </>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin mr-3" />
                    <span>Loading...</span>
                  </div>
                </div>
              ) : (filteredData?.length || 0) === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">No records found</div>
              ) : (
                <>
                  <table className="w-full min-w-[1200px] border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-[var(--color-bg-gray-light)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-gray-light)]/60">
                      <tr className="border-b border-[var(--color-border-secondary)]">
                        <Th>Employee</Th>
                        <Th>Shift</Th>
                        <Th>Clock In</Th>
                        <Th>Clock Out</Th>
                        <Th>Working Hours</Th>
                        <Th>Attendance Hours</Th>
                        <Th>Remaining Hours</Th>
                        <Th>OT Hours</Th>
                        <Th>Late Coming</Th>
                        <Th>Early Going</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--color-border-secondary)]">
                      {paginatedData.map((emp, idx) => {
                        const timeColorClass = getTimeColor(emp);
                        return (
                          <tr
                            key={emp.employee_code || idx}
                            className={`hover:bg-[var(--color-bg-hover)] transition-colors ${getRowStyling(emp.status, emp.edit_reason)}`}
                          >
                            {/* Employee */}
                            <Td className="bg-inherit text-left">
                              <div className="flex flex-col items-start">
                                <span className="font-medium text-left break-words whitespace-normal" title={emp.employee_name || '--'}>
                                  {truncateText(emp.employee_name, 20)}
                                </span>
                                <span className="text-xs text-[var(--color-text-secondary)] text-left break-words whitespace-normal" title={emp.employee_code || '—'}>
                                  {truncateText(emp.employee_code, 15)}
                                </span>
                              </div>
                            </Td>

                            {/* Shift */}
                            <Td className="text-left">{emp.shift_name || '--'}</Td>

                            {/* Clock In */}
                            <Td className={`whitespace-nowrap ${timeColorClass}`}>
                              {emp.attandance_first_clock_in || '--'}
                            </Td>

                            {/* Clock Out */}
                            <Td className={`whitespace-nowrap ${timeColorClass}`}>
                              {emp.attandance_last_clock_out || '--'}
                            </Td>

                            {/* Working Hours */}
                            <Td>{emp.shift_working_hours || '--'}</Td>

                            {/* Attendance Hours */}
                            <Td>{emp.attandance_hours || '--'}</Td>

                            {/* Remaining Hours */}
                            <Td className={`${parseFloat(emp.late_hours || 0) > 0 ? 'text-[var(--color-warning-dark)] font-medium' : ''}`}>
                              {emp.late_hours && parseFloat(emp.late_hours) > 0 ? `${emp.late_hours}` : '--'}
                            </Td>

                            {/* OT Hours */}
                            <Td className={`${parseFloat(emp.overtime_hours || 0) > 0 ? 'text-[var(--color-primary-dark)] font-medium' : ''}`}>
                              {emp.overtime_hours  ? `${emp.overtime_hours}` : '--'}
                             
                            </Td>

                            {/* ---- Late Coming ---- */}
                            <Td>
                              {!emp.attandance_first_clock_in ? (
                                <span className="text-xs text-gray-400">--</span>
                              ) : emp.is_late ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 whitespace-nowrap">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Late
                                  </span>
                                  <span className="text-xs text-amber-700 font-medium">
                                    {emp.late_coming_time || '--'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">On Time</span>
                              )}
                            </Td>

                            {/* ---- Early Going ---- */}
                            <Td>
                              {emp.is_early_going ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 whitespace-nowrap">
                                    <LogOut className="w-3 h-3 mr-1" />
                                    Early
                                  </span>
                                  <span className="text-xs text-teal-700 font-medium">
                                    {emp.early_going_time || '--'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">--</span>
                              )}
                            </Td>

                            {/* Status */}
                            <Td>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${emp.status === 'Present'
                                  ? 'bg-green-100 text-green-800'
                                  : emp.status === 'Week Off'
                                    ? 'bg-purple-100 text-purple-800'
                                    : emp.status === 'Absent'
                                      ? 'bg-red-100 text-red-800'
                                      : emp.status === 'Leave'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : emp.status === 'Half Day'
                                          ? 'bg-primary-100 text-primary-800'
                                          : emp.status === 'Incomplete'
                                            ? 'bg-orange-100 text-orange-800'
                                            : emp.status === 'Overtime'
                                              ? 'bg-sky-100 text-sky-800'
                                              : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {emp.status || '--'}
                              </span>
                            </Td>

                            {/* Actions */}
                            <Td>
                              <div className="flex flex-col items-center justify-center gap-2">
                                {emp.edit_reason && emp.edit_reason.trim() && (
                                  <div className="relative flex items-center justify-center gap-1" title={`Edited: ${emp.edit_reason}`}>
                                    <span className="w-2 h-2 bg-[var(--color-primary-dark)] rounded-full animate-pulse" />
                                    <span className="text-[var(--color-primary-darker)] text-xs">Edited</span>
                                  </div>
                                )}
                                <button
                                  onClick={() => handleEditEmployee(emp)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--color-border-secondary)] text-sm hover:bg-[var(--color-bg-hover)] text-[var(--color-primary-dark)]"
                                  title="Edit attendance"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}

                      {/* Filler rows — 13 columns now */}
                      {Array.from({ length: emptyRowCount }).map((_, i) => (
                        <tr key={`empty-${i}`} className="transition-colors">
                          {Array.from({ length: 12 }).map((__, j) => (
                            <Td key={j} className="text-transparent">—</Td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    loading={loading}
                  />
                </>
              )}
            </div>
          )}

          {/* Summary legend at bottom */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
            <div className="flex justify-center sm:justify-end items-center text-xs sm:text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-4">
                <Legend color="bg-green-500" label={`Present (${summaryStats.present})`} />
                <Legend color="bg-red-500" label={`Absent (${summaryStats.absent})`} />
                <Legend color="bg-orange-500" label={`Incomplete (${summaryStats.incomplete})`} />
                <Legend color="bg-amber-500" label={`Late (${summaryStats.late})`} />
                <Legend color="bg-primary-500" label={`Overtime (${summaryStats.overtime})`} />
                <Legend color="bg-purple-600" label={`Week Off (${summaryStats.weekOff})`} />
                <Legend color="bg-teal-500" label={`Early Going (${summaryStats.earlyGoing})`} />
                <Legend color="bg-primary-400" label="Edited Entries" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Attendance Modal */}
      {editingEmployee && (
        <EditAttendanceModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleSaveAttendance}
          showToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
};

export default DailyAttendance;