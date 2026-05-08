// PaymentPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from "@dr.pogodin/react-helmet";
import api from '../../../api/axiosInstance';
import { Toast } from '../../ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from "react-router-dom";



// ─── Reusable UI ─────────────────────────────────────────────────────────────
const Field = ({ label, required, right, children }) => (

    <div className="flex flex-col gap-1.5 my-2">

        <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">
                {label}
                {required && <span className="text-[#6C4CF1] ml-0.5">*</span>}
            </label>

            {right && <div>{right}</div>}
        </div>

        {children}
    </div>
);

const Input = (props) => (
    <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800
        placeholder:text-gray-300 focus:outline-none focus:border-[#6C4CF1] focus:ring-2
        focus:ring-[#6C4CF1]/15 transition-all"
    />
);

// ─── Constants ────────────────────────────────────────────────────────────────

const COUPON_LIST = [
    { code: 'WELCOME', discountPct: 5, label: 'Save 5%', desc: '5% off on any plan. No minimum.', expiry: '31st Dec 2026' },
];

// API billing_cycle string → number of months
const CYCLE_MONTHS = {
    monthly: 1,
    quarterly: 3,
    yearly: 12,
};

const PLAN_COLORS = {
    Silver: { gradient: 'from-[#94a3b8] to-[#64748b]', accent: '#64748b' },
    Gold: { gradient: 'from-[#f59e0b] to-[#d97706]', accent: '#d97706' },
    Platinum: { gradient: 'from-[#6C4CF1] to-[#4B2EDB]', accent: '#6C4CF1' },
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ─── Component ────────────────────────────────────────────────────────────────
const Renew = () => {

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [employees, setEmployees] = useState(null);
    const [employeesLimit, setEmployeesLimit] = useState(null);


    const [billingCycle, setBillingCycle] = useState('yearly');
    // const [form, setForm] = useState({ name: '', email: '', company: '', gst: '', phone: '', whatsapp: '', address: '' });
    const [couponInput, setCouponInput] = useState('');

    const [couponApplied, setCouponApplied] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [enabled, setEnabled] = useState(false);
    const [gstNumber, setGstNumber] = useState('');


    // ── Derived ───────────────────────────────────────────────────────────────
    const availableCycles = selectedPlan?.billing_cycle ?? [];
    const months = CYCLE_MONTHS[billingCycle] ?? 1;
    const pricePerUser = useMemo(() => Number(selectedPlan?.price_per_user ?? 0), [selectedPlan]);
    const planColors = PLAN_COLORS[selectedPlan?.name] ?? PLAN_COLORS.Platinum;

    const [toast, setToast] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();


    useEffect(() => {
        if (employees < employeesLimit) {
            setToast({
                type: 'error',
                message: "You can't add less employees than existing employees."
            });

            setEmployees(employeesLimit)

        }
    }, [employeesLimit, employees])

    // ── Calculations ──────────────────────────────────────────────────────────
    // employees x price_per_user x months (from billing cycle)
    const baseAmount = useMemo(
        () => employees * pricePerUser * months,
        [employees, pricePerUser, months]
    );

    // 4. Collapse taxableAmount / gst / total into one useMemo

    const { discountAmount, taxableAmount, gst, total } = useMemo(() => {
        const disc = couponApplied ? Math.round(baseAmount * couponApplied.discountPct / 100) : 0;
        const taxable = baseAmount - disc;
        const tax = enabled ? Math.round(taxable * 0.18) : 0;

        return {
            discountAmount: disc,
            taxableAmount: taxable,
            gst: tax,
            total: taxable + tax
        };
    }, [baseAmount, couponApplied, enabled]);

    // getRange — handle "101+" correctly (max should allow current employees, not cap it)
    const getRange = (range) => {
        if (range.includes('+')) return { min: Number(range.replace('+', '')), max: Infinity };
        const [min, max] = range.split('-').map(Number);
        return { min, max };
    };

    useEffect(() => {
        if (!plans.length || !employees) return;
        const matched = plans.find(p => { const { min, max } = getRange(p.user_range); return employees >= min && employees <= max; });
        const newPlan = matched || plans[plans.length - 1];
        if (newPlan && newPlan.id !== selectedPlan?.id) {
            setSelectedPlan(newPlan);
            if (newPlan.billing_cycle?.length) setBillingCycle(newPlan.billing_cycle[newPlan?.billing_cycle.length - 1]);
        }
    }, [employees, plans])


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
                    const data = response.data.data;
                    setPlans(data);
                    if (data.length > 0) {
                        setSelectedPlan(data[0]);
                        setBillingCycle(data[0]?.billing_cycle?.[data[0]?.billing_cycle.length - 1]);
                    }
                } else {
                    console.error(response?.data?.message || 'Failed to fetch pricing data');
                }
            } catch (err) {
                console.error('Error fetching pricing data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlanData();
    }, []);

    useEffect(() => {
        const fetchRenewDetails = async () => {
            if (!user) {
                return;
            };

            const formData = new FormData();
            formData.append('user_id', user?.user_id);

            try {
                setLoading(true);
                const response = await api.post('user_renew_details_featch', formData, {
                    apiType: 'web'
                });
                if (response?.data?.success) {

                    setEmployees(response.data.data.total_employee)
                    setEmployeesLimit(response.data.data.total_employee)
                    setEnabled(response.data.data.is_gst === 1)
                    if (response.data.data.is_gst === 1) {
                        setGstNumber(response.data.data.gst_number)
                    }

                } else {
                    setToast({
                        type: 'error',
                        message: response?.data?.message || "Please login first !"
                    });
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                    console.error(response?.data?.message || 'Failed to fetch pricing data');
                }
            } catch (err) {
                console.error('Error fetching pricing data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRenewDetails();
    }, [user]);

    // ── Plan select ───────────────────────────────────────────────────────────

    const handlePlanSelect = (plan) => {
        const { min, max } = getRange(plan.user_range);
        const clampedEmployees = max === Infinity
            ? Math.max(employees, min)
            : Math.min(Math.max(employees, min), max);
        if (employees < employeesLimit) {

            setToast({
                type: 'error',
                message: "You can't add less employees than existing employees."
            });

            setEmployees(employeesLimit)
            return;
        }
        setEmployees(clampedEmployees);
        setSelectedPlan(plan);
        if (plan.billing_cycle?.length) setBillingCycle(plan?.billing_cycle?.[plan?.billing_cycle.length - 1]);
    };

    const maxEmployees = useMemo(() => {
        if (!plans.length) return 500;
        const last = getRange(plans[plans.length - 1].user_range);
        return last.max === Infinity ? 9999 : last.max;
    }, [plans]);

    // ── Coupon ────────────────────────────────────────────────────────────────
    const applyCoupon = async () => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('coupon_code', couponInput);
            const response = await api.post('apply_coupon', formData, {
                apiType: 'web'
            });
            if (response?.data?.success) {
                const data = response.data.data;
                setCouponApplied({
                    code: couponInput.toUpperCase(),
                    discountPct: Number(data.coupon_per || 0)
                });


            } else {
                setToast({
                    type: 'error',
                    message: response?.data?.message || " Invalid Coupon Code!"
                });
                console.error(response?.data?.message || 'Failed to fetch pricing data');

            }
        } catch (err) {
            console.error('Error fetching pricing data:', err);
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

            // ✅ allow only http / https
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return false;
            }

            // (optional) whitelist domains
            // const allowedHosts = ['promanager.in', 'razorpay.com'];
            // if (!allowedHosts.some(h => parsed.hostname.includes(h))) return false;

            // ✅ open safely in new tab
            window.location.href = parsed.href;

            return true;
        } catch {
            return false;
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!user) {
            setToast({
                type: 'error',
                message: 'Please login first.'
            });
            navigate('/login');
            return;
        }

        // ─── PREPARE DATA ────────────────────────────────────
        const formData = new FormData();


        formData.append("user_id", user.user_id);
        formData.append("gst_number", enabled ? gstNumber : "");
        formData.append("total_employee", employees);
        formData.append("billing_cycle", billingCycle);
        formData.append("is_gst", enabled ? "1" : "2");
        formData.append("plan_price", pricePerUser);
        formData.append("gst_percentage", enabled ? 18 : 0);
        formData.append("gst_amount", enabled ? gst : 0);
        formData.append("final_pay_amount", total);

        // ─── API CALL ────────────────────────────────────────
        try {
            setLoading(true);

            const response = await api.post(
                'pro-manager-renew-pay-payment-check/',
                formData,
                { apiType: 'payment' }
            );

            if (response?.data?.success) {
                const redirectUrl = response?.data?.redirect_url;
                localStorage.clear()
                sessionStorage.clear()
                setToast({
                    type: 'success',
                    message: response?.data?.message || 'Payment initialized successfully'
                });

                // 🔥 safe redirect
                const opened = safeRedirect(redirectUrl);

                if (!opened) {
                    setToast({
                        type: 'error',
                        message: 'Invalid redirect URL. Please try again.'
                    });
                }
            } else {
                // backend returned success = false
                setToast({
                    type: 'error',
                    message: response?.data?.message || 'Payment failed'
                });
            }

        } catch (error) {

            
            let errorMessage = 'Something went wrong. Please try again.';

            //  1. Backend error (most important)

            if (error.response) {
                errorMessage =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    `Error ${error.response.status}`;
            }

            //  2. No response (network issue)
            else if (error.request) {
                errorMessage = 'Network error. Please check your internet connection.';
            }

            // 🔥 3. Timeout or Axios config error
            else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please try again.';
            }

            // 🔥 Toast + log
            setToast({
                type: 'error',
                message: errorMessage
            });

            console.error('Payment error:', {
                message: errorMessage,
                raw: error
            });

        } finally {
            setLoading(false);
        }
    };



    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>Payment | ProManager</title>
                <meta name="description" content="Secure payment." />
            </Helmet>

            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.8 }}
                className="text-center pt-16 pb-10 px-4"
            >
                <div className="relative inline-block mb-8">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.6 }}
                        className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]"
                    >Renew</motion.h3>
                    <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                        className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-4"
                        viewBox="0 0 130 12" fill="none" xmlns="http://www.w3.org/2000/svg"
                    >
                        <motion.path d="M2 10C30 2, 60 2, 90 10C105 16, 115 10, 128 10"
                            stroke="url(#grad-pay)" strokeWidth="3" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="grad-pay" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6C4CF1" /><stop offset="100%" stopColor="#4B2EDB" />
                            </linearGradient>
                        </defs>
                    </motion.svg>
                </div>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-[var(--color-text-primary)] mb-4">
                    Renew Securely &{" "}
                    <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
                        Enjoy Your Plan
                    </span>
                </h2>
                <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                    Fill in the required details and pay securely with ProManager.
                </p>
            </motion.div>

            {/* ── Body ── */}
            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_340px] gap-6 items-start">

                    {/* LEFT */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }} className="space-y-5">

                        {/* Select Plan card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                            <h2 className="text-base font-bold text-gray-800 mb-4">Select Plan</h2>

                            {/* Plan Tabs */}
                            {loading ? (
                                <div className="grid grid-cols-3 gap-2 mb-5">
                                    {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 mb-5">
                                    {plans.map((p) => {
                                        const colors = PLAN_COLORS[p.name] ?? PLAN_COLORS.Platinum;
                                        const isActive = selectedPlan?.id === p.id;
                                        return (
                                            <button key={p.id} type="button" onClick={() => handlePlanSelect(p)}
                                                className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all
                                                ${isActive
                                                        ? `bg-gradient-to-r ${colors.gradient} text-white border-transparent shadow-md`
                                                        : 'border-gray-200 text-gray-500 hover:border-[#6C4CF1]/40'}`}>
                                                {p.name}
                                                <div className={`text-[10px] font-normal mt-0.5 ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                                                    {p.user_range} users
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Employees */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                                        No. of Employees
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setEmployees(Math.max(1, employees - 1))}
                                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-[#6C4CF1] font-bold text-lg hover:bg-[#6C4CF1] hover:text-white transition-all flex items-center justify-center">−</button>
                                        <input type="number" value={employees} min={1}

                                            max={maxEmployees}
                                            onChange={e => setEmployees(Math.max(1, Math.min(maxEmployees, Number(e.target.value))))}
                                            className="w-16 text-center text-2xl font-black text-[#6C4CF1] 
border border-gray-200 rounded-lg 
focus:outline-none focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/20" />
                                        <button type="button" onClick={() => setEmployees(Math.min(maxEmployees, employees + 1))}
                                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-[#6C4CF1] font-bold text-lg hover:bg-[#6C4CF1] hover:text-white transition-all flex items-center justify-center">+</button>
                                    </div>

                                </div>

                                {/* Billing Cycle — rendered from API billing_cycle array */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                                        Billing Cycle
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {availableCycles.map(cycle => (
                                            <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)}
                                                className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all border
                                                ${billingCycle === cycle
                                                        ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow'
                                                        : 'border-gray-200 text-gray-500 hover:border-[#6C4CF1]/40'}`}>
                                                {cycle}
                                            </button>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        </div>


                    </motion.div>

                    {/* RIGHT — Sticky Summary */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:sticky lg:top-6 space-y-4">

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

                            <h2 className="text-base font-bold text-gray-800 mb-5">Price Details</h2>
                            {selectedPlan && (
                                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${planColors.gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                                    {selectedPlan.name} Plan · {selectedPlan.user_range} users
                                </div>
                            )}

                            <div className="space-y-3 text-sm">
                                {/* Base amount row */}
                                <div className="flex justify-between text-gray-500">
                                    <span>{employees} users x Rs.{pricePerUser} x {months} mo</span>
                                    <span className="font-semibold text-gray-700">Rs.{fmt(baseAmount)}</span>
                                </div>

                                {/* Coupon rows — only when applied */}
                                {/* {couponApplied && (<>
                                    <div className="flex justify-between text-green-600">
                                        <span>Coupon ({couponApplied.code} · {couponApplied.discountPct}% off)</span>
                                        <span className="font-semibold">-Rs.{fmt(discountAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                        <span>Subtotal after discount</span>
                                        <span className="font-semibold text-gray-700">Rs.{fmt(taxableAmount)}</span>
                                    </div>
                                </>)} */}

                                {/* GST on taxable amount */}
                                {enabled && <div className="flex justify-between text-gray-500">
                                    <span>GST ({gstNumber}):</span>
                                    <span className="font-semibold text-gray-700">Rs.{fmt(gst)} (18%)</span>
                                </div>}

                                <div className="flex justify-between text-base  text-gray-900">

                                    {/* <Field label="Coupon Code">
                                        {couponApplied ? (
                                            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-green-200 bg-green-50">
                                                <span className="text-sm text-green-700">
                                                    {couponApplied.code} — {couponApplied.discountPct}% off applied
                                                </span>
                                                <button type="button" onClick={removeCoupon}
                                                    className="text-xs text-red-400 hover:text-red-600 font-semibold ml-3 transition-colors">
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                              
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="coupon code" value={couponInput}
                                                        onChange={e => { setCouponInput(e.target.value); setCouponError(''); }}
                                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm
                    text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#6C4CF1]
                    focus:ring-2 focus:ring-[#6C4CF1]/15 transition-all uppercase tracking-widest" />
                                                    <button type="button" onClick={applyCoupon} disabled={!couponInput.trim()}
                                                        className="px-5 py-2.5 rounded-xl bg-[#6C4CF1] text-white text-sm font-semibold
                    hover:bg-[#4B2EDB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                                        Apply
                                                    </button>
                                                </div>

                                           
                                                <div className="mt-3 space-y-2">
                                                    {COUPON_LIST.map((c) => (
                                                        <div key={c.code}
                                                            className="flex items-start gap-3 border border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-[#6C4CF1]/40 transition-colors cursor-pointer group"
                                                            onClick={() => { setCouponInput(c.code); setCouponError(''); }}>
                                                      
                                                            <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors
                            ${couponInput === c.code ? 'bg-[#6C4CF1] border-[#6C4CF1]' : 'border-gray-300 group-hover:border-[#6C4CF1]'}`}>
                                                                {couponInput === c.code && (
                                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                
                                                                <div className="inline-block border border-dashed border-[#6C4CF1]/60 rounded-md px-2 py-0.5 mb-1">
                                                                    <span className="text-xs font-bold text-[#6C4CF1] tracking-widest">{c.code}</span>
                                                                </div>
                                                                <p className="text-xs font-semibold text-gray-800">{c.label}</p>
                                                                <p className="text-[11px] text-gray-400">{c.desc}</p>
                                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                                    Expires on: <span className="font-medium text-gray-500">{c.expiry}</span>
                                                                </p>
                                                            </div>

                                                            <button type="button"
                                                                onClick={(e) => { e.stopPropagation(); setCouponInput(c.code); setCouponError(''); setTimeout(applyCoupon, 0); }}
                                                                className="self-center text-xs font-bold text-[#6C4CF1] hover:text-[#4B2EDB] whitespace-nowrap transition-colors">
                                                                APPLY
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                                    </Field> */}

                                </div>


                                <div className="h-px bg-gray-100 my-1" />

                                <div className="flex justify-between text-base font-extrabold text-gray-900">
                                    <span>Total</span>
                                    <span className="text-[#6C4CF1]">Rs.{fmt(total)}</span>
                                </div>


                                <p className="text-[11px] text-gray-400">
                                    Billed {billingCycle} ({months} month{months > 1 ? 's' : ''} per cycle) · Inclusive of all taxes
                                </p>
                            </div>

                            <button onClick={() => handleSubmit()}
                                className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#6C4CF1]/30 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Renew Now · Rs.{fmt(total)}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Secured by SSL · Razorpay
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
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

export default Renew;