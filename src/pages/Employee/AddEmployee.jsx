import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft, User, EyeOff, CreditCard, FileText, Phone, Calendar, Users, Edit, Lock, Eye } from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../Components/ui/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';

const AddEmployee = () => {
    const { employeeId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const editEmployeeId = employeeId || queryParams.get('edit');
    const isEditMode = Boolean(editEmployeeId);
    const [toast, setToast] = useState(null);
    const permissions = useSelector(state => state.permissions) || {};

    const [documentType, setDocumentType] = useState()

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        employeeCode: '',
        name: '',
        email: '',
        gender: '',
        branch: '',
        department: '',
        designation: '',
        employmentType: '',
        attendanceType: '1', // always '1' (app/mobile), hidden from UI
        salaryType: '',
        company: '',
        salary: '',
        allowances: [],
        deductions: [],
        address: '',
        bankName: '',
        branchName: '',
        accountNo: '',
        ifscCode: '',
        documentType: [],
        documents: [],
        aadharCard: null,
        drivingLicence: null,
        panCard: null,
        photo: null,
        emergencyContactNo: '',
        contactPersonName: '',
        relation: '',
        emergencyAddress: '',
        dateOfBirth: null,
        dateOfJoining: null,
        references: [{ name: '', contactNumber: '' }],
        mobile: '',
        password: '',
    });

    const { user, isAuthenticated } = useAuth();

    const [expandedSections, setExpandedSections] = useState({
        basicDetails: true,
        salaryStructure: false,
        bankDetails: false,
        legalDocuments: false,
        Documents: false,
        contactInformation: false,
        reference: false
    });

    const [filePreviews, setFilePreviews] = useState({
        aadharCard: null,
        drivingLicence: null,
        panCard: null,
        photo: null
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
    const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(false);

    const [dropdownOptions, setDropdownOptions] = useState({
        genderOptions: [],
        branchOptions: [],
        departmentOptions: [],
        designationOptions: [],
        employmentTypeOptions: [],
        salaryTypeOptions: [],
        relationOptions: [],
        allowanceOptions: [],
        companyOptions: [],
        deductionOptions: [],
        attendanceTypeOptions: [],
        documentOptions: []
    });

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                if (!isAuthenticated() || !user?.user_id) {
                    setToast({ message: 'User authentication required. Please login again.', type: 'error' });
                    setIsLoadingDropdowns(false);
                    return;
                }

                setIsLoadingDropdowns(true);

                const formData = new FormData();

                const response = await api.post('/employee_drop_down_list', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.success) {
                    const data = response.data.data;

                    const dropdownData = {
                        companyOptions: data.company_list?.map(item => ({ value: item.company_id, label: item.company_name })) || [],
                        genderOptions: data.gender_list?.map(item => ({ value: item.gender_id, label: item.name })) || [],
                        branchOptions: data.branch_list?.map(item => ({ value: item.branch_id, label: item.name })) || [],
                        departmentOptions: data.department_list?.map(item => ({ value: item.department_id, label: item.name })) || [],
                        designationOptions: data.designation_list?.map(item => ({ value: item.designation_id, label: item.name })) || [],
                        employmentTypeOptions: data.employee_type_list?.map(item => ({ value: item.employee_type_id, label: item.name })) || [],
                        salaryTypeOptions: data.salary_type_list?.map(item => ({ value: item.salary_type_id, label: item.name })) || [],
                        relationOptions: data.relation_list?.map(item => ({ value: item.relation_id, label: item.name })) || [],
                        allowanceOptions: data.allowance_list?.map(item => ({ value: item.allowance_id, label: item.name, base_amount: item.base_amount || 0 })) || [],
                        deductionOptions: data.deduction_list?.map(item => ({ value: item.deduction_id, label: item.name, base_amount: item.base_amount || 0 })) || [],
                        attendanceTypeOptions: data.attendance_type?.map(item => ({ value: item.attendance_type_id, label: item.attendance_type_name })) || [],
                        documentOptions: data.document_list?.map(item => ({ value: item.document_id, label: item.name }))
                    };

                    setDropdownOptions(dropdownData);
                } else {
                    setToast({ message: response.data.message || 'Failed to load dropdown options.', type: 'error' });
                }
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
                setToast({ message: 'Failed to load dropdown options. Please refresh the page.', type: 'error' });
            } finally {
                setIsLoadingDropdowns(false);
            }
        };

        fetchDropdownData();
    }, [user, isAuthenticated]);

    // Reset allowance and deduction types when salary type changes to hourly
    useEffect(() => {
        if (formData.salaryType === '2') {
            const updatedAllowances = formData.allowances.map(allowance => ({
                ...allowance,
                allowance_type: allowance.allowance_type === 1 ? 2 : allowance.allowance_type
            }));

            const updatedDeductions = formData.deductions.map(deduction => ({
                ...deduction,
                deduction_type: deduction.deduction_type === 1 ? 2 : deduction.deduction_type
            }));

            if (JSON.stringify(updatedAllowances) !== JSON.stringify(formData.allowances) ||
                JSON.stringify(updatedDeductions) !== JSON.stringify(formData.deductions)) {
                setFormData(prev => ({
                    ...prev,
                    allowances: updatedAllowances,
                    deductions: updatedDeductions
                }));
            }
        }
    }, [formData.salaryType]);

    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!isEditMode || !editEmployeeId || !isAuthenticated() || !user?.user_id) return;

            setIsLoadingEmployeeData(true);

            try {
                const formDataToSend = new FormData();
                formDataToSend.append('employee_id', editEmployeeId);

                const response = await api.post('/employee_edit_data_fetch', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const { data, success } = response.data;

                if (!success || !data || typeof data !== 'object' || !data.employee) {
                    setToast({ message: 'Failed to load employee data properly.', type: 'error' });
                    return;
                }

                const employee = data.employee;
                const baseUrl = data.base_url || '';

                const allowances = data.employee_allowance?.map(allowance => ({
                    allowance_id: allowance.allowance_id || '',
                    allowance_value: allowance.allowance_value || '',
                    allowance_type: parseInt(allowance.allowance_type) || 2
                })) || [];

                const deductions = data.employee_deduction?.map(deduction => ({
                    deduction_id: deduction.deduction_id || '',
                    deduction_value: deduction.deduction_value || '',
                    deduction_type: parseInt(deduction.deduction_type) || 2
                })) || [];

                const references = data.employee_reference?.map(ref => ({
                    name: ref.name || '',
                    contactNumber: ref.number || ''
                })) || [];

                const mappedFormData = {
                    employeeCode: employee.employee_code || '',
                    name: employee.full_name || '',
                    email: employee.email || '',
                    gender: employee.gender_id || '',
                    branch: employee.branch_id || '',
                    department: employee.department_id || '',
                    designation: employee.designation_id || '',
                    employmentType: employee.employee_type_id || '',
                    attendanceType: '1', // always fixed
                    salaryType: employee.salary_type_id || '',
                    salary: employee.salary || '',
                    company: employee.company_id || '',
                    allowances: allowances,
                    deductions: deductions,
                    address: employee.address || '',
                    bankName: employee.bank_name || '',
                    branchName: employee.bank_branch || '',
                    accountNo: employee.bank_account_number || '',
                    ifscCode: employee.bank_ifsc_code || '',
                    emergencyContactNo: employee.emergency_contact_number || '',
                    contactPersonName: employee.emergency_contact_name || '',
                    relation: employee.emergency_relation || '',
                    emergencyAddress: employee.emergency_address || '',
                    dateOfBirth: employee.dob || '',
                    dateOfJoining: employee.date_of_joining || '',
                    references: references.length > 0 ? references : [{ name: '', contactNumber: '' }],
                    aadharCard: null,
                    drivingLicence: null,
                    panCard: null,
                    photo: null,
                    mobile: employee.mobile_number || '',
                    password: employee.password || '',
                    documents: data.employee_document.map(doc => ({
                        id: doc.id,
                        document_id: doc.document_id,
                        label: doc.document_name,
                        preview: "https://admin.promanager.in/" + doc.document_image
                    }))
                };

                setFormData(mappedFormData);

                const filePreviews = {
                    aadharCard: employee.aadharcard_img ? baseUrl + employee.aadharcard_img : null,
                    drivingLicence: employee.dl_img ? baseUrl + employee.dl_img : null,
                    panCard: employee.pan_img ? baseUrl + employee.pan_img : null,
                    photo: employee.passport_img ? baseUrl + employee.passport_img : null
                };

                setFilePreviews(filePreviews);
            } catch (error) {
                setToast({ message: 'Failed to fetch employee data. Please try again.', type: error });
            } finally {
                setIsLoadingEmployeeData(false);
            }
        };

        if (!isLoadingDropdowns) {
            fetchEmployeeData();
        }
    }, [isEditMode, editEmployeeId, user, isAuthenticated, isLoadingDropdowns]);

    const validateName = (name) => {
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!name.trim()) return 'Name is required';
        if (!nameRegex.test(name)) return 'Name should only contain letters and spaces';
        if (name.length < 2) return 'Name should be at least 2 characters long';
        return '';
    };

    const validateMobile = (mobile) => {
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobile.trim()) return 'Mobile number is required';
        if (!mobileRegex.test(mobile)) return 'Mobile number should be 10 digits starting with 6-9';
        return '';
    };

    const validateEmail = (email) => {
        if (!email.trim()) return '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        return '';
    };

    const validateBankAccount = (accountNo) => {
        if (!accountNo.trim()) return 'Account number is required';
        if (accountNo.length < 9 || accountNo.length > 18) return 'Account number should be 9-18 digits';
        if (!/^\d+$/.test(accountNo)) return 'Account number should only contain numbers';
        return '';
    };

    const validateIFSC = (ifsc) => {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifsc.trim()) return 'IFSC code is required';
        if (!ifscRegex.test(ifsc.toUpperCase())) return 'Please enter a valid IFSC code (e.g., SBIN0123456)';
        return '';
    };

    const validateBankName = (bankName) => {
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!bankName.trim()) return 'Bank name is required';
        if (!nameRegex.test(bankName)) return 'Bank name should only contain letters and spaces';
        return '';
    };

    const validateBranchName = (branchName) => {
        const branchRegex = /^[a-zA-Z\s]+$/;
        if (!branchName.trim()) return 'Branch name is required';
        if (!branchRegex.test(branchName)) return 'Branch name should only contain letters and spaces';
        return '';
    };

    const validateDateOfJoint = (dateOfJoining) => {
        if (!dateOfJoining) return 'Date of joining is required';
        return '';
    }

    const validateEmployeeCode = (code) => {
        if (!code.trim()) return 'Employee code is required';
        if (code.length < 3) return 'Employee code should be at least 3 characters long';
        return '';
    };

    const validateSalary = (salary) => {
        if (!salary) return '';
        if (isNaN(salary) || parseFloat(salary) < 0) return 'Salary should be a valid positive number';
        return '';
    };

    const validateAllowancesAndDeductions = () => {
        const errors = [];

        formData.allowances.forEach((allowance, index) => {
            if (!allowance.allowance_id) {
                errors.push(`Allowance ${index + 1}: Please select an allowance type`);
            }
            if (!allowance.allowance_value) {
                errors.push(`Allowance ${index + 1}: Amount/Percentage is required`);
            }
            if (allowance.allowance_id && allowance.allowance_value) {
                const value = parseFloat(allowance.allowance_value);
                if (isNaN(value) || value <= 0) {
                    errors.push(`Allowance ${index + 1}: Please enter a valid positive amount/percentage`);
                }
                if (allowance.allowance_type === 1 && value > 100) {
                    errors.push(`Allowance ${index + 1}: Percentage cannot be more than 100%`);
                }
            }
        });

        formData.deductions.forEach((deduction, index) => {
            if (!deduction.deduction_id) {
                errors.push(`Deduction ${index + 1}: Please select a deduction type`);
            }
            if (!deduction.deduction_value) {
                errors.push(`Deduction ${index + 1}: Amount/Percentage is required`);
            }
            if (deduction.deduction_id && deduction.deduction_value) {
                const value = parseFloat(deduction.deduction_value);
                if (isNaN(value) || value <= 0) {
                    errors.push(`Deduction ${index + 1}: Please enter a valid positive amount/percentage`);
                }
                if (deduction.deduction_type === 1 && value > 100) {
                    errors.push(`Deduction ${index + 1}: Percentage cannot be more than 100%`);
                }
            }
        });

        return errors;
    };

    const handleAllowanceChange = (index, field, value) => {
        const updatedAllowances = [...formData.allowances];
        updatedAllowances[index][field] = value;
        setFormData(prev => ({ ...prev, allowances: updatedAllowances }));
    };

    const handleDeductionChange = (index, field, value) => {
        const updatedDeductions = [...formData.deductions];
        updatedDeductions[index][field] = value;
        setFormData(prev => ({ ...prev, deductions: updatedDeductions }));
    };

    const addAllowance = () => {
        setFormData(prev => ({
            ...prev,
            allowances: [...prev.allowances, { allowance_id: '', allowance_value: '', allowance_type: 2 }]
        }));
    };

    const addDeduction = () => {
        setFormData(prev => ({
            ...prev,
            deductions: [...prev.deductions, { deduction_id: '', deduction_value: '', deduction_type: 2 }]
        }));
    };

    const removeAllowance = (index) => {
        const updatedAllowances = formData.allowances.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, allowances: updatedAllowances }));
    };

    const removeDeduction = (index) => {
        const updatedDeductions = formData.deductions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, deductions: updatedDeductions }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    setToast({ message: 'File size should not exceed 5MB', type: 'error' });
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, [name]: file }));
                    setFilePreviews(prev => ({ ...prev, [name]: reader.result }));
                };
                reader.readAsDataURL(file);
            }
        } else {
            let processedValue = value;

            if (value instanceof Date && !isNaN(value)) {
                processedValue = value.toISOString().split('T')[0];
            }

            switch (name) {
                case 'name':
                case 'contactPersonName':
                    processedValue = processedValue.replace(/[^a-zA-Z\s]/g, '');
                    break;
                case 'mobile':
                case 'emergencyContactNo':
                    processedValue = processedValue.replace(/\D/g, '').slice(0, 10);
                    break;
                case 'accountNo':
                    processedValue = processedValue.replace(/\D/g, '').slice(0, 18);
                    break;
                case 'ifscCode':
                    processedValue = processedValue.toUpperCase().slice(0, 11);
                    break;
                case 'bankName':
                case 'branchName':
                    processedValue = processedValue.replace(/[^a-zA-Z\s]/g, '');
                    break;
                case 'employeeCode':
                    processedValue = processedValue.replace(/[^a-zA-Z0-9-_]/g, '');
                    break;
                case 'attendanceType':
                    processedValue = processedValue.toString() || '';
                    break;
            }
            setFormData(prev => ({ ...prev, [name]: processedValue }));
        }
    };

    const getValidDate = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    };

    const validateField = (fieldName, value) => {
        switch (fieldName) {
            case 'name':
            case 'contactPersonName':
                return validateName(value);
            case 'mobile':
                return validateMobile(value);
            case 'emergencyContactNo':
                return validateMobile(value);
            case 'email':
                return validateEmail(value);
            case 'employeeCode':
                return validateEmployeeCode(value);
            case 'bankName':
                return validateBankName(value);
            case 'branchName':
                return validateBranchName(value);
            case 'dateOfJoining':
                return validateDateOfJoint(value);
            case 'accountNo':
                return validateBankAccount(value);
            case 'ifscCode':
                return validateIFSC(value);
            case 'salary':
                return validateSalary(value);
            default:
                return '';
        }
    };

    const handleFieldBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        if (error) {
            setToast({ message: error, type: 'error' });
        }
    };

    const handleReferenceChange = (index, field, value) => {
        const updatedReferences = [...formData.references];
        updatedReferences[index][field] = value;
        setFormData(prev => ({ ...prev, references: updatedReferences }));
    };

    const addReference = () => {
        setFormData(prev => ({
            ...prev,
            references: [...prev.references, { name: '', contactNumber: '' }]
        }));
    };

    const removeReference = (index) => {
        if (formData.references.length > 1) {
            const updatedReferences = formData.references.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, references: updatedReferences }));
        }
    };

    const handleDocumentTypeChange = (e) => {
        const value = e.target.value;
        if (!value) {
            setDocumentType(null);
            return;
        }
        const selected = dropdownOptions.documentOptions.find(item => item.value.toString() === value);
        if (selected) setDocumentType(selected);
    };

    const addDocument = () => {
        if (!documentType) {
            setToast({ message: "Select the document", type: "error" });
            return;
        }

        const alreadyAdded = formData.documents.some(doc => doc.document_id === documentType.value);
        if (alreadyAdded) {
            setToast({ message: "Document already added", type: "error" });
            return;
        }

        setFormData(prev => ({
            ...prev,
            documents: [
                ...(prev.documents || []),
                { document_id: documentType.value, label: documentType.label, file: null, preview: null }
            ]
        }));

        setDocumentType(null);
    };

    const handleDynamicDocumentUpload = (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setToast({ message: "File size should not exceed 5MB", type: "error" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => {
                const updated = [...(prev.documents || [])];
                updated[index] = { ...updated[index], file, preview: reader.result };
                return { ...prev, documents: updated };
            });
        };
        reader.readAsDataURL(file);
    };

    const removeDynamicDocument = async (index) => {
        const doc = formData.documents[index];

        if (doc.file) {
            setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
            return;
        }

        if (!editEmployeeId || !isAuthenticated() || !user?.user_id) return;

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('employee_id', editEmployeeId);
            formDataToSend.append('employee_document_id', doc.id);

            const response = await api.post('/employee_document_delete', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { success, message } = response.data;

            if (success) {
                setToast({ message: message, type: 'success' });
                setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
            } else if (!success) {
                setToast({ message: message || 'Failed to delete the document.', type: 'error' });
                return;
            }
        } catch (error) { }
    };

    const handleImagePreview = (imageSrc, title = "Document Preview") => {
        if (imageSrc) {
            setPreviewImage(imageSrc);
            setPreviewTitle(title);
            setShowPreviewModal(true);
        }
    };

    const handleDocumentPreview = (docSrc, title = "Document Preview") => {
        if (docSrc) {
            if (docSrc.includes('.pdf') || docSrc.toLowerCase().includes('pdf')) {
                window.open(docSrc, '_blank');
            } else {
                setPreviewImage(docSrc);
                setPreviewTitle(title);
                setShowPreviewModal(true);
            }
        }
    };

    const closePreviewModal = () => {
        setShowPreviewModal(false);
        setPreviewImage('');
        setPreviewTitle('');
    };

    const PreviewModal = () => {
        if (!showPreviewModal || !previewImage) return null;

        return (
            <div
                className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={closePreviewModal}
            >
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl max-h-[85vh] m-4 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-indigo-50">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {previewTitle}
                        </h3>
                        <button
                            onClick={closePreviewModal}
                            className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200 group"
                            title="Close preview"
                        >
                            <svg
                                className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-all duration-200"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-8 flex items-center justify-center bg-gray-50 min-h-[300px]">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg border border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2IiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIgcng9IjgiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                            }}
                        />
                    </div>
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">Click outside to close or use the × button</p>
                    </div>
                </div>
            </div>
        );
    };

    const handleFileDelete = (fieldName) => {
        setFilePreviews(prev => ({ ...prev, [fieldName]: null }));
        setFormData(prev => ({ ...prev, [fieldName]: null }));
        const fileInput = document.querySelector(`input[name="${fieldName}"]`);
        if (fileInput) fileInput.value = '';
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const navigateToField = (fieldName) => {
        const fieldSectionMap = {
            'employeeCode': 'basicDetails',
            'name': 'basicDetails',
            'mobile': 'basicDetails',
            'password': 'basicDetails',
            'branch': 'basicDetails',
            'department': 'basicDetails',
            'dateOfJoining': 'basicDetails',
        };

        const sectionKey = fieldSectionMap[fieldName];

        if (sectionKey) {
            if (!expandedSections[sectionKey]) {
                setExpandedSections(prev => ({ ...prev, [sectionKey]: true }));
            }

            setTimeout(() => {
                const fieldElement = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`);
                if (fieldElement) {
                    fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    fieldElement.focus();
                    fieldElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
                    setTimeout(() => { fieldElement.style.boxShadow = ''; }, 2000);
                }
            }, 100);
        }
    };

    const validateForm = () => {
        const errors = [];
        const firstErrorField = { field: null, message: null };

        const fieldsToValidate = [
            { name: 'employeeCode', value: formData.employeeCode, label: 'Employee Code' },
            { name: 'name', value: formData.name, label: 'Full Name' },
            { name: 'branch', value: formData.branch, label: 'Branch' },
            { name: 'department', value: formData.department, label: 'Department' },
            { name: 'dateOfJoining', value: formData.dateOfJoining, label: 'Date of Joining' },
        ];

        // Mobile and password are always required (not just for add mode)
        if (!isEditMode) {
            fieldsToValidate.push(
                { name: 'mobile', value: formData.mobile, label: 'Mobile Number' },
                { name: 'password', value: formData.password, label: 'Password' }
            );
        }

        fieldsToValidate.forEach(field => {
            if (!field.value || !field.value.toString().trim()) {
                const errorMessage = `${field.label} is required`;
                errors.push(errorMessage);
                if (!firstErrorField.field) {
                    firstErrorField.field = field.name;
                    firstErrorField.message = errorMessage;
                }
            }
        });

        if (firstErrorField.field) {
            navigateToField(firstErrorField.field);
            return errors;
        }

        fieldsToValidate.forEach(field => {
            if (field.value && field.value.toString().trim()) {
                const error = validateField(field.name, field.value);
                if (error) {
                    errors.push(error);
                    if (!firstErrorField.field) {
                        firstErrorField.field = field.name;
                        firstErrorField.message = error;
                    }
                }
            }
        });

        // Password validation for new employees
        if (!isEditMode && formData.password) {
            const password = formData.password;

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[^\s]{6,}$/;

            if (!passwordRegex.test(password)) {
                const errorMessage = 'Password must be at least 6 characters, include 1 uppercase, 1 lowercase, 1 number, and 1 special character';
                errors.push(errorMessage);
                if (!firstErrorField.field) {
                    firstErrorField.field = 'password';
                    firstErrorField.message = errorMessage;
                }
            }
        }

        const allowanceDeductionErrors = validateAllowancesAndDeductions();
        if (allowanceDeductionErrors.length > 0) {
            errors.push(...allowanceDeductionErrors);
            if (!firstErrorField.field && allowanceDeductionErrors.length > 0) {
                if (!expandedSections.salaryStructure) {
                    setExpandedSections(prev => ({ ...prev, salaryStructure: true }));
                }
                setTimeout(() => {
                    const salarySection = document.querySelector('[data-section="salaryStructure"]');
                    if (salarySection) salarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }

        if (firstErrorField.field && errors.length > 0) {
            navigateToField(firstErrorField.field);
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validationErrors = validateForm();

        if (validationErrors.length > 0) {
            setToast({ message: validationErrors[0], type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            if (!isAuthenticated() || !user?.user_id) {
                setToast({ message: 'User authentication required. Please login again.', type: 'error' });
                setIsSubmitting(false);
                return;
            }

            const formDataToSend = new FormData();


            if (isEditMode && editEmployeeId) {
                formDataToSend.append('employee_id', editEmployeeId);
            }

            formDataToSend.append('employee_code', formData.employeeCode);
            formDataToSend.append('full_name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('gender_id', formData.gender);
            formDataToSend.append('branch_id', formData.branch);
            formDataToSend.append('department_id', formData.department);
            formDataToSend.append('designation_id', formData.designation);
            formDataToSend.append('employee_type_id', formData.employmentType);
            formDataToSend.append('attendance_type_id', '1'); // always send 1
            formDataToSend.append('company_id', formData.company);
            formDataToSend.append('address', formData.address);

            formDataToSend.append('bank_name', formData.bankName);
            formDataToSend.append('bank_branch', formData.branchName);
            formDataToSend.append('bank_account_number', formData.accountNo);
            formDataToSend.append('bank_ifsc_code', formData.ifscCode);

            formDataToSend.append('emergency_contact_name', formData.contactPersonName);
            formDataToSend.append('emergency_contact_number', formData.emergencyContactNo);
            formDataToSend.append('emergency_relation_id', formData.relation);
            formDataToSend.append('emergency_address', formData.emergencyAddress);

            formDataToSend.append('dob', formData.dateOfBirth);
            formDataToSend.append('date_of_joining', formData.dateOfJoining);

            formDataToSend.append('salary_type_id', formData.salaryType);
            formDataToSend.append('salary', formData.salary);

            formData.allowances.forEach((allowance) => {
                if (allowance.allowance_id && allowance.allowance_value) {
                    formDataToSend.append('allowance_id[]', allowance.allowance_id);
                    formDataToSend.append('allowance_value[]', allowance.allowance_value);
                    formDataToSend.append('allowance_type[]', allowance.allowance_type);
                }
            });

            formData.deductions.forEach((deduction) => {
                if (deduction.deduction_id && deduction.deduction_value) {
                    formDataToSend.append('deduction_id[]', deduction.deduction_id);
                    formDataToSend.append('deduction_value[]', deduction.deduction_value);
                    formDataToSend.append('deduction_type[]', deduction.deduction_type);
                }
            });

            formData.references.forEach((reference) => {
                if (reference.name && reference.contactNumber) {
                    formDataToSend.append('reference_name[]', reference.name);
                    formDataToSend.append('reference_number[]', reference.contactNumber);
                }
            });

            // Always send mobile and password
            formDataToSend.append('mobile_number', formData.mobile);
            formDataToSend.append('password', formData.password || '');

            const fileFields = ['aadharCard', 'drivingLicence', 'panCard', 'photo'];
            const apiFileFields = ['aadharcard_img', 'dl_img', 'pan_img', 'passport_img'];

            fileFields.forEach((formField, index) => {
                const apiField = apiFileFields[index];
                const file = formData[formField];
                if (file && file instanceof File) {
                    formDataToSend.append(apiField, file);
                }
            });

            formData.documents.forEach((document) => {
                formDataToSend.append("document_id[]", document.document_id);
                formDataToSend.append("document_image[]", document.file);
            });

            const response = await api.post('/employee_create', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setToast({
                    message: isEditMode ? 'Employee updated successfully!' : 'Employee added successfully!',
                    type: 'success'
                });
                setTimeout(() => { navigate('/employee'); }, 1000);



                if (!isEditMode) {
                    // FIX: Reset allowances and deductions to empty arrays (not with default items)
                    setFormData({
                        employeeCode: '',
                        company: '',
                        name: '',
                        email: '',
                        gender: '',
                        branch: '',
                        department: '',
                        designation: '',
                        employmentType: '',
                        attendanceType: '1',
                        salaryType: '',
                        salary: '',
                        allowances: [],
                        deductions: [],
                        address: '',
                        bankName: '',
                        branchName: '',
                        accountNo: '',
                        ifscCode: '',
                        aadharCard: null,
                        drivingLicence: null,
                        panCard: null,
                        photo: null,
                        emergencyContactNo: '',
                        contactPersonName: '',
                        relation: '',
                        emergencyAddress: '',
                        dateOfBirth: null,
                        dateOfJoining: null,
                        references: [{ name: '', contactNumber: '' }],
                        mobile: '',
                        password: '',
                        documents: [],
                    });
                    setFilePreviews({ aadharCard: null, drivingLicence: null, panCard: null, photo: null });
                } else {
                    setTimeout(() => { navigate('/employee'); }, 1000);
                }
            } else {
                setToast({
                    message: response.data.message || `Failed to ${isEditMode ? 'update' : 'add'} employee.`,
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            setToast({
                message: error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} employee. Please try again.`,
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const goBack = () => { navigate(-1); };

    const sections = [
        { key: 'basicDetails', title: 'Employment Information', icon: User, color: 'primary' },
        { key: 'salaryStructure', title: 'Salary Structure', icon: CreditCard, color: 'primary' },
        { key: 'bankDetails', title: 'Bank Details', icon: CreditCard, color: 'primary' },
        { key: 'Documents', title: 'Documents', icon: FileText, color: 'primary' },
        { key: 'contactInformation', title: 'Contact', icon: Phone, color: 'primary' },
        { key: 'reference', title: 'References', icon: Users, color: 'primary' },
    ];

    if (isLoadingDropdowns || isLoadingEmployeeData) {
        return <div className=""><LoadingSpinner /></div>;
    }

    if (!permissions['employee_edit'] && isEditMode) {
        navigate('/unauthorized');
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className=" mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={goBack}
                                className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                {isEditMode ? <Edit size={24} className="text-[var(--color-text-white)]" /> : ""}
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        {isEditMode ? 'Edit Employee' : 'Add New Employee'}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {sections.map((section) => (
                        <div key={section.key} className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg border border-[var(--color-border-primary)] overflow-hidden" data-section={section.key}>
                            <button
                                type="button"
                                onClick={() => toggleSection(section.key)}
                                className="w-full flex items-center justify-between p-8 hover:bg-[var(--color-bg-secondary)] transition-all duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-${section.color}-100`}>
                                        <section.icon size={20} className={`text-${section.color}-600`} />
                                    </div>
                                    <span className="font-semibold text-[var(--color-text-primary)] text-lg">{section.title}</span>
                                </div>
                                <div className={`p-1 rounded-full ${expandedSections[section.key] ? 'bg-[var(--color-primary-lighter)]' : 'bg-[var(--color-bg-gradient-start)]'}`}>
                                    {expandedSections[section.key] ?
                                        <ChevronUp size={20} className="text-[var(--color-primary-dark)]" /> :
                                        <ChevronDown size={20} className="text-[var(--color-text-secondary)]" />
                                    }
                                </div>
                            </button>

                            {expandedSections[section.key] && (
                                <div className="border-t border-[var(--color-border-primary)]">
                                    {section.key === 'basicDetails' && (
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Employee Code <span className="text-[var(--color-error)]">*</span></label>
                                                <input
                                                    type="text"
                                                    name="employeeCode"
                                                    value={formData.employeeCode}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter employee code"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Full Name <span className="text-[var(--color-error)]">*</span></label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter full name"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Email Address</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter email address"
                                                />
                                            </div>

                                            {/* REMOVED: Attendance Type dropdown — always sends attendanceType: '1' */}

                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                    Mobile No <span className="text-[var(--color-error)]">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="mobile"
                                                    value={formData.mobile}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter mobile number"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                    Password <span className="text-[var(--color-error)]">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 pr-10 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                        placeholder="Enter password"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                        tabIndex={-1}
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Gender</label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                >
                                                    <option value="">Select Gender</option>
                                                    {dropdownOptions.genderOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Branch <span className="text-[var(--color-error)]">*</span></label>
                                                <select
                                                    name="branch"
                                                    value={formData.branch}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    required
                                                >
                                                    <option value="">Select Branch</option>
                                                    {dropdownOptions.branchOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Department <span className="text-[var(--color-error)]">*</span></label>
                                                <select
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    required
                                                >
                                                    <option value="">Select Department</option>
                                                    {dropdownOptions.departmentOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Date of Birth</label>
                                                <DatePicker
                                                    selected={getValidDate(formData.dateOfBirth)}
                                                    onChange={(date) => handleInputChange({ target: { name: 'dateOfBirth', value: date } })}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    dateFormat="dd-MM-yyyy"
                                                    placeholderText="DD-MM-YYYY"
                                                    showYearDropdown
                                                    showMonthDropdown
                                                    scrollableYearDropdown
                                                    scrollableMonthDropdown
                                                    yearDropdownItemNumber={100}
                                                    maxDate={new Date()}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Date of Joining <span className="text-[var(--color-error)]">*</span></label>
                                                <DatePicker
                                                    selected={getValidDate(formData.dateOfJoining)}
                                                    onChange={(date) => handleInputChange({ target: { name: 'dateOfJoining', value: date } })}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    dateFormat="dd-MM-yyyy"
                                                    placeholderText="DD-MM-YYYY"
                                                    showYearDropdown
                                                    showMonthDropdown
                                                    scrollableYearDropdown
                                                    scrollableMonthDropdown
                                                    maxDate={new Date()}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Designation</label>
                                                <select
                                                    name="designation"
                                                    value={formData.designation}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                >
                                                    <option value="">Select Designation</option>
                                                    {dropdownOptions.designationOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Company</label>
                                                <select
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                >
                                                    <option value="">Select Company</option>
                                                    {dropdownOptions.companyOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Employment Type</label>
                                                <select
                                                    name="employmentType"
                                                    value={formData.employmentType}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                >
                                                    <option value="">Select Employment Type</option>
                                                    {dropdownOptions.employmentTypeOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Address</label>
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all resize-none"
                                                    placeholder="Enter address"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {section.key === 'salaryStructure' && (
                                        <div className="p-8 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Salary Type</label>
                                                    <select
                                                        name="salaryType"
                                                        value={formData.salaryType}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    >
                                                        <option value="">Select Salary Type</option>
                                                        {dropdownOptions.salaryTypeOptions.map(option => (
                                                            <option key={option.value} value={option.value}>{option.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Base Salary</label>
                                                    <input
                                                        type="number"
                                                        name="salary"
                                                        value={formData.salary}
                                                        onChange={handleInputChange}
                                                        onBlur={handleFieldBlur}
                                                        className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                        placeholder="Enter base salary amount"
                                                    />
                                                </div>
                                            </div>

                                            {/* Allowances Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                        Allowances
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={addAllowance}
                                                        className="flex items-center gap-2 text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] font-medium transition-colors px-3 py-2 rounded-lg hover:bg-[var(--color-primary-lighter)]"
                                                    >
                                                        <Plus size={16} />
                                                        Add Allowance
                                                    </button>
                                                </div>

                                                {formData.allowances.length > 0 ? (
                                                    formData.allowances.map((allowance, index) => (
                                                        <div key={index} className="border border-[var(--color-border-primary)] rounded-lg p-4 bg-[var(--color-bg-card)]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">Allowance {index + 1}</h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAllowance(index)}
                                                                    className="text-[var(--color-error)] hover:text-[var(--color-error-dark)] p-2 rounded-full hover:bg-[var(--color-error-light)] transition-colors"
                                                                    title="Remove this allowance"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="space-y-2">
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Allowance Type <span className="text-[var(--color-error)]">*</span></label>
                                                                    <select
                                                                        value={allowance.allowance_id}
                                                                        onChange={(e) => handleAllowanceChange(index, 'allowance_id', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                        required
                                                                    >
                                                                        <option value="">Select Allowance</option>
                                                                        {dropdownOptions.allowanceOptions && dropdownOptions.allowanceOptions.map(option => (
                                                                            <option key={option.value} value={option.value}>{option.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Type <span className="text-[var(--color-error)]">*</span></label>
                                                                    <select
                                                                        value={allowance.allowance_type}
                                                                        onChange={(e) => handleAllowanceChange(index, 'allowance_type', parseInt(e.target.value))}
                                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                        required
                                                                    >
                                                                        <option value={2}>Amount</option>
                                                                        {formData.salaryType === '1' && <option value={1}>Percentage</option>}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                                                        {allowance.allowance_type === 1 ? 'Percentage (%)' : 'Amount (₹)'} <span className="text-[var(--color-error)]">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={allowance.allowance_value}
                                                                        onChange={(e) => handleAllowanceChange(index, 'allowance_value', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                        placeholder={allowance.allowance_type === 1 ? 'Enter percentage' : 'Enter amount'}
                                                                        min="0"
                                                                        max={allowance.allowance_type === 1 ? "100" : undefined}
                                                                        step="0.01"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-[var(--color-text-muted)]"></div>
                                                )}
                                            </div>

                                            {/* Deductions Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                        Deductions
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={addDeduction}
                                                        className="flex items-center gap-2 text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] font-medium transition-colors px-3 py-2 rounded-lg hover:bg-[var(--color-primary-lighter)]"
                                                    >
                                                        <Plus size={16} />
                                                        Add Deduction
                                                    </button>
                                                </div>

                                                {formData.deductions.length > 0 ? (
                                                    formData.deductions.map((deduction, index) => (
                                                        <div key={index} className="border border-[var(--color-border-primary)] rounded-lg p-4 bg-[var(--color-bg-card)]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">Deduction {index + 1}</h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDeduction(index)}
                                                                    className="text-[var(--color-error)] hover:text-[var(--color-error-dark)] p-2 rounded-full hover:bg-[var(--color-error-light)] transition-colors"
                                                                    title="Remove this deduction"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="space-y-2">
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Deduction Type <span className="text-[var(--color-error)]">*</span></label>
                                                                    <select
                                                                        value={deduction.deduction_id}
                                                                        onChange={(e) => handleDeductionChange(index, 'deduction_id', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                        required
                                                                    >
                                                                        <option value="">Select Deduction</option>
                                                                        {dropdownOptions.deductionOptions && dropdownOptions.deductionOptions.map(option => (
                                                                            <option key={option.value} value={option.value}>{option.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Type <span className="text-[var(--color-error)]">*</span></label>
                                                                    <select
                                                                        value={deduction.deduction_type}
                                                                        onChange={(e) => handleDeductionChange(index, 'deduction_type', parseInt(e.target.value))}
                                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                        required
                                                                    >
                                                                        <option value={2}>Amount</option>
                                                                        {formData.salaryType === '1' && <option value={1}>Percentage</option>}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                                                        {deduction.deduction_type === 1 ? 'Percentage (%)' : 'Amount (₹)'} <span className="text-[var(--color-error)]">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={deduction.deduction_value}
                                                                        onChange={(e) => handleDeductionChange(index, 'deduction_value', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                        placeholder={deduction.deduction_type === 1 ? 'Enter percentage' : 'Enter amount'}
                                                                        min="0"
                                                                        max={deduction.deduction_type === 1 ? "100" : undefined}
                                                                        step="0.01"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-[var(--color-text-muted)]"></div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {section.key === 'bankDetails' && (
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Bank Name</label>
                                                <input
                                                    type="text"
                                                    name="bankName"
                                                    value={formData.bankName}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter bank name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Branch Name</label>
                                                <input
                                                    type="text"
                                                    name="branchName"
                                                    value={formData.branchName}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter branch name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Account Number</label>
                                                <input
                                                    type="text"
                                                    name="accountNo"
                                                    value={formData.accountNo}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter account number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">IFSC Code</label>
                                                <input
                                                    type="text"
                                                    name="ifscCode"
                                                    value={formData.ifscCode}
                                                    onChange={handleInputChange}
                                                    onBlur={handleFieldBlur}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter IFSC code"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {section.key === 'Documents' && (
                                        <div className="p-8">
                                            <div className="space-y-2 mb-6">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Document Type</label>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                    <select
                                                        name="documentOption"
                                                        className="flex-1 w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                                        onChange={handleDocumentTypeChange}
                                                        value={documentType?.value || ""}
                                                    >
                                                        <option value="">Select Document</option>
                                                        {dropdownOptions?.documentOptions.map(option => (
                                                            <option key={option.value} value={option.value}>{option.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="flex items-center justify-center gap-2 px-4 py-3 w-full sm:w-auto whitespace-nowrap text-[var(--color-primary-dark)] font-medium rounded-lg bg-[var(--color-primary-lighter)]"
                                                        onClick={addDocument}
                                                    >
                                                        <Plus size={16} />
                                                        Add Document
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                                {formData?.documents?.map((item, index) => (
                                                    <div className="space-y-2" key={index}>
                                                        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">{item.label}</label>
                                                        <div className="relative w-full h-28 border-2 border-dashed border-[var(--color-border-primary)] rounded-xl bg-[var(--color-bg-card)] overflow-hidden">
                                                            {!item.preview ? (
                                                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <div className="w-10 h-10 mb-2 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                                                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                            </svg>
                                                                        </div>
                                                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Upload {item.label}</p>
                                                                        <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG, PDF up to 5MB</p>
                                                                    </div>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,.pdf"
                                                                        onChange={(e) => handleDynamicDocumentUpload(e, index)}
                                                                        className="hidden"
                                                                    />
                                                                </label>
                                                            ) : (
                                                                <div className="relative w-full h-full group">
                                                                    <img src={item.preview} className="w-full h-full object-contain" />
                                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleImagePreview(item.preview, item.label)}
                                                                            className="bg-white rounded-full w-10 h-10 flex items-center justify-center"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeDynamicDocument(index)}
                                                                            className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {section.key === 'contactInformation' && (
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Emergency Contact Number</label>
                                                <input
                                                    type="tel"
                                                    name="emergencyContactNo"
                                                    value={formData.emergencyContactNo}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter emergency contact number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Contact Person Name</label>
                                                <input
                                                    type="text"
                                                    name="contactPersonName"
                                                    value={formData.contactPersonName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                    placeholder="Enter contact person name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Relation</label>
                                                <select
                                                    name="relation"
                                                    value={formData.relation}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                >
                                                    <option value="">Select Relation</option>
                                                    {dropdownOptions.relationOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">Emergency Address</label>
                                                <textarea
                                                    name="emergencyAddress"
                                                    value={formData.emergencyAddress}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                    className="w-full px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all resize-none"
                                                    placeholder="Enter emergency address"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {section.key === 'reference' && (
                                        <div className="p-8">
                                            <div className="space-y-4">
                                                {formData.references.map((reference, index) => (
                                                    <div key={index} className="border border-[var(--color-border-primary)] rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">Reference {index + 1}</h4>
                                                            {formData.references.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeReference(index)}
                                                                    className="text-[var(--color-error)] hover:text-[var(--color-error-dark)] p-1 rounded-full hover:bg-[var(--color-error-light)] transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={reference.name}
                                                                    onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                    placeholder="Enter reference name"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Contact Number</label>
                                                                <input
                                                                    type="tel"
                                                                    value={reference.contactNumber}
                                                                    onChange={(e) => handleReferenceChange(index, 'contactNumber', e.target.value)}
                                                                    className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                                                    placeholder="Enter contact number"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addReference}
                                                    className="flex items-center gap-2 text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] font-medium transition-colors"
                                                >
                                                    <Plus size={16} />
                                                    Add Another Reference
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Submit Button */}
                    <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg border border-[var(--color-border-primary)] p-8">
                        <div className="flex gap-4 justify-end">
                            <button
                                type="button"
                                onClick={goBack}
                                className="px-6 py-3 border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] rounded-lg hover:from-[var(--color-primary-darker)] hover:to-[var(--color-primary-darkest)] transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting && (
                                    <div className="w-4 h-4 border-2 border-[var(--color-border-primary)] border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Employee' : 'Add Employee')}
                            </button>
                        </div>
                    </div>
                </form>
                <PreviewModal />
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default AddEmployee;