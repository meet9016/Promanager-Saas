// PaymentPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from "@dr.pogodin/react-helmet";
import api from '../../../api/axiosInstance';
import { Toast } from '../../ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { useDispatch } from 'react-redux';
import { setPermissions } from '../../../redux/permissionsSlice';
import RegisterModal from '../../comman/RegisterModal';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Users, User, Mail, Building2, Tag, Phone, MessageSquare, MapPin,
    Check, Lock, ShieldCheck, Zap, Headphones, RotateCcw, Crown, Wallet, Percent,
    Calendar, CalendarDays, Sparkles, ChevronDown, CheckCircle2
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUPON_LIST = [
    { code: 'WELCOME', discountPct: 5, label: 'Save 5%', desc: '5% off on any plan. No minimum.', expiry: '31st Dec 2026' },
];

const CYCLE_MONTHS = {
    monthly: 1,
    quarterly: 3,
    yearly: 12,
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ─── Component ────────────────────────────────────────────────────────────────
const PaymentPage = () => {
    const { login } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [registerForm, setRegisterForm] = useState({
        full_name: "",
        company_name: "",
        email: "",
        mobile: "",
        gst_number: "",
        whatsapp: "",
        address: "",
    });
    const [registerErrors, setRegisterErrors] = useState({});

    const handleRegisterChange = (field, value) => {
        setRegisterForm(prev => ({ ...prev, [field]: value }));
    };

    const flattenPermissions = (permissionsArray) => permissionsArray.reduce((acc, item) => ({ ...acc, ...item }), {});

    const handleRegisterSubmit = async () => {
        try {
            setRegisterErrors({});
            const formData = new FormData();
            Object.entries(registerForm).forEach(([key, value]) => formData.append(key, value));

            const res = await api.post("create_account_free_account", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const { success, message, token, user_data } = res.data;

            if (success) {
                setToast({ message: message || "Account created successfully!", type: "success" });
                setIsRegisterOpen(false);

                if (token && user_data) {
                    const user_id = user_data.user_id;
                    localStorage.setItem('token', token);

                    const userData = {
                        user_id,
                        full_name: user_data.full_name,
                        username: user_data.username,
                        email: user_data.email || "",
                        number: user_data.number,
                        type: user_data.type,
                        user_roles_id: user_data.user_role_id,
                        subscriptions_status: user_data.subscriptions_status,
                        subscriptions_days: user_data.subscriptions_days,
                    };

                    login(userData, false);

                    const permFormData = new FormData();
                    permFormData.append("user_roles_id", user_data.user_role_id);
                    const permRes = await api.post("user_permissions", permFormData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    if (permRes.data?.data) {
                        dispatch(setPermissions(flattenPermissions(permRes.data.data)));
                    }

                    navigate("/dashboard");
                }
            } else {
                setToast({ message: message || "Failed to create account.", type: "error" });
            }
        } catch (err) {
            setToast({ message: "Failed to create account. Please try again.", type: "error" });
        }
    };

    const [toast, setToast] = useState(null);
    const [plans, setPlans] = useState([]);
    const [apiCoupons, setApiCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [employees, setEmployees] = useState(21);
    const [billingCycle, setBillingCycle] = useState('yearly');
    const [form, setForm] = useState({ name: '', email: '', company: '', gst: '', phone: '', address: '' });
    const [formErrors, setFormErrors] = useState({});
    const [showOtpRow, setShowOtpRow] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);

    useEffect(() => {
        let timerId;
        if (showOtpRow && resendTimer > 0 && !isPhoneVerified) {
            timerId = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timerId);
    }, [showOtpRow, resendTimer, isPhoneVerified]);

    const handleSendOtp = () => {
        setShowOtpRow(true);
        setResendTimer(30);
        setToast({ type: 'success', message: 'OTP sent to WhatsApp!' });
    };

    const handleFormChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const [couponInput, setCouponInput] = useState('');
    const [couponApplied, setCouponApplied] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [enabled, setEnabled] = useState(false);
    const [isFreePlan, setIsFreePlan] = useState(false);

    // ── Derived ───────────────────────────────────────────────────────────────
    const availableCycles = selectedPlan?.billing_cycle ?? ['monthly', 'quarterly', 'yearly'];
    const months = CYCLE_MONTHS[billingCycle] ?? 12;
    const pricePerUser = useMemo(() => Number(selectedPlan?.price_per_user ?? 25), [selectedPlan]);

    // ── Calculations ──────────────────────────────────────────────────────────
    const baseAmount = useMemo(
        () => employees * pricePerUser * months,
        [employees, pricePerUser, months]
    );

    const { discountAmount, taxableAmount, gst, total } = useMemo(() => {
        const disc = couponApplied ? Math.round(baseAmount * couponApplied.discountPct / 100) : 0;
        const taxable = baseAmount - disc;
        const tax = Math.round(taxable * 0.18);

        return {
            discountAmount: disc,
            taxableAmount: taxable,
            gst: tax,
            total: taxable + tax
        };
    }, [baseAmount, couponApplied]);

    const getRange = (range) => {
        if (range?.includes('+')) {
            return {
                min: Number(range.replace('+', '')),
                max: Infinity
            };
        }
        const [min, max] = (range || "0-0").split('-').map(Number);
        return { min: min || 0, max: max || 999 };
    };

    // ── Track initialization from location state ──────────────────────
    const [hasInitializedFromLocation, setHasInitializedFromLocation] = useState(false);

    // ── Activate Passed Plan from Location State (Initial Load only) ──
    useEffect(() => {
        if (!plans.length || hasInitializedFromLocation) return;
        setHasInitializedFromLocation(true);

        const passedPlan = location.state?.plan;
        const passedUsers = location.state?.users;
        if (!passedPlan) return;

        const matched = plans.find(p =>
            (passedPlan.id && p.id === passedPlan.id) ||
            (passedPlan.name && p.name?.toLowerCase() === passedPlan.name.toLowerCase())
        );

        if (matched) {
            setSelectedPlan(matched);
            setIsFreePlan(false);
            const { min, max } = getRange(matched.user_range);
            if (passedUsers && passedUsers >= min && (max === Infinity || passedUsers <= max)) {
                setEmployees(passedUsers);
            } else {
                setEmployees(min > 0 ? min : 1);
            }
            if (matched.billing_cycle?.length) {
                setBillingCycle(matched.billing_cycle[matched.billing_cycle.length - 1] || 'yearly');
            }
        }
    }, [plans, location.state, hasInitializedFromLocation]);

    // ── Auto-select plan dynamically based on employee count ──────────
    useEffect(() => {
        if (!plans.length) return;

        if (isFreePlan) {
            setIsFreePlan(false);
        }

        const empNum = Number(employees);
        if (isNaN(empNum) || empNum <= 0) return;

        const matched = plans.find(p => {
            const { min, max } = getRange(p.user_range);
            return empNum >= min && empNum <= max;
        });

        const newPlan = matched || (empNum > 100 ? plans[plans.length - 1] : plans[0]);

        if (newPlan && newPlan.name?.toLowerCase() !== selectedPlan?.name?.toLowerCase()) {
            setSelectedPlan(newPlan);
            if (newPlan.billing_cycle?.length) {
                setBillingCycle(newPlan.billing_cycle[newPlan.billing_cycle.length - 1] || 'yearly');
            }
        }
    }, [employees, plans]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchPlanData = async () => {
            const formData = new FormData();
            try {
                setLoading(true);
                const response = await api.post('pricelist', formData, {
                    apiType: 'web'
                });
                if (response?.data?.success) {
                    const rawData = response.data.data || [];
                    const paidPlans = rawData.filter(
                        (p) => p.name?.toLowerCase() !== "free" && p.user_range !== "0-3" && Number(p.price_per_user) > 0
                    );
                    setPlans(paidPlans);
                }
            } catch (err) {
                console.error('Error fetching pricing data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlanData();
    }, []);

    // ── Fetch Coupon List ─────────────────────────────────────────────────────
    useEffect(() => {
        const fetchCouponList = async () => {
            try {
                const formData = new FormData();
                const response = await api.post('coupon_list', formData, {
                    apiType: 'web'
                });
                if (response?.data?.success) {
                    const list = response.data.data || response.data.coupons || [];
                    setApiCoupons(list);
                }
            } catch (err) {
                console.error('Error fetching coupon list:', err);
            }
        };
        fetchCouponList();
    }, []);

    // ── Plan select ───────────────────────────────────────────────────────────
    const handlePlanSelect = (plan) => {
        setIsFreePlan(false);
        setSelectedPlan(plan);
        const { min, max } = getRange(plan.user_range);
        const clampedEmployees = max === Infinity
            ? Math.max(employees, min)
            : Math.min(Math.max(employees, min), max);
        setEmployees(clampedEmployees);
        if (plan.billing_cycle?.length) setBillingCycle(plan.billing_cycle[plan.billing_cycle.length - 1]);
    };

    // ── Handle Free Plan selection ───────────────────────────────────────────
    const handleFreePlanSelect = () => {
        setIsFreePlan(true);
        setSelectedPlan(null);
        setEmployees(3);
        setBillingCycle("yearly");
        setIsRegisterOpen(true);
    };

    const maxEmployees = useMemo(() => {
        if (!plans.length) return 500;
        const last = getRange(plans[plans.length - 1].user_range);
        return last.max === Infinity ? 9999 : last.max;
    }, [plans]);

    // ── Coupon ────────────────────────────────────────────────────────────────
    const applyCoupon = async (codeOverride) => {
        const targetCode = (codeOverride || couponInput).trim();
        if (!targetCode) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('coupon_code', targetCode);
            const response = await api.post('apply_coupon', formData, {
                apiType: 'web'
            });
            if (response?.data?.success) {
                const data = response.data.data || {};
                const discPct = (data.coupon_per || 0);
                setCouponApplied({
                    code: targetCode.toUpperCase(),
                    discountPct: discPct
                });
                setToast({
                    type: 'success',
                    message: response?.data?.message || "Coupon Applied Successfully!"
                });
            } else {
                setToast({
                    type: 'error',
                    message: response?.data?.message || "Invalid Coupon Code!"
                });
            }
        } catch (err) {
            console.error('Error applying coupon:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeCoupon = () => {
        setCouponApplied(null);
        setCouponInput('');
        setCouponError('');
    };

    const safeRedirect = (url) => {
        try {
            if (!url) return false;
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) return false;
            window.location.href = parsed.href;
            return true;
        } catch {
            return false;
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[6-9]\d{9}$/;
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        const errors = {};
        if (!form.name.trim()) errors.name = 'Full name is required';
        if (!form.email.trim()) errors.email = 'Email is required';
        else if (!emailRegex.test(form.email)) errors.email = 'Enter a valid email';

        if (!form.company.trim()) errors.company = 'Company is required';
        if (!form.phone.trim()) errors.phone = 'Phone number is required';
        else if (!phoneRegex.test(form.phone)) errors.phone = 'Enter a valid 10-digit phone number';

        if (!form.address.trim()) errors.address = 'Address is required';

        if (enabled && form.gst.trim()) {
            if (!gstRegex.test(form.gst)) errors.gst = 'Invalid GST number format';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!selectedPlan) {
            return setToast({ type: 'error', message: 'Please select a plan' });
        }

        if (!employees || employees < 1) {
            return setToast({ type: 'error', message: 'Invalid employee count' });
        }

        const formData = new FormData();
        formData.append("full_name", form.name.trim());
        formData.append("company_name", form.company.trim());
        formData.append("email", form.email.trim());
        formData.append("mobile", form.phone.trim());
        formData.append("whatsapp", form.phone.trim());
        formData.append("address", form.address.trim());
        formData.append("gst_number", form.gst.trim());
        formData.append("is_gst", form.gst.trim() ? "1" : "2");
        formData.append("total_employee", employees);
        formData.append("billing_cycle", billingCycle);
        formData.append("plan_price", pricePerUser);
        formData.append("base_amount", baseAmount);
        formData.append("coupon_code", couponApplied?.code || "");
        formData.append("coupon_per", couponApplied?.discountPct || 0);
        formData.append("coupon_amount", discountAmount || 0);
        formData.append("gst_percentage", 18);
        formData.append("gst_amount", gst);
        formData.append("final_pay_amount", total);

        try {
            setLoading(true);
            const response = await api.post(
                'pro-manager-pay-payment-check/',
                formData,
                { apiType: 'payment' }
            );

            if (response?.data?.success) {
                const redirectUrl = response?.data?.redirect_url;
                setToast({
                    type: 'success',
                    message: response?.data?.message || 'Payment initialized successfully'
                });
                const opened = safeRedirect(redirectUrl);
                if (!opened) {
                    setToast({
                        type: 'error',
                        message: 'Invalid redirect URL. Please try again.'
                    });
                }
            } else {
                setToast({
                    type: 'error',
                    message: response?.data?.message || 'Payment failed'
                });
            }
        } catch (error) {
            let errorMessage = 'Something went wrong. Please try again.';
            if (error.response) {
                errorMessage = error.response?.data?.message || error.response?.data?.error || `Error ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please try again.';
            }
            setToast({ type: 'error', message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F7FD] text-slate-800 font-sans pb-20">
            <Helmet>
                <title>Payment Checkout | ProManager</title>
                <meta name="description" content="Select your plan and complete your payment securely." />
            </Helmet>

            {/* ── Centered Top Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center pt-14 pb-8 px-4"
            >
                <div className="relative inline-block mb-2">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
                    >
                        Payment
                    </motion.h3>
                    <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                        className="absolute top-7 left-1/2 -translate-x-1/2 w-28 h-3"
                        viewBox="0 0 130 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <motion.path
                            d="M2 10C30 2, 60 2, 90 10C105 16, 115 10, 128 10"
                            stroke="url(#grad-pay)"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="grad-pay" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#370D95" />
                                <stop offset="100%" stopColor="#340C8E" />
                            </linearGradient>
                        </defs>
                    </motion.svg>
                </div>

                {/* <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mt-2 mb-3 tracking-tight">
                    Pay Securely &{" "}
                    <span className="text-[#370D95] font-bold">
                        Enjoy Your Plan
                    </span>
                </h2> */}

                <p className="text-base sm:text-lg text-slate-500 font-medium max-w-xl mx-auto">
                    Fill in the required details and pay securely with ProManager.
                </p>
            </motion.div>

            {/* ── Main Outer Wrapper ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

                {/* ── Top Grid: Left Column + Sticky Right Column ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* ── LEFT COLUMN (8 cols) ── */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Card 1: 1. Select Your Plan */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
                            {/* Step Header */}
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-md bg-[#370D95] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                                    1
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                    Select Your Plan
                                </h2>
                            </div>

                            {/* Plan Cards Grid (Silver, Gold - Most Popular, Platinum) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                {[
                                    { name: 'Silver', range: '0-20 users', iconBg: 'bg-purple-100/70 text-purple-700' },
                                    { name: 'Gold', range: '21-100 users', iconBg: 'bg-amber-100/80 text-amber-700', isMostPopular: true },
                                    { name: 'Platinum', range: '101+ users', iconBg: 'bg-blue-100/80 text-blue-700' }
                                ].map((pItem) => {
                                    const foundPlan = plans.find(p => p.name?.toLowerCase() === pItem.name.toLowerCase());
                                    const isSelected = selectedPlan?.name?.toLowerCase() === pItem.name.toLowerCase();

                                    return (
                                        <div
                                            key={pItem.name}
                                            onClick={() => foundPlan && handlePlanSelect(foundPlan)}
                                            className={`relative p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                ? 'border-2 border-[#370D95] bg-purple-50/20 shadow-xs'
                                                : 'border-slate-200 bg-white hover:border-purple-200 shadow-2xs'
                                                }`}
                                        >


                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl ${pItem.iconBg} flex items-center justify-center flex-shrink-0`}>
                                                    <Users size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-bold text-slate-900 truncate">
                                                        {pItem.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                                                        {foundPlan?.user_range || pItem.range}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Radio Circle */}
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                                ? 'bg-[#370D95] text-white'
                                                : 'border border-slate-300 bg-white'
                                                }`}>
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Controls Row: Number of Employees & Billing Cycle */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2 items-center">
                                {/* Left: Number of Employees with FLUID EDITABLE INPUT (Reduced Width) */}
                                <div className="sm:col-span-5 lg:col-span-4">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Number of Employees
                                    </label>
                                    <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/80 flex items-center justify-between h-[42px] max-w-[210px]">
                                        <button
                                            type="button"
                                            onClick={() => setEmployees(Math.max(1, (Number(employees) || 1) - 1))}
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
                                        >
                                            −
                                        </button>

                                        {/* Editable Number Input */}
                                        <input
                                            type="number"
                                            min={1}
                                            max={maxEmployees}
                                            value={employees === 0 || employees === '' ? '' : employees}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    setEmployees('');
                                                } else {
                                                    const num = parseInt(val, 10);
                                                    if (!isNaN(num)) {
                                                        setEmployees(num);
                                                    }
                                                }
                                            }}
                                            onBlur={() => {
                                                if (!employees || Number(employees) < 1) {
                                                    setEmployees(1);
                                                } else if (Number(employees) > maxEmployees) {
                                                    setEmployees(maxEmployees);
                                                }
                                            }}
                                            className="w-14 text-center text-sm font-bold text-[#370D95] bg-white border border-slate-200 focus:border-[#370D95] focus:ring-1 focus:ring-[#370D95]/20 rounded-lg py-0.5 shadow-2xs transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setEmployees(Math.min(maxEmployees, (Number(employees) || 1) + 1))}
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Billing Cycle (With Icons) */}
                                <div className="sm:col-span-7 lg:col-span-8">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Billing Cycle
                                    </label>
                                    <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/80 grid grid-cols-3 gap-1.5 h-[42px] items-center">
                                        {[
                                            { key: 'monthly', label: 'Monthly', icon: Calendar },
                                            { key: 'quarterly', label: 'Quarterly', icon: CalendarDays },
                                            { key: 'yearly', label: 'Yearly', icon: Sparkles }
                                        ].map((item) => {
                                            const isActive = billingCycle === item.key;
                                            const IconComp = item.icon;
                                            return (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    onClick={() => setBillingCycle(item.key)}
                                                    className={`h-full px-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5 leading-none ${isActive
                                                        ? 'bg-[#370D95] text-white font-bold shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <IconComp size={14} className="shrink-0" />
                                                    <span className="leading-none">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: 2. Billing Details */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                            {/* Step Header */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-7 h-7 rounded-md bg-[#370D95] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                                    2
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                    Billing Details
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Full Name */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3.5 text-slate-400">
                                                <User size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Enter Full Name"
                                                value={form.name}
                                                onChange={e => handleFormChange('name', e.target.value)}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all ${formErrors.name ? 'border-red-500' : 'border-slate-200 focus:border-[#370D95]'}`}
                                            />
                                        </div>
                                        {formErrors.name && <span className="text-[11px] text-red-500 mt-1 block">{formErrors.name}</span>}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3.5 text-slate-400">
                                                <Mail size={16} />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Enter Email"
                                                value={form.email}
                                                onChange={e => handleFormChange('email', e.target.value)}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all ${formErrors.email ? 'border-red-500' : 'border-slate-200 focus:border-[#370D95]'}`}
                                            />
                                        </div>
                                        {formErrors.email && <span className="text-[11px] text-red-500 mt-1 block">{formErrors.email}</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Company Name */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3.5 text-slate-400">
                                                <Building2 size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Enter Company Name"
                                                value={form.company}
                                                onChange={e => handleFormChange('company', e.target.value)}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all ${formErrors.company ? 'border-red-500' : 'border-slate-200 focus:border-[#370D95]'}`}
                                            />
                                        </div>
                                        {formErrors.company && <span className="text-[11px] text-red-500 mt-1 block">{formErrors.company}</span>}
                                    </div>

                                    {/* GST Number (Optional) */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            GST Number (Optional)
                                        </label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3.5 text-slate-400">
                                                <Tag size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="e.g. 29AAACK7411M1Z3"
                                                value={form.gst}
                                                onChange={e => handleFormChange('gst', e.target.value)}
                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all ${formErrors.gst ? 'border-red-500' : 'border-slate-200 focus:border-[#370D95]'}`}
                                            />
                                        </div>
                                        {formErrors.gst && <span className="text-[11px] text-red-500 mt-1 block">{formErrors.gst}</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                    {/* Phone Number Field with WhatsApp Verification Link Below */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>

                                        {/* 10-Digit Mobile Input Box */}
                                        <div className={`relative flex items-center h-[42px] w-full rounded-xl border bg-white overflow-hidden transition-all ${formErrors.phone ? 'border-red-500' : 'border-slate-200 focus-within:border-[#370D95] focus-within:ring-1 focus-within:ring-[#370D95]/20'}`}>
                                            {/* Country Selector IN +91 */}
                                            <div className="flex items-center gap-1.5 px-3 h-full bg-slate-50/90 border-r border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shrink-0 select-none">
                                                <span>IN</span>
                                                <span className="font-extrabold text-slate-900">+91</span>
                                                <ChevronDown size={13} className="text-slate-400" />
                                            </div>

                                            {/* Input */}
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                placeholder="9876543210"
                                                value={form.phone}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                    handleFormChange('phone', val);
                                                    if (val.length < 10) {
                                                        setIsPhoneVerified(false);
                                                        setShowOtpRow(false);
                                                    }
                                                }}
                                                className="w-full px-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none bg-transparent tracking-wide min-w-0"
                                            />

                                            {isPhoneVerified && (
                                                <div className="pr-3 shrink-0 flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                                    <CheckCircle2 size={16} />
                                                    <span>Verified</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Verify via WhatsApp Link (Placed BELOW the input box) */}
                                        {!isPhoneVerified && (
                                            <div className="mt-1.5">
                                                {form.phone.length === 10 ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleSendOtp}
                                                        className="text-xs text-[#370D95] font-bold underline cursor-pointer hover:text-purple-900 transition-colors whitespace-nowrap"
                                                    >
                                                        Verify via WhatsApp
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-semibold underline opacity-60 cursor-not-allowed select-none whitespace-nowrap">
                                                        Verify via WhatsApp
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {formErrors.phone && <span className="text-[11px] text-red-500 mt-1 block">{formErrors.phone}</span>}
                                    </div>

                                        {/* OTP Verification Card (Full width smooth row when triggered) */}
                                        {showOtpRow && !isPhoneVerified && (
                                            <div className="sm:col-span-2 bg-slate-50/90 border border-purple-100 rounded-2xl p-4 animate-fadeIn space-y-2">
                                                <label className="text-xs font-bold tracking-wider text-slate-700 uppercase block">
                                                    VERIFICATION CODE (SENT TO WHATSAPP)
                                                </label>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    {/* 6-Digit Code Input */}
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        placeholder="6-digit code"
                                                        value={otpInput}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                            setOtpInput(val);
                                                        }}
                                                        className="h-11 w-40 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 font-bold bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-[#370D95] focus:ring-1 focus:ring-[#370D95]/20 text-center tracking-widest shadow-2xs"
                                                    />

                                                    {/* Confirm Button */}
                                                    <button
                                                        type="button"
                                                        disabled={otpInput.length < 6}
                                                        onClick={() => {
                                                            if (otpInput.length === 6) {
                                                                setIsPhoneVerified(true);
                                                                setToast({ type: 'success', message: 'Phone number verified via WhatsApp!' });
                                                            }
                                                        }}
                                                        className={`h-11 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center justify-center ${otpInput.length === 6
                                                            ? 'bg-[#370D95] hover:bg-purple-900 text-white cursor-pointer shadow-sm'
                                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200/80'
                                                            }`}
                                                    >
                                                        Confirm Code
                                                    </button>

                                                    {/* Resend Link with 30s Countdown Timer */}
                                                    {resendTimer > 0 ? (
                                                        <span className="text-xs text-slate-500 font-semibold bg-white px-3 py-2 rounded-xl border border-slate-200/80 shrink-0 select-none shadow-2xs">
                                                            Resend OTP in <strong className="text-[#370D95]">{resendTimer}s</strong>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setResendTimer(30);
                                                                setToast({ type: 'success', message: 'OTP resent to WhatsApp!' });
                                                            }}
                                                            className="text-xs text-[#370D95] font-bold underline hover:text-purple-900 cursor-pointer shrink-0 py-2 px-1"
                                                        >
                                                            Resend Code
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Company Address */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Company Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-3.5 text-slate-400">
                                            <MapPin size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter Company Address"
                                            value={form.address}
                                            onChange={e => handleFormChange('address', e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all ${formErrors.address ? 'border-red-500' : 'border-slate-200 focus:border-[#370D95]'}`}
                                        />
                                    </div>
                                    {formErrors.address && <span className="text-[11px] text-red-500 mt-1 block">{formErrors.address}</span>}
                                </div>
                            </form>
                        </div>

                    </div>

                    {/* ── RIGHT COLUMN (4 cols - Price Details Sticky Card) ── */}
                    <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
                            {/* Header */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#370D95] flex items-center justify-center">
                                    <Wallet size={18} />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                    Price Details
                                </h2>
                            </div>

                            {/* Active Plan Gold Pill */}
                            <div className="bg-[#FFF9E6] border border-[#FFE7A3] text-[#B47800] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold w-fit">
                                <Crown size={14} className="text-amber-600 flex-shrink-0" />
                                <span>{selectedPlan?.name || "Gold"} Plan • {selectedPlan?.user_range || "21-100"} users</span>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 text-sm text-slate-600 border-b border-slate-100 pb-4">
                                <div className="flex justify-between items-center">
                                    <span>{employees} users × Rs.{pricePerUser} × {months} mo</span>
                                    <span className="font-semibold text-slate-700">Rs.{fmt(baseAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>GST (18%)</span>
                                    <span className="font-semibold text-slate-700">Rs.{fmt(gst)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1 font-semibold text-slate-800">
                                    <span>Subtotal</span>
                                    <span>Rs.{fmt(baseAmount)}</span>
                                </div>
                            </div>

                            {/* Total Row */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-900">Total</span>
                                <span className="text-xl font-bold text-[#370D95]">Rs.{fmt(total)}</span>
                            </div>

                            {/* Coupon Code Section */}
                            <div className="bg-[#F6F4FF] border border-purple-100/80 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Percent size={14} className="text-[#370D95]" />
                                    <span>Have a coupon code?</span>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponInput}
                                        onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#370D95]"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyCoupon}
                                        disabled={!couponInput.trim()}
                                        className="px-4 py-2 rounded-xl bg-[#EBE5FF] text-[#370D95] hover:bg-[#370D95] hover:text-white font-bold text-xs transition-all disabled:opacity-40 cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </div>

                                {/* Dynamic Coupon Cards from API (Fallback to COUPON_LIST if empty) */}
                                {(apiCoupons.length > 0 ? apiCoupons : COUPON_LIST).map((c, idx) => {
                                    const code = c.coupon_code || c.code || 'WELCOME';
                                    const desc = c.coupon_desc || c.desc || (c.coupon_per ? `${c.coupon_per}% off on any plan. No minimum.` : c.label || 'Special discount coupon');
                                    const expiry = c.expiry_date || c.expiry || c.valid_till || '31st Dec 2026';
                                    const isApplied = couponApplied?.code === code.toUpperCase();

                                    return (
                                        <div
                                            key={code + idx}
                                            onClick={() => { setCouponInput(code); applyCoupon(code); }}
                                            className={`border border-dashed rounded-xl p-3 bg-white flex items-center justify-between gap-3 cursor-pointer transition-all ${isApplied ? 'border-emerald-500 bg-emerald-50/30' : 'border-purple-200 hover:border-purple-300'
                                                }`}
                                        >
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <Tag size={12} className="text-[#370D95]" />
                                                    <span className="text-xs font-bold text-[#370D95]">
                                                        {code}
                                                    </span>
                                                    {isApplied && (
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                                                            Applied
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[13px] text-slate-500 font-medium truncate">{desc}</p>
                                                {/* <p className="text-[11px] text-slate-400">Expires on: <span className="font-semibold">{expiry}</span></p> */}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setCouponInput(code); applyCoupon(code); }}
                                                className="text-md font-bold text-[#370D95] hover:underline flex-shrink-0 cursor-pointer"
                                            >
                                                {isApplied ? 'Applied' : 'Apply'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 100% Secure Payment Note */}
                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">100% Secure Payment</h4>
                                    <p className="text-[12px] text-slate-500 mt-0.5">Your payment details are encrypted and safe.</p>
                                </div>
                            </div>

                            {/* Pay Now Button */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="w-full py-3.5 rounded-xl bg-[#370D95] hover:bg-[#280970] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Lock size={16} />
                                <span>Pay Now – Rs.{fmt(total)}</span>
                            </button>

                            <div className="text-center text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                                <span className="text-emerald-600">✓</span> Secured by SSL • Razorpay
                            </div>

                        </div>
                    </div>

                </div>

                {/* ── Bottom Full-Width Trust Banner (Extends across FULL LEFT & RIGHT width) ── */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    <div className="flex items-center gap-3 sm:pl-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-[#370D95] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <h4 className="text-md font-bold text-slate-900">Secure & Encrypted</h4>
                            <p className="text-[13px] text-slate-500">Your data is 100% secure</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:pl-4 pt-3 sm:pt-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <Zap size={16} />
                        </div>
                        <div>
                            <h4 className="text-md font-bold text-slate-900">Instant Activation</h4>
                            <p className="text-[13px] text-slate-500">Get started immediately</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:pl-4 pt-3 sm:pt-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Headphones size={16} />
                        </div>
                        <div>
                            <h4 className="text-md font-bold text-slate-900">24/7 Support</h4>
                            <p className="text-[13px] text-slate-500">We're here to help</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:pl-4 pt-3 sm:pt-0">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <RotateCcw size={16} />
                        </div>
                        <div>
                            <h4 className="text-md font-bold text-slate-900">Money Back Guarantee</h4>
                            <p className="text-[13px] text-slate-500">7-day money back guarantee</p>
                        </div>
                    </div>
                </div>

            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
            />
        </div>
    );
};

export default PaymentPage;
