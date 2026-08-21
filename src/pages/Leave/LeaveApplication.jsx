import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
// import { format } from "date-fns";
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"
import { ArrowLeft } from 'lucide-react';
import CustomInput from '../../Components/comman/CustomInput';
import CustomSelect from '../../Components/comman/CustomSelect';
import { formatToDDMMYYYY } from '../../utils/helpers';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });



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



    const fetchEmployees = async () => {
        try {
            if (!formData.user_id) {
                throw new Error('User ID is required');
            }

            const formDataToSend = new FormData();

            const response = await api.post('/assign_shift_list_drop_down', formDataToSend);

            if (response.data.success && response.data.data.employee_list) {
                setEmployees(response.data.data.employee_list);
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
            submitData.append('start_date', formatToDDMMYYYY(formData.start_date));
            submitData.append('end_date', formatToDDMMYYYY(formData.end_date));
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
            <div className=" mx-auto px-4 py-8 max-w-7xl">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-[var(--color-border-secondary)]">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[#6d28d9] py-5 px-8">
                        <h2 className="text-2xl font-black tracking-tight text-white">Apply for Leave</h2>
                    </div>

                    {notification.show && (
                        <div className={`mx-8 mt-6 px-4 py-3 text-sm font-semibold rounded-xl ${notification.type === 'success'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-[var(--color-error-light)] text-[var(--color-error-dark)] border border-red-300'
                            }`}>
                            {notification.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Employee Selection with Search */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                                Select Employee <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <div className="relative">
                                <CustomSelect
                                    name="employee_id"
                                    value={formData.employee_id}
                                    onChange={(e) => {

                                        const selectedEmployee = employees.find(
                                            (employee) =>
                                                String(employee.employee_id) === String(e.target.value)
                                        );

                                        if (!selectedEmployee) return;

                                        setFormData({
                                            ...formData,
                                            employee_id: selectedEmployee.employee_id,
                                        });

                                    }}
                                    placeholder="Search and select employee"
                                    searchable={true}
                                    required
                                    options={employees.map((employee) => ({
                                        value: employee.employee_id,
                                        label: employee.full_name,
                                    }))}
                                />

                            </div>
                        </div>

                        {/* Leave Type Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                                Leave Type <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <CustomSelect
                                name="leave_type"
                                value={formData.leave_type}
                                onChange={handleChange}
                                options={
                                    Array.isArray(leaveTypes)
                                        ? leaveTypes.map((leaveType) => ({
                                            value: leaveType.leave_type_id,
                                            label: leaveType.leave_type,
                                        }))
                                        : []
                                }
                                placeholder="Select leave type"
                                required
                                searchable={true}
                            />
                        </div>

                        {/* <div className="grid md:grid-cols-2 gap-6"> */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)]">Start Date *</label>
                            <CustomDatePicker
                                name="start_date"
                                value={formData.start_date}
                                onChange={(e) => handleStartDateChange(new Date(e.target.value))}
                                minDate={today}
                                placeholder="DD-MM-YYYY"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)]">End Date *</label>
                            <CustomDatePicker
                                name="end_date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: new Date(e.target.value) })}
                                minDate={formData.start_date || today}
                                placeholder="DD-MM-YYYY"
                            />
                        </div>
                        {/* </div> */}


                        {/* Reason */}
                        <div className="space-y-2 md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-semibold text-[var(--color-text-primary)]">
                                Reason for Leave <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                placeholder="Please provide details about your leave request"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="md:col-span-3 flex items-center justify-end pt-4 space-x-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-gradient-start)] hover:bg-[var(--color-bg-gray-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
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