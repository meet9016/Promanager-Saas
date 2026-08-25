import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, CheckCircle2, Info } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import API from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { setPermissions } from "../../redux/permissionsSlice";
import { agreementSchema } from "./validation";
import { Toast } from "../ui/Toast";

const RegisterModal = ({ isOpen, onClose }) => {
    const { login } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        company_name: "",
        email: "",
        mobile: "",
        gst_number: "",
        whatsapp: "",
        address: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const [showOtpRow, setShowOtpRow] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    useEffect(() => {
        let timerId;
        if (showOtpRow && resendTimer > 0 && !isPhoneVerified) {
            timerId = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timerId);
    }, [showOtpRow, resendTimer, isPhoneVerified]);

    const handleSendOtp = async () => {
        if (!form.mobile || form.mobile.length !== 10) {
            setToast({ type: 'error', message: 'Please enter a valid 10-digit mobile number' });
            return;
        }
        try {
            setIsSendingOtp(true);
            const formData = new FormData();
            formData.append("mobile", form.mobile);

            const res = await API.post("send_mobile_otp", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const isOk = res?.data?.success === true ||
                res?.data?.success === "true" ||
                res?.data?.status === true ||
                res?.data?.status === "true" ||
                res?.data?.status === 200 ||
                res?.data?.status === "200" ||
                res?.data?.status === "success" ||
                res?.data?.status === 1 ||
                res?.data?.status === "1";

            if (isOk) {
                setShowOtpRow(true);
                setResendTimer(30);
                setToast({ type: 'success', message: res.data?.message || 'OTP sent successfully!' });
            } else {
                setToast({ type: 'error', message: res?.data?.message || 'Failed to send OTP.' });
            }
        } catch (err) {
            console.error(err);
            setToast({
                type: 'error',
                message: err?.response?.data?.message || 'Failed to send OTP. Please try again.',
            });
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpInput || otpInput.length !== 6) {
            setToast({ type: 'error', message: 'Please enter 6-digit OTP' });
            return;
        }
        try {
            setIsVerifyingOtp(true);
            const formData = new FormData();
            formData.append("mobile", form.mobile);
            formData.append("otp", otpInput);

            const res = await API.post("verify_mobile_otp", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const isOk = res?.data?.success === true ||
                res?.data?.success === "true" ||
                res?.data?.status === true ||
                res?.data?.status === "true" ||
                res?.data?.status === 200 ||
                res?.data?.status === "200" ||
                res?.data?.status === "success" ||
                res?.data?.status === 1 ||
                res?.data?.status === "1";

            if (isOk) {
                setIsPhoneVerified(true);
                setShowOtpRow(false);
                setToast({ type: 'success', message: res?.data?.message || 'Mobile number verified successfully!' });
            } else {
                setToast({ type: 'error', message: res?.data?.message || 'Invalid OTP. Please try again.' });
            }
        } catch (err) {
            console.error(err);
            setToast({
                type: 'error',
                message: err?.response?.data?.message || 'OTP verification failed. Please try again.',
            });
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY;
    const COOKIE_EXPIRY_DAYS = 7;

    const encrypt = (val) =>
        CryptoJS.AES.encrypt(val, SECRET_KEY).toString();

    const flattenPermissions = (permissionsArray) =>
        permissionsArray.reduce((acc, item) => ({ ...acc, ...item }), {});

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
            ...(field === "mobile" ? { whatsapp: value } : {}),
        }));
        setErrors((prev) => ({
            ...prev,
            [field]: "",
            ...(field === "mobile" ? { whatsapp: "" } : {}),
        }));
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        try {
            setErrors({});
            setIsLoading(true);

            await agreementSchema.validate(form, {
                abortEarly: false,
            });

            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const res = await API.post("create_account_free_account", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const { success, message, user_data, token } = res.data;

            if (!success) {
                setToast({
                    message: message || "Signup failed.",
                    type: "error",
                });
                return;
            }

            // Save token
            if (token) {
                localStorage.setItem("token", token);
            }

            // Login auth flow
            if (user_data?.user_id) {
                const userData = {
                    user_id: user_data.user_id,
                    full_name: user_data.full_name,
                    username: user_data.username,
                    email: user_data.email || "",
                    number: user_data.number,
                    type: user_data.type,
                    user_roles_id: user_data.user_role_id,
                    subscriptions_status: user_data.subscriptions_status,
                    subscriptions_days: user_data.subscriptions_days,
                };

                login(userData, true);

                // Fetch Permissions
                const permFormData = new FormData();
                permFormData.append("user_roles_id", user_data.user_role_id);

                const permRes = await API.post("user_permissions", permFormData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (permRes.data?.data) {
                    dispatch(
                        setPermissions(
                            flattenPermissions(permRes.data.data)
                        )
                    );
                }

                // Remember credentials
                Cookies.set("rememberMe", "1", {
                    expires: COOKIE_EXPIRY_DAYS,
                });

                Cookies.set(
                    "savedNumber",
                    encrypt(form.mobile),
                    {
                        expires: COOKIE_EXPIRY_DAYS,
                    }
                );
            }

            setToast({
                message: message || "Signup successful!",
                type: "success",
            });

            setTimeout(() => {
                onClose();
                navigate("/dashboard");
            }, 1500);

        } catch (err) {
            if (err.name === "ValidationError") {
                const fieldErrors = {};
                err.inner.forEach((error) => {
                    fieldErrors[error.path] = error.message;
                });
                setErrors(fieldErrors);
            } else {
                console.error(err);
                setToast({
                    message: err?.response?.data?.message || "Signup failed. Please try again.",
                    type: "error",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]"
                            onClick={onClose}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            Register Form
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Fill all required details carefully
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>

                                {/* Form Body */}
                                <div className="p-6 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                        {/* Full Name */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter full name"
                                                value={form.full_name}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "full_name",
                                                        e.target.value.replace(/[^A-Za-z\s]/g, "")
                                                    )
                                                }
                                                className={`w-full h-12 px-4 rounded-xl border ${errors.full_name ? "border-red-500" : "border-gray-200"
                                                    } focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
                                            />
                                            {errors.full_name && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.full_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Company Name */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Company Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter company name"
                                                value={form.company_name}
                                                onChange={(e) => handleChange("company_name", e.target.value)}
                                                className={`w-full h-12 px-4 rounded-xl border ${errors.company_name ? "border-red-500" : "border-gray-200"
                                                    } focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
                                            />
                                            {errors.company_name && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.company_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                value={form.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                className={`w-full h-12 px-4 rounded-xl border ${errors.email ? "border-red-500" : "border-gray-200"
                                                    } focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        {/* GST Number (Optional) */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                GST Number <span className="text-gray-400 text-sm">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter GST number"
                                                value={form.gst_number}
                                                onChange={(e) => handleChange("gst_number", e.target.value)}
                                                className={`w-full h-12 px-4 rounded-xl border ${errors.gst_number ? "border-red-500" : "border-gray-200"
                                                    } focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
                                            />
                                            {errors.gst_number && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.gst_number}
                                                </p>
                                            )}
                                        </div>

                                        {/* Mobile Number Field with WhatsApp Verification */}
                                        <div className={showOtpRow && !isPhoneVerified ? "md:col-span-2" : ""}>
                                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 flex-wrap">
                                                <span>Mobile Number <span className="text-red-500">*</span></span>
                                                <span className="inline-flex items-center gap-1 text-xs text-purple-700 font-medium select-none">
                                                    <Info size={14} className="text-[#370D95] shrink-0" />
                                                    <span>Verify Your Mobile Number Through WhatsApp</span>
                                                </span>
                                            </label>

                                            <div className="flex flex-col sm:flex-row items-start gap-3">
                                                {/* 10-Digit Mobile Input Box */}
                                                <div className={`relative flex items-center h-11 w-full ${showOtpRow && !isPhoneVerified ? "sm:w-[250px]" : "w-full"} rounded-xl border bg-white overflow-hidden transition-all ${errors.mobile ? "border-red-500" : "border-gray-200 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20"}`}>
                                                    {/* Country Code (+91) */}
                                                    <div className="flex items-center px-3 h-full bg-slate-50 border-r border-gray-200 text-slate-800 font-bold text-xs shrink-0 select-none">
                                                        <span className="font-extrabold text-slate-900">+91</span>
                                                    </div>

                                                    {/* Input */}
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={10}
                                                        placeholder="Enter mobile number"
                                                        value={form.mobile}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                            handleChange("mobile", val);
                                                            if (val.length < 10) {
                                                                setIsPhoneVerified(false);
                                                                setShowOtpRow(false);
                                                            }
                                                        }}
                                                        className="w-full px-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none bg-transparent tracking-wide min-w-0"
                                                    />

                                                    {/* Verify Link (INSIDE input box on right side) */}
                                                    {isPhoneVerified ? (
                                                        <div className="pr-3 shrink-0 flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                                            <CheckCircle2 size={15} />
                                                            <span>Verified</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleSendOtp}
                                                            disabled={form.mobile.length < 10 || isSendingOtp}
                                                            className={`pr-3 pl-2 h-full flex items-center shrink-0 font-bold text-xs select-none transition-all ${form.mobile.length === 10 && !isSendingOtp
                                                                    ? "cursor-pointer text-[#370D95] hover:text-purple-900 underline"
                                                                    : "cursor-not-allowed text-slate-400 opacity-60"
                                                                }`}
                                                        >
                                                            {isSendingOtp ? "Sending..." : "Verify"}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* OTP Input Box with Confirm Button INSIDE (One row with Mobile box) */}
                                                {showOtpRow && !isPhoneVerified && (
                                                    <div className="flex flex-col gap-1 w-full sm:w-auto animate-fadeIn shrink-0">
                                                        {/* OTP Input Container with Confirm Button INSIDE */}
                                                        <div className="relative flex items-center h-11 w-full sm:w-[240px] rounded-xl border border-gray-200 bg-white overflow-hidden transition-all focus-within:border-[#370D95] focus-within:ring-2 focus-within:ring-[#370D95]/20 shadow-2xs">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                maxLength={6}
                                                                placeholder="Enter 6-digit OTP"
                                                                value={otpInput}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                                    setOtpInput(val);
                                                                }}
                                                                className="w-full px-3 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent tracking-widest min-w-0"
                                                            />

                                                            {/* Confirm Button INSIDE right side of OTP Box */}
                                                            <button
                                                                type="button"
                                                                disabled={otpInput.length < 6 || isVerifyingOtp}
                                                                onClick={handleVerifyOtp}
                                                                className={`px-3.5 h-full flex items-center justify-center shrink-0 font-bold text-xs select-none transition-all ${otpInput.length === 6 && !isVerifyingOtp
                                                                        ? "cursor-pointer bg-[#370D95] hover:bg-purple-900 text-white"
                                                                        : "cursor-not-allowed bg-slate-100 text-slate-400 border-l border-slate-200"
                                                                    }`}
                                                            >
                                                                {isVerifyingOtp ? "Verifying..." : "Confirm"}
                                                            </button>
                                                        </div>

                                                        {/* Below OTP box: resend otp (30) Countdown Format */}
                                                        <div className="text-xs text-slate-500 font-medium px-1">
                                                            {resendTimer > 0 ? (
                                                                <span>resend otp ({resendTimer})</span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSendOtp}
                                                                    disabled={isSendingOtp}
                                                                    className="text-[#370D95] font-bold underline hover:text-purple-900 cursor-pointer disabled:opacity-50"
                                                                >
                                                                    {isSendingOtp ? "sending..." : "resend otp"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {errors.mobile && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.mobile}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="mt-5">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Enter full address"
                                            value={form.address}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border ${errors.address ? "border-red-500" : "border-gray-200"
                                                } focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
                                        />
                                        {errors.address && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
                                        <button
                                            onClick={onClose}
                                            disabled={isLoading}
                                            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isLoading || !isPhoneVerified}
                                            className={`px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 ${isLoading || !isPhoneVerified
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "cursor-pointer"
                                                }`}
                                        >
                                            {isLoading ? "Signing up..." : "Sign Up"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
};

export default RegisterModal;
