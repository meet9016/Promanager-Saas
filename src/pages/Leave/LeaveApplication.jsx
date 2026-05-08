import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import { format } from "date-fns";
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"

const LeaveApplication = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        user_id: '',
        employee_id: '',
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    // eslint-disable-next-line no-unused-vars
    const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    const employeeDropdownRef = useRef(null);

    // Set user_id from auth context
    useEffect(() => {
        if (user && user.user_id) {
            setFormData(prev => ({ ...prev, user_id: user.user_id }));
        }
    }, [user]);

    // Fetch employees and leave types on component mount
    useEffect(() => {
        if (formData.user_id) {
            fetchEmployees();
        }
        // Fetch leave types immediately as it doesn't need user_id
        fetchLeaveTypes();
    }, [formData.user_id]);

    // Filter employees based on search
    useEffect(() => {
        if (employeeSearch) {
            const filtered = employees.filter(emp =>
                emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase())
            );
            setFilteredEmployees(filtered);
        } else {
            setFilteredEmployees(employees);
        }
    }, [employeeSearch, employees]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target)) {
                setShowEmployeeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchEmployees = async () => {
        try {
            if (!formData.user_id) {
                throw new Error('User ID is required');
            }

            const formDataToSend = new FormData();

            const response = await api.post('/assign_shift_list_drop_down', formDataToSend);

            if (response.data.success && response.data.data.employee_list) {
                setEmployees(response.data.data.employee_list);
                setFilteredEmployees(response.data.data.employee_list);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            setNotification({
                show: true,
                type: 'error',
                message: error.message || 'Failed to fetch employee list'
            });
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const response = await api.post('/leave_type_drop_down');

            if (response.data.success && response.data.data.leave_type_list) {
                // Get leave_type_list from the response
                const leaveTypeData = response.data.data.leave_type_list || [];
                setLeaveTypes(Array.isArray(leaveTypeData) ? leaveTypeData : []);
            } else {
                setLeaveTypes([]);
            }
        } catch (error) {
            console.error('Error fetching leave types:', error);
            setLeaveTypes([]); // Set empty array on error
            setNotification({
                show: true,
                type: 'error',
                message: error.message || 'Failed to fetch leave types'
            });
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEmployeeSearch = (e) => {
        const value = e.target.value;
        setEmployeeSearch(value);
        setSelectedEmployeeName(value);
        setShowEmployeeDropdown(true);

        // Clear employee_id if search is cleared
        if (!value) {
            setFormData({ ...formData, employee_id: '' });
        }
    };

    const selectEmployee = (employee) => {
        setFormData({ ...formData, employee_id: employee.employee_id });
        setSelectedEmployeeName(employee.full_name);
        setEmployeeSearch(employee.full_name);
        setShowEmployeeDropdown(false);
    };

    const formatDateForAPI = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Handle start date change and clear end date if it's before the new start date
    const handleStartDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            start_date: date,
            // Clear end date if it's before the new start date
            end_date: prev.end_date && date && prev.end_date < date ? '' : prev.end_date
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.employee_id) {
            setNotification({
                show: true,
                type: 'error',
                message: 'Please select an employee'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('employee_id', formData.employee_id);
            submitData.append('leave_type', formData.leave_type);
            submitData.append('start_date', formatDateForAPI(formData.start_date));
            submitData.append('end_date', formatDateForAPI(formData.end_date));
            submitData.append('reason', formData.reason);

            const response = await api.post('/add_leave', submitData);

            setNotification({
                show: true,
                type: 'success',
                message: response.data.message || 'Leave request submitted successfully!'
            });

            // Reset form
            setFormData({
                user_id: user.user_id,
                employee_id: '',
                leave_type: '',
                start_date: '',
                end_date: '',
                reason: ''
            });
            setSelectedEmployeeName('');
            setEmployeeSearch('');

        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit leave request'
            });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 5000);
        }
    };

    const resetForm = () => {
        setFormData({
            user_id: user?.user_id || '',
            employee_id: '',
            leave_type: '',
            start_date: '',
            end_date: '',
            reason: ''
        });
        setSelectedEmployeeName('');
        setEmployeeSearch('');
    };

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isLoadingData) {
        return (
            <div>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] py-8 px-4">
            <div className="p-8 max-w-3xl mx-auto">
                <div className="bg-[var(--color-bg-secondary)] shadow-lg rounded-lg overflow-hidden">
                    <div className="bg-[var(--color-primary-dark)] py-4 px-6">
                        <h2 className="text-xl font-bold text-[var(--color-text-white)]">Apply for Leave</h2>
                    </div>

                    {notification.show && (
                        <div className={`mx-6 mt-4 px-4 py-3 text-sm font-medium rounded-md ${notification.type === 'success'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-[var(--color-error-light)] text-[var(--color-error-dark)] border border-red-300'
                            }`}>
                            {notification.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 space-y-7">
                        {/* Employee Selection with Search */}
                        <div className="space-y-2" ref={employeeDropdownRef}>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Select Employee <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={employeeSearch}
                                    onChange={handleEmployeeSearch}
                                    onFocus={() => setShowEmployeeDropdown(true)}
                                    placeholder="Search and select employee"
                                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                    required
                                />

                                {showEmployeeDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredEmployees.length > 0 ? (
                                            filteredEmployees.map((employee) => (
                                                <div
                                                    key={employee.employee_id}
                                                    onClick={() => selectEmployee(employee)}
                                                    className="px-3 py-2 hover:bg-[var(--color-primary-lightest)] cursor-pointer border-b border-[var(--color-border-primary)] last:border-b-0"
                                                >
                                                    <div className="font-medium text-[var(--color-text-primary)]">{employee.full_name}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-[var(--color-text-secondary)]">No employees found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Leave Type Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Leave Type <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <select
                                name="leave_type"
                                value={formData.leave_type}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                            >
                                <option value="">Select leave type</option>
                                {Array.isArray(leaveTypes) && leaveTypes.map((leaveType) => (
                                    <option key={leaveType.leave_type_id} value={leaveType.leave_type_id}>
                                        {leaveType.leave_type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Start Date *</label>
                                <DatePicker
                                    selected={formData.start_date}
                                    onChange={handleStartDateChange}
                                    minDate={today}
                                    placeholderText="DD-MM-YYYY"
                                    dateFormat="dd-MM-yyyy"
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">End Date *</label>
                                <DatePicker
                                    selected={formData.end_date}
                                    onChange={(date) => setFormData({ ...formData, end_date: date })}
                                    minDate={formData.start_date || today}
                                    placeholderText="DD-MM-YYYY"
                                    dateFormat="dd-MM-yyyy"
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                        </div>


                        {/* Reason */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Reason for Leave <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                                rows="4"
                                className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                placeholder="Please provide details about your leave request"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end pt-4 space-x-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-gradient-start)] hover:bg-[var(--color-bg-gray-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-[var(--color-text-white)] bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LeaveApplication;