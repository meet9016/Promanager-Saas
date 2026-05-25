import { useState, useEffect } from "react";

import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';
import { Trash2, IndianRupee } from "lucide-react";
import { Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosInstance";
import CustomSelect from "../comman/CustomSelect";
import CustomDatePicker from '../comman/CustomDatePicker';

const Increment = () => {

    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    const { user, isAuthenticated } = useAuth();
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
    const [employeeId, setEmployeeId] = useState();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [dropdownOptions, setDropdownOptions] = useState([])
    const [salaryTypeList, setSalaryTypeList] = useState([])
    const [incrementList, setIncrementList] = useState([])

    // Fetch  employee dropdown data
    useEffect(() => {
        const fetchEmployeeList = async () => {
            try {
                // Check if user is authenticated and has user_id
                if (!isAuthenticated() || !user?.user_id) {
                    setToast({
                        message: 'User authentication required. Please login again.',
                        type: 'error'
                    });
                    setIsLoadingDropdowns(false);
                    return;
                }

                setIsLoadingDropdowns(true);

                const formData = new FormData();

                const response = await api.post('/increment_employee_list', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (response.data.success) {
                    const data = response.data.data.employee_list;
                    setDropdownOptions(data);
                } else {
                    setToast({
                        message: response.data.message || 'Failed to load employee dropdown options.',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('Error fetching employee dropdown data:', error);
                setToast({
                    message: 'Failed to load employee dropdown options. Please refresh the page.',
                    type: 'error'
                });
            } finally {
                setIsLoadingDropdowns(false);
            }
        };

        fetchEmployeeList();
    }, [user, isAuthenticated]);

    useEffect(() => {
        const fetchIncrementData = async () => {
            if (!employeeId) return
            try {
                // Check if user is authenticated and has user_id
                if (!isAuthenticated() || !user?.user_id) {
                    setToast({
                        message: 'User authentication required. Please login again.',
                        type: 'error'
                    });
                    setIsLoadingDropdowns(false);
                    return;
                }

                setIsLoadingDropdowns(true);

                const formData = new FormData();
                formData.append('employee_id', employeeId);

                const response = await api.post('/increment_list', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data.success) {
                    setIncrementList(response.data.data.salary_list)
                    setSalaryTypeList(response.data.data.salary_type_list)

                } else {
                    setToast({
                        message: response.data.message || 'Failed to load dropdown options.',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
                setToast({
                    message: 'Failed to load dropdown options. Please refresh the page.',
                    type: 'error'
                });
            } finally {
                setIsLoadingDropdowns(false);
            }
        };

        fetchIncrementData();
    }, [user, isAuthenticated, employeeId]);


    const getValidDate = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    };
    const formatLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const handleAddIncrement = () => {
        if (!employeeId) {
            setToast({ message: "Select employee first", type: "error" });
            return;
        }

        const today = formatLocalDate(new Date());

        setIncrementList(prev => {
            const updated = [...prev];

            updated.push({
                user_id: user.user_id,
                employee_id: employeeId,
                salary_type_id: "",
                starting_date: today,
                ending_date: "",
                salary: ""
            });

            return updated;
        });
    };

    const removeIncrement = (index) => {
        setIncrementList(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (index > 0 && updated[index - 1]) {
                updated[index - 1] = {
                    ...updated[index - 1],
                    ending_date: updated[index]?.starting_date || ""
                };
            }

            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!employeeId) {
            setToast({ message: "Employee is required", type: "error" });
            return;
        }

        if (!incrementList || incrementList.length === 0) {
            setToast({ message: "Add at least one increment", type: "error" });
            return;
        }

        for (let i = 0; i < incrementList.length; i++) {
            const item = incrementList[i];

            if (!item.salary) {
                setToast({ message: `Salary is required (row ${i + 1})`, type: "error" });
                return;
            }

            if (!item.salary_type_id) {
                setToast({ message: `Salary type is required (row ${i + 1})`, type: "error" });
                return;
            }

            if (!item.starting_date) {
                setToast({ message: `Start date is required (row ${i + 1})`, type: "error" });
                return;
            }


            if (i > 0) {
                const prev = incrementList[i - 1];

                if (prev.ending_date && prev.ending_date > item.starting_date) {
                    setToast({
                        message: `Invalid date flow between row ${i} and ${i + 1}`,
                        type: "error"
                    });
                    return;
                }
            }
        }
        if (!incrementList) {
            setToast({ message: "Select employee first", type: "error" });
            return;
        }

        try {
            // Check if user is authenticated and has user_id
            if (!isAuthenticated() || !user?.user_id) {
                setToast({
                    message: 'User authentication required. Please login again.',
                    type: 'error'
                });

                return;
            }
            if (isSubmitting) return;

            setIsSubmitting(true)


            const formData = new FormData();
            formData.append('employee_id', employeeId);

            incrementList.forEach((increment) => {
                formData.append('salary_type_id[]', increment.salary_type_id || "");
                formData.append('starting_date[]', increment.starting_date || "");
                formData.append('ending_date[]', increment.ending_date || "");
                formData.append('salary[]', increment.salary || "");
            });



            const response = await api.post('/employee_increment', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setToast({
                    message: response.data.message || 'add increment successfully.',
                    type: 'success'
                });
            } else {
                setToast({
                    message: response.data.message || 'Failed to add increment.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            setToast({
                message: 'Failed to load dropdown options. Please refresh the page.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className=" mx-auto  ">


                {/* Main Content */}
                <div className="space-y-8 ">
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-visible w-full relative">
                        <div className="relative ">
                            <div className="bg-[var(--color-primary-dark)] px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg">
                                        <IndianRupee className="w-5 h-5 text-[var(--color-text-white)]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-white)]">
                                        Increments
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-[var(--color-bg-secondary)] flex flex-col gap-4 rounded-b-xl">
                            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-visible w-full relative">
                                <div className="p-8 bg-[var(--color-bg-secondary)]  box-border rounded-xl">
                                    <div className="flex w-full flex-row items-center justify-between mb-4">
                                        <div className="space-y-2" >
                                            <label htmlFor="allowanceName" className=" text-sm font-medium text-[var(--color-text-secondary)] mb-2 ">
                                                Select Employee <span className="text-[var(--color-error)]">*</span>
                                            </label>

                                            {/* <select
                                                name="employmentType"

                                                className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                onChange={(e) => setEmployeeId(e.target.value)}
                                            >
                                                <option value="">Select Employe</option>
                                                {dropdownOptions.map(option => (
                                                    <option key={option.employee_id} value={option.employee_id}>{option.full_name}</option>
                                                ))}

                                            </select> */}

                                            <div className="w-[500px] relative z-50">
                                                <CustomSelect
                                                    name="employmentType"
                                                    value={employeeId}
                                                    onChange={(e) => setEmployeeId(e.target.value)}
                                                    options={dropdownOptions.map(option => ({
                                                        value: option.employee_id,
                                                        label: option.full_name,
                                                    }))}
                                                    placeholder="Select Employee"
                                                    required
                                                    searchable={true}

                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAddIncrement}
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] font-medium rounded-lg hover:bg-[var(--color-primary-darker)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Increment

                                        </button>
                                    </div>

                                    {incrementList && incrementList.map((item, index) => {
                                        return (

                                            <div key={index} className="border border-[var(--color-border-primary)] my-4 rounded-lg p-4 bg-[var(--color-bg-card)]">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                                                        Increment
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeIncrement(index)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                                        title="Remove this allowance"
                                                    >
                                                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>

                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                                            Salary <span className="text-[var(--color-error)]">*</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item?.salary || ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setIncrementList(prev =>
                                                                    prev.map((row, i) =>
                                                                        i === index ? { ...row, salary: value } : row
                                                                    )
                                                                );
                                                            }}
                                                            className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Salary Type <span className="text-[var(--color-error)]">*</span></label>
                                                        {/* <select
                                                            className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                            required
                                                            value={item?.salary_type_id || ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setIncrementList(prev =>
                                                                    prev.map((row, i) =>
                                                                        i === index ? { ...row, salary_type_id: value } : row
                                                                    )
                                                                );
                                                            }}

                                                        >
                                                            <option value="">Select Salary Type</option>
                                                            {salaryTypeList.map(option => (
                                                                <option key={option.salary_type_id} value={option.salary_type_id}>{option.name}</option>
                                                            ))}


                                                        </select> */}
                                                        <CustomSelect
                                                            name="salary_type_id"
                                                            value={item?.salary_type_id || ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value;

                                                                setIncrementList(prev =>
                                                                    prev.map((row, i) =>
                                                                        i === index
                                                                            ? { ...row, salary_type_id: value }
                                                                            : row
                                                                    )
                                                                );
                                                            }}
                                                            options={salaryTypeList.map(option => ({
                                                                value: option.salary_type_id,
                                                                label: option.name,
                                                            }))}
                                                            placeholder="Select Salary Type"
                                                            required
                                                            searchable={true}
                                                        />

                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Start Date <span className="text-[var(--color-error)]">*</span></label>
                                                        <CustomDatePicker
                                                            name="starting_date"
                                                            value={item?.starting_date || ""}
                                                            placeholder="DD-MM-YYYY"
                                                            onChange={(e) => {
                                                                const formatted = e.target.value;
                                                                if (!formatted) return;

                                                                const prevDate = new Date(formatted);
                                                                prevDate.setDate(prevDate.getDate() - 1);
                                                                const prevFormatted = formatLocalDate(prevDate);

                                                                setIncrementList(prev => {
                                                                    const updated = [...prev];

                                                                    updated[index] = {
                                                                        ...updated[index],
                                                                        starting_date: formatted
                                                                    };

                                                                    if (index > 0) {
                                                                        updated[index - 1] = {
                                                                            ...updated[index - 1],
                                                                            ending_date: prevFormatted
                                                                        };
                                                                    }

                                                                    return updated;
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">End Date </label>

                                                        <CustomDatePicker
                                                            name="ending_date"
                                                            value={item?.ending_date || ""}
                                                            placeholder="DD-MM-YYYY"
                                                            disabled={index === incrementList.length - 1}
                                                            onChange={(e) => {
                                                                const formatted = e.target.value;
                                                                if (!formatted) return;

                                                                setIncrementList(prev =>
                                                                    prev.map((row, i) =>
                                                                        i === index ? { ...row, ending_date: formatted } : row
                                                                    )
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                {index === incrementList.length - 1 && (

                                                    // <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg border border-[var(--color-border-primary)] p-8">
                                                    <div className="flex gap-4 justify-end mt-10">
                                                        <button
                                                            type="button"
                                                            className="px-6 py-3 border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleSubmit}
                                                            className="px-8 py-3 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] rounded-lg hover:from-[var(--color-primary-darker)] hover:to-[var(--color-primary-darkest)] transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {isSubmitting && (
                                                                <div className="w-4 h-4 border-2 border-[var(--color-border-primary)] border-t-transparent rounded-full animate-spin"></div>
                                                            )}
                                                            {isSubmitting ?
                                                                'Please wait' : 'Submit'
                                                            }
                                                        </button>
                                                    </div>
                                                    // </div>
                                                )}
                                            </div>)
                                    }
                                    )}
                                    {/* 
                                    {employeeId &&

                                        <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg border border-[var(--color-border-primary)] p-8">
                                            <div className="flex gap-4 justify-end">
                                                <button
                                                    type="button"
                                                    className="px-6 py-3 border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors font-medium"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSubmit}
                                                    className="px-8 py-3 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] rounded-lg hover:from-[var(--color-primary-darker)] hover:to-[var(--color-primary-darkest)] transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    {isSubmitting && (
                                                        <div className="w-4 h-4 border-2 border-[var(--color-border-primary)] border-t-transparent rounded-full animate-spin"></div>
                                                    )}
                                                    {isSubmitting ?
                                                        'Please wait' : 'Submit'
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    } */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default Increment;