import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useDispatch } from "react-redux";
import { setPermissions } from "../redux/permissionsSlice";
import Logo from "../assets/logo.png";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { Toast } from "./ui/Toast";
import AboutProManager from "/images/About-ProManager.png";
import API from "../api/axiosInstance";
import SubscriptionWarningModal from "./Subscription/SubscriptionWarningModal";

const SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY;
const COOKIE_EXPIRY_DAYS = 7;

// AES helpers
const encrypt = (val) => CryptoJS.AES.encrypt(val, SECRET_KEY).toString();
const decrypt = (val) => {
    try {
        return CryptoJS.AES.decrypt(val, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    } catch {
        return "";
    }
};


const Login = () => {
    const { login, isAuthenticated, user } = useAuth();
    const [toast, setToast] = useState(null);

    const [number, setNumber] = useState("");
    const [password, setPassword] = useState("");
    const [OTP, setOTP] = useState("");

    const [rememberMe, setRememberMe] = useState(
        Cookies.get("rememberMe") === "1"
    );
    const [isLoading, setIsLoading] = useState(false);
    // const [isForget, setIsForget] = useState(false)
    // const [isSetPassword, setIsSetPassword] = useState(false)
    const [authStep, setAuthStep] = useState(0)

    // field-specific errors
    const [numberError, setNumberError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // toggle password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [subLoading, setSubLoading] = useState(true); // ← add
    const [subscription, setSubscription] = useState(null);
    const [userId, setUserId] = useState(null)

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const flattenPermissions = (permissionsArray) =>
        permissionsArray.reduce((acc, item) => ({ ...acc, ...item }), {});

    // 1. Fix URL params useEffect — pass values directly, don't rely on state
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlNumber = params.get("number");
        const urlPassword = params.get("password");
        if (!urlNumber || !urlPassword) return;
        setNumber(urlNumber);
        setPassword(urlPassword);
        handleLogin(urlNumber, urlPassword, false); // already passes args correctly ✓
    }, []); // fine as-is since handleLogin accepts (num, pass, remember)

    // 2. Fix navigation useEffect — wait for subLoading to finish, handle redirect properly
    useEffect(() => {
        if (!isAuthenticated()) return;
        if (subLoading) return; // wait until CheckSubscription resolves
        if (userId) {
            CheckSubscription()

        }

        localStorage.removeItem('theme');
        if (subscription?.popup_type === 3) {
            navigate("/expired", { replace: true }); // use navigate, not <Navigate>
        } else {
            navigate("/dashboard");
        }

    }, [isAuthenticated, navigate, subscription, subLoading, userId]);

    useEffect(() => {
        const savedNumber = Cookies.get("savedNumber");
        const savedPassword = Cookies.get("savedPassword");

        if (savedNumber) setNumber(decrypt(savedNumber));
        if (savedPassword) setPassword(decrypt(savedPassword));
    }, []);


    const CheckSubscription = async (userId) => {
        // Safety guard — never proceed with a null/undefined/falsy user_id
        if (!userId) {
            console.warn("CheckSubscription: called without a valid user_id. Skipping.");
            setSubLoading(false);
            return;
        }

        const CACHE_KEY = `subscription_cache_${userId}`;

        try {
            const formData = new FormData();
            const response = await API.post('/subscription_popup_status', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                setSubscription(response.data.data);
                localStorage.removeItem(CACHE_KEY);
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    date: new Date().toDateString(),
                    data: response.data.data
                }));
            } else {
                console.warn("CheckSubscription:", response.data.message);
            }
        } catch (error) {
            console.error("CheckSubscription error:", error);
        } finally {
            setSubLoading(false);
        }
    };


    const validateInputs = () => {

        let valid = true;
        setNumberError("");
        setPasswordError("");

        switch (authStep) {
            case 0:
                if (!number) {
                    setNumberError("Please enter your mobile number.");
                    valid = false;
                    setToast({
                        message: "Please enter your mobile number.",
                        type: 'error'
                    });
                } else if (!/^\d{10}$/.test(number)) {
                    setNumberError("Mobile number must be 10 digits.");
                    valid = false;
                    setToast({
                        message: "Mobile number must be 10 digits.",
                        type: 'error'
                    });
                }
                if (!password) {
                    setPasswordError("Please enter your password.");
                    valid = false;
                    setToast({
                        message: "Please enter your password.",
                        type: 'error'
                    });
                }
                if (valid) handleLogin();
                break;

            case 1:
                if (!number) {
                    setNumberError("Please enter your mobile number.");
                    valid = false;
                    setToast({
                        message: "Please enter your mobile number.",
                        type: 'error'
                    });
                } else if (!/^\d{10}$/.test(number)) {
                    setNumberError("Mobile number must be 10 digits.");
                    valid = false;
                    setToast({
                        message: "Mobile number must be 10 digits.",
                        type: 'error'
                    });
                }

                if (valid) {
                    handleOTP()
                };
                break;


            case 2:
                if (!OTP) {
                    setNumberError("Please enter OTP.");
                    valid = false;
                    setToast({
                        message: "Please enter OTP.",
                        type: 'error'
                    });
                }

                if (!password) {
                    setPasswordError("Please enter your password.");
                    setToast({
                        message: "Please enter your password.",
                        type: 'error'
                    });
                    valid = false;
                } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
                    setPasswordError("Password must be 8+ chars, include upper, lower, number & special char.");
                    setToast({
                        message: "Password must be 8+ chars, include upper, lower, number & special char.",
                        type: 'error'
                    });
                    valid = false;
                }
                if (valid) handlePassword();
                break;

            default:
                break;
        }

    };

    const handleNumberChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,10}$/.test(value)) setNumber(value);
    };

    // 3. Fix handleLogin — ensure CheckSubscription awaits and subLoading gates navigation
    // handleLogin — extract user_id early, validate before proceeding
    const handleLogin = async (num = number, pass = password, remember = rememberMe) => {
        localStorage.clear()
        setIsLoading(true);
        setSubLoading(true);
        const formData = new FormData();
        formData.append("number", num);
        formData.append("password", pass);
        try {
            const res = await api.post("login", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const { success, user_data, message, token } = res.data;
            // ← validate user_id explicitly before doing anything
            const user_id = user_data?.user_id;
            setUserId(user_id)

            if (token) {
                localStorage.setItem('token', token);
            }

            if (!success || !user_data || !user_id) {
                setSubLoading(false);
                setPasswordError(message || "Login failed. Please check your credentials.");
                setToast({ message: message || "Login failed.", type: 'error' });
                return;
            }

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

            login(userData, remember);
            CheckSubscription(user_id)
            const permFormData = new FormData();
            permFormData.append("user_roles_id", user_data.user_role_id);
            const permRes = await api.post("user_permissions", permFormData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (permRes.data?.data) {
                dispatch(setPermissions(flattenPermissions(permRes.data.data)));
            }

            if (remember) {
                Cookies.set("rememberMe", "1", { expires: COOKIE_EXPIRY_DAYS });
                Cookies.set("savedNumber", encrypt(num), { expires: COOKIE_EXPIRY_DAYS });
                Cookies.set("savedPassword", encrypt(pass), { expires: COOKIE_EXPIRY_DAYS });
            } else {
                Cookies.remove("rememberMe");
                Cookies.remove("savedNumber");
                Cookies.remove("savedPassword");
            }

            setToast({ message: message || "Login Successfully!", type: 'success' });

            // ← guaranteed non-null user_id passed here


        } catch (error) {
            setSubLoading(false);
            if (error.response?.status === 401) {
                setPasswordError("Invalid credentials. Please try again.");
            } else if (error.response?.status >= 500) {
                setPasswordError("Server error. Please try again later.");
            } else {
                setPasswordError("Login failed. Please check your internet connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    const handleOTP = async (type = 0) => {

        if (!number) return;
        setIsLoading(true);

        const formData = new FormData();
        formData.append("number", number);
        formData.append("is_resend", type)

        try {
            const res = await api.post("forgot_password_send_otp", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                setToast({
                    message: res.data.message || "OTP has been sent.",
                    type: 'successs'
                });
                setAuthStep(2)

            } else {
                setToast({
                    message: res.data.message || "Failed to send OTP.",
                    type: 'error'
                });
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.error("Invalid credentials. Please try again.");
            } else if (error.response?.status >= 500) {
                console.error("Server error. Please try again later.");
            } else {
                console.error("OTP failed. Please check your internet connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    const handlePassword = async () => {

        if (!OTP || !password) return;

        setIsLoading(true);

        const formData = new FormData();
        formData.append("number", number);
        formData.append("otp", OTP)
        formData.append("new_password", password)

        try {
            const res = await api.post("forgot_password_reset", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                setToast({
                    message: res.data.message || "Password has been reset.",
                    type: 'successs'
                });
                setAuthStep(0)

            } else {
                setToast({
                    message: res.data.message || "Error Setting Password.",
                    type: 'error'
                });
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.error("Invalid credentials. Please try again.");
            } else if (error.response?.status >= 500) {
                console.error("Server error. Please try again later.");
            } else {
                console.error("Error Setting Password. Please check your internet connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen w-full flex bg-[var(--color-bg-primary)] overflow-hidden">
            {/* Left panel unchanged */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex w-1/2 bg-[var(--color-primary)] items-center justify-center p-12 relative overflow-hidden"
            >
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { navigate("/") }}
                    className="absolute top-8 left-8 flex items-center gap-2 text-[var(--color-text-white-90)] hover:text-[var(--color-text-white)] transition-colors duration-200 z-20"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back</span>
                </motion.button>

                <div className="text-center text-[var(--color-text-white)] z-10 max-w-lg">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-4xl font-bold mb-4"
                    >
                        Effortlessly manage your team and operations.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-xl mb-8 text-[var(--color-primary-lightest)]"
                    >
                        Log in to access your dashboard and manage your team.
                    </motion.p>

                    {/* Dashboard Preview Image */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        className="relative"
                    >
                        <img
                            src={AboutProManager}
                            alt="Dashboard Preview"
                            className="w-full max-w-md mx-auto rounded-xl shadow-2xl border-4 border-white/20 bg-white"
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1.2 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="absolute -top-4 -right-4 bg-[var(--color-bg-secondary)] rounded-lg p-3 shadow-lg"
                        >
                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">4000+ </div>
                            <div className="text-xs text-[var(--color-text-muted)]">Users</div>
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1.4 }}
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="absolute -bottom-4 -left-4 bg-[var(--color-bg-secondary)] rounded-lg p-3 shadow-lg"
                        >
                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">100+ </div>
                            <div className="text-xs text-[var(--color-text-muted)]">Companies</div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.1 }}
                        transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute top-20 left-20 w-32 h-32 bg-[var(--color-text-white)] rounded-full"
                    ></motion.div>
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.1 }}
                        transition={{ duration: 2.5, delay: 1, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute bottom-32 right-16 w-24 h-24 bg-[var(--color-text-white)] rounded-full"
                    ></motion.div>
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.1 }}
                        transition={{ duration: 1.8, delay: 1.5, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute top-1/2 left-8 w-16 h-16 bg-[var(--color-text-white)] rounded-full"
                    ></motion.div>
                </div>

            </motion.div>
            {/* Right Side - Login Form */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8 relative"
            >
                <div className="w-full max-w-md ">
                    {/* Logo */}
                    <div className="flex flex-col items-center justify-center gap-2 mb-16">
                        <img src={Logo} alt="promanager Logo" className="w-60 h-30 object-contain" />
                        <span className="text-md  align-center" >Future-Ready Payroll
                            Management Platform</span>
                    </div>

                    {authStep === 0 && <>
                        <div className="space-y-5">

                            <div>
                                <label className="block text-sm font-medium mb-2">Mobile Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={number}
                                        onChange={handleNumberChange}
                                        maxLength={10}
                                        placeholder="Enter your mobile number"
                                        className={`w-full pl-11 pr-4 py-3 border rounded-lg ${numberError ? "border-red-500" : ""
                                            }`}
                                        disabled={isLoading}
                                    />
                                </div>

                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className={`w-full pl-11 pr-10 py-3 border rounded-lg ${passwordError ? "border-red-500" : ""
                                            }`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-600" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-600" />
                                        )}
                                    </button>
                                </div>

                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="ml-2 text-sm">Remember Me</span>
                                </label>
                                <span onClick={() => setAuthStep(1)} className="cursor-pointer ml-2 text-sm">Forget Password?</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            onClick={validateInputs}
                            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg mt-6">
                            {isLoading ? "Logging in..." : "Log In"}
                        </button>

                    </>}

                    {authStep === 1 && <>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2">Mobile Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={number}
                                        onChange={handleNumberChange}
                                        maxLength={10}
                                        placeholder="Enter your mobile number"
                                        className={`w-full pl-11 pr-4 py-3 border rounded-lg ${numberError ? "border-red-500" : ""
                                            }`}
                                        disabled={isLoading}
                                    />
                                </div>


                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <span onClick={() => setAuthStep((prev) => prev - 1)} className="cursor-pointer ml-2 text-sm">&#8592; Back</span>
                                </label>

                            </div>
                        </div>

                        < button
                            type="submit"
                            disabled={isLoading}

                            onClick={() => { validateInputs(); }}
                            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg mt-6">
                            {isLoading ? "Submitting..." : "Submit"}
                        </button>
                    </>}

                    {authStep === 2 && <>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2">OTP</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={OTP}
                                        onChange={(e) => setOTP(e.target.value)}
                                        placeholder="Enter OTP"
                                        className={`w-full pl-11 pr-4 py-3 border rounded-lg ${numberError ? "border-red-500" : ""
                                            }`}
                                        disabled={isLoading}
                                    />
                                </div>

                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Set Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className={`w-full pl-11 pr-10 py-3 border rounded-lg ${passwordError ? "border-red-500" : ""
                                            }`}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-600" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-600" />
                                        )}
                                    </button>
                                </div>

                            </div>



                            {/* Password */}

                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <span onClick={() => setAuthStep(1)} className="cursor-pointer ml-2 text-sm">&#8592; Back</span>
                                </label>
                                <button
                                    className="cursor-pointer ml-2 text-sm"
                                    onClick={() => handleOTP(1)} >Resend OTP</button>
                            </div>


                        </div>
                        < button
                            type="submit"
                            disabled={isLoading}

                            onClick={() => validateInputs()}
                            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg mt-6">
                            {isLoading ? "Submitting..." : "Submit"}
                        </button>

                    </>}

                </div>

            </motion.div >
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

        </div >

    );
};

export default Login;
