
import { Button } from "./ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import Logo from "../../assets/logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axiosInstance";
import { agreementSchema } from "../comman/validation";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { setPermissions } from "../../redux/permissionsSlice";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import RegisterModal from "../comman/RegisterModal";

const LandingNavbar = () => {
    const { isAuthenticated } = useAuth();
    const [isPagesOpen, setIsPagesOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isAgreementOpen, setIsAgreementOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({});
    const [agreementForm, setAgreementForm] = useState({
        full_name: "",
        company_name: "",
        email: "",
        mobile: "",
        gst_number: "",
        whatsapp: "",
        address: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { login } = useAuth();

    const SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY;
    const COOKIE_EXPIRY_DAYS = 7;

    const encrypt = (val) =>
        CryptoJS.AES.encrypt(val, SECRET_KEY).toString();

    const flattenPermissions = (permissionsArray) =>
        permissionsArray.reduce((acc, item) => ({ ...acc, ...item }), {});

    const handleAgreementChange = (field, value) => {
        setAgreementForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        // remove validation error on typing
        setErrors((prev) => ({
            ...prev,
            [field]: "",
        }));
    };


    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // const handleAgreementSubmit = async () => {
    //     try {

    //         setErrors({});

    //         await agreementSchema.validate(agreementForm, { abortEarly: false });

    //         const formData = new FormData();
    //         Object.entries(agreementForm).forEach(([key, value]) =>
    //             formData.append(key, value)
    //         );

    //         const res = await API.post("create_account_free_account", formData, {
    //             headers: { "Content-Type": "multipart/form-data" },
    //         });

    //         const { success, message } = res.data;

    //         if (success) {
    //             setToast({ message: message || "Account created successfully!", type: "success" });
    //             setIsAgreementOpen(false);
    //             setAgreementForm({
    //                 full_name: "",
    //                 company_name: "",
    //                 email: "",
    //                 mobile: "",
    //                 gst_number: "",
    //                 whatsapp: "",
    //                 address: "",
    //             });
    //         } else {
    //             setToast({ message: message || "Failed to create account.", type: "error" });
    //         }

    //     } catch (err) {
    //         if (err.name === "ValidationError") {
    //             const fieldErrors = {};
    //             err.inner.forEach(error => {
    //                 fieldErrors[error.path] = error.message;
    //             });
    //             setErrors(fieldErrors);
    //         } else {
    //             console.error("Agreement submission error:", err);
    //             setToast({ message: "Failed to create account. Please try again.", type: "error" });
    //         }
    //     }
    // };


    const handleAgreementSubmit = async () => {
        try {
            setErrors({});
            setIsLoading(true);

            await agreementSchema.validate(agreementForm, {
                abortEarly: false,
            });

            const formData = new FormData();

            Object.entries(agreementForm).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const res = await API.post(
                "create_account_free_account",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const { success, message, user_data, token } = res.data;

            if (!success) {
                setToast({
                    message: message || "Signup failed.",
                    type: "error",
                });
                return;
            }

            // save token
            if (token) {
                localStorage.setItem("token", token);
            }

            // login auth flow
            if (user_data?.user_id) {
                const userData = {
                    user_id: user_data.user_id,
                    full_name: user_data.full_name,
                    username: user_data.username,
                    email: user_data.email || "",
                    number: user_data.number,
                    type: user_data.type,
                    user_roles_id: user_data.user_role_id,
                    subscriptions_status:
                        user_data.subscriptions_status,
                    subscriptions_days:
                        user_data.subscriptions_days,
                };

                login(userData, true);

                // permissions
                const permFormData = new FormData();

                permFormData.append(
                    "user_roles_id",
                    user_data.user_role_id
                );

                const permRes = await API.post(
                    "user_permissions",
                    permFormData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );

                if (permRes.data?.data) {
                    dispatch(
                        setPermissions(
                            flattenPermissions(
                                permRes.data.data
                            )
                        )
                    );
                }

                // remember credentials
                Cookies.set("rememberMe", "1", {
                    expires: COOKIE_EXPIRY_DAYS,
                });

                Cookies.set(
                    "savedNumber",
                    encrypt(agreementForm.mobile),
                    {
                        expires: COOKIE_EXPIRY_DAYS,
                    }
                );
            }

            setToast({
                message: message || "Signup successful!",
                type: "success",
            });

            setIsAgreementOpen(false);

            setAgreementForm({
                full_name: "",
                company_name: "",
                email: "",
                mobile: "",
                gst_number: "",
                whatsapp: "",
                address: "",
            });

            navigate("/dashboard");

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
                    message:
                        err?.response?.data?.message ||
                        "Signup failed. Please try again.",
                    type: "error",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <header className="bg-white backdrop-blur-sm border-[var(--color-border)] sticky top-0 z-50 shadow-sm">
                <nav className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <NavLink to="/" onClick={scrollToTop}>
                                <img
                                    src={Logo}
                                    alt="ProManager Logo"
                                    className="h-12 w-auto object-contain max-w-[200px] cursor-pointer"
                                />
                            </NavLink>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {[
                                { to: "/", label: "Home" },
                                { to: "/about", label: "About Us" },
                                { to: "/features", label: "Features" },
                                { to: "/pricing", label: "Pricing" },

                            ].map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={scrollToTop}
                                    className="relative group px-4 py-2"
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={`text-base font-medium transition-colors ${isActive
                                                ? "text-[var(--color-primary)]"
                                                : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]"
                                                }`}>
                                                {item.label}
                                            </span>
                                            {/* Bottom Border Animation */}
                                            <motion.div
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                                                initial={false}
                                                animate={{
                                                    scaleX: isActive ? 1 : 0,
                                                }}
                                                transition={{ duration: 0.3 }}
                                            />
                                            {/* Hover Border */}
                                            <motion.div
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                                                initial={{ scaleX: 0 }}
                                                whileHover={{ scaleX: isActive ? 0 : 1 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </>
                                    )}
                                </NavLink>
                            ))}

                            {/* Pages Dropdown */}
                            <div
                                className="relative"
                                onMouseEnter={() => setIsPagesOpen(true)}
                                onMouseLeave={() => setIsPagesOpen(false)}
                            >
                                <button className="relative group flex items-center space-x-1 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                                    <span className="text-base font-medium">Products</span>
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ${isPagesOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                    {/* Hover Border */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: isPagesOpen ? 1 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </button>

                                <AnimatePresence>
                                    {isPagesOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[var(--color-primary)] overflow-hidden z-[60]"
                                        >
                                            {[
                                                { to: "https://dcard.live/", label: "Digital Card" },

                                                { to: "https://insuraa.in/", label: "Insurance Management software" },
                                            ].map((item) => (
                                                <a
                                                    key={item.to}
                                                    href={item.to}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={scrollToTop}
                                                    className="block"
                                                >
                                                    <div className="px-4 py-3 transition-colors text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-primary)]">
                                                        {item.label}
                                                    </div>
                                                </a>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {/* <NavLink
                                to="/contact"
                                onClick={scrollToTop}
                                className="relative group px-4 py-2"
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={`text-base font-medium transition-colors ${
                                                isActive
                                                    ? "text-[var(--color-primary)]"
                                                    : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]"
                                            }`}
                                        >
                                            Contact Us
                                        </span>
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                                            initial={false}
                                            animate={{
                                                scaleX: isActive ? 1 : 0,
                                            }}
                                            transition={{ duration: 0.3 }}
                                        />
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                                            initial={{ scaleX: 0 }}
                                            whileHover={{ scaleX: isActive ? 0 : 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </>
                                )}
                            </NavLink> */}
                        </div>

                        {/* Auth Buttons (Desktop) - Added more space between buttons */}
                        {/* <div className="hidden md:flex items-center space-x-4">
                            <NavLink to="/login">
                                <motion.button
                                    className="px-6 py-2.5 text-[var(--color-primary)] font-medium border-2 border-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Log In
                                </motion.button>
                            </NavLink>
                            <NavLink to="/contact">
                                <motion.button
                                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Book Appointment
                                </motion.button>
                            </NavLink>
                        </div> */}

                        <div className="hidden md:flex items-center space-x-4">
                            {isAuthenticated() ? (
                                <NavLink to="/dashboard">
                                    <motion.button
                                        className="px-6 py-2.5 text-[var(--color-primary)] font-medium border-2 border-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Dashboard
                                    </motion.button>
                                </NavLink>
                            ) : (
                                <NavLink to="/login">
                                    <motion.button
                                        className="px-6 py-2.5 text-[var(--color-primary)] font-medium border-2 border-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Log In
                                    </motion.button>
                                </NavLink>
                            )}

                            <NavLink to="/contact">
                                <motion.button
                                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Book Appointment
                                </motion.button>
                            </NavLink>

                            {/* <button >
                                <motion.button
                                    onClick={() => setIsAgreementOpen(true)}
                                    className="px-6 py-2.5 bg-white text-[var(--color-primary)] font-medium border-2 border-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Sign Up
                                </motion.button>
                            </button> */}
                            {/* {!isAuthenticated() && (
                                <button>
                                    <motion.button
                                        onClick={() => setIsAgreementOpen(true)}
                                        className="px-6 py-2.5 bg-white text-[var(--color-primary)] font-medium border-2 border-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Sign Up
                                    </motion.button>
                                </button>
                            )} */}
                        </div>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </nav>
            </header>

            {/* Agreement Modal */}
            <RegisterModal
                isOpen={isAgreementOpen}
                onClose={() => setIsAgreementOpen(false)}
            />

            {/* Mobile Full Screen Menu */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[9998]"
                            onClick={() => setIsMobileOpen(false)}
                        />

                        {/* Full Screen Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.3 }}
                            className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-[9999] flex flex-col overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <img
                                    src={Logo}
                                    alt="ProManager Logo"
                                    className="h-10 w-auto object-contain"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileOpen(false)}
                                    className="hover:bg-gray-100 rounded-full"
                                >
                                    <X className="h-6 w-6 text-gray-600" />
                                </Button>
                            </div>

                            {/* Menu Items */}
                            <div className="flex-1 px-6 py-8">
                                <div className="space-y-6">
                                    {/* Main Navigation */}
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                            Navigation
                                        </h3>
                                        {[
                                            { to: "/", label: "Home" },
                                            { to: "/about", label: "About Us" },
                                            { to: "/features", label: "Features" },
                                            { to: "/pricing", label: "Pricing" },
                                            { to: "/contact", label: "Contact Us" },
                                        ].map((item) => (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                onClick={() => {
                                                    scrollToTop();
                                                    setIsMobileOpen(false);
                                                }}
                                            >
                                                {({ isActive }) => (
                                                    <motion.div
                                                        whileHover={{ x: 5 }}
                                                        className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${isActive
                                                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-l-4 border-[var(--color-primary)]"
                                                            : "text-gray-600 hover:bg-gray-50 hover:text-[var(--color-primary)]"
                                                            }`}
                                                    >
                                                        {item.label}
                                                    </motion.div>
                                                )}
                                            </NavLink>
                                        ))}
                                    </div>

                                    {/* Products Section */}
                                    <div className="space-y-1 pt-4">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                            Our Products
                                        </h3>
                                        {[
                                            { to: "https://dcard.live/", label: "Digital Card", external: true },
                                            { to: "https://digitalkstechno.com/", label: "Field & Salesman tracking", external: true },
                                            { to: "https://insuraa.in/", label: "Insurance Management software", external: true },
                                        ].map((item) => (
                                            <a
                                                key={item.to}
                                                href={item.to}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <motion.div
                                                    whileHover={{ x: 5 }}
                                                    className="px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-[var(--color-primary)] transition-all"
                                                >
                                                    {item.label}
                                                </motion.div>
                                            </a>
                                        ))}
                                    </div>

                                    {/* Auth Buttons */}
                                    <div className="pt-8 space-y-3 border-t border-gray-200">
                                        <NavLink
                                            to="/login"
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <motion.button
                                                className="w-full px-6 py-3.5 text-[var(--color-primary)] font-semibold border-2 border-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-all"
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Log In
                                            </motion.button>
                                        </NavLink>
                                        <NavLink
                                            to="/contact"
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <motion.button
                                                className="w-full px-6 mt-3 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl"
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Book Appointment
                                            </motion.button>
                                        </NavLink>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="pt-6 text-center text-sm text-gray-500">
                                        <p>© {new Date().getFullYear()} ProManager. All rights reserved.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>



        </>
    );
};

export default LandingNavbar;