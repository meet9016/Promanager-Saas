import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const SESSION_KEY = "booking_popup_shown";
const AUTH = "auth_user";


const Popup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNo: "",
    companyName: "",
    message: "",
  });

  useEffect(() => {

    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (sessionStorage.getItem(AUTH)) return;
    if (window.location.pathname !== "/") return; 
     const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem(SESSION_KEY, "true");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => setIsVisible(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.mobileNo || !formData.companyName) {
      alert("Please fill in all required fields");
      return;
    }
    const message = `*New Appointment Request - ProManager*%0A%0A*Personal Details:*%0A👤 Full Name: ${formData.fullName}%0A📧 Email: ${formData.email}%0A📱 Mobile No: ${formData.mobileNo}%0A💼 Company: ${formData.companyName}%0A%0A*Message:*%0A${formData.message || "No message provided"}`;
    const phoneNumber = "919274889008";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    handleClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            key="popup"
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Purple glow blob */}
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#6c4cf1] blur-[80px] opacity-10 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-block relative">
                    <span className="text-3xl font-bold text-[var(--color-text-primary,#111)]">
                      Book an{" "}
                      <span className="text-[var(--color-primary,#6c4cf1)]">Appointment</span>
                    </span>
                    <motion.svg
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
                      className="absolute -bottom-2 left-0 w-full h-3"
                      viewBox="0 0 200 12"
                      fill="none"
                    >
                      <motion.path
                        d="M2 10C50 2, 100 2, 150 10C170 16, 185 10, 198 10"
                        stroke="var(--color-primary,#6c4cf1)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </motion.svg>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary,#666)] mt-4">
                    Fill in your details and we'll reach out via WhatsApp.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {[
                    { label: "Full Name", name: "fullName", type: "text", placeholder: "Enter your full name" },
                    { label: "Email Address", name: "email", type: "email", placeholder: "Enter your email" },
                    { label: "Mobile Number", name: "mobileNo", type: "tel", placeholder: "Enter your mobile number" },
                    { label: "Company Name", name: "companyName", type: "text", placeholder: "Enter your company name" },
                  ].map(({ label, name, type, placeholder }) => (
                    <div key={name} className="space-y-1">
                      <label className="text-xs font-medium text-[var(--color-text-primary,#111)]">
                        {label} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        required
                        className="w-full px-3 py-2 text-sm border border-[var(--color-border,#e5e7eb)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#6c4cf1)] focus:border-transparent transition-all"
                      />
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--color-text-primary,#111)]">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[var(--color-border,#e5e7eb)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#6c4cf1)] focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full bg-[var(--color-primary,#6c4cf1)] text-white py-3 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Send via WhatsApp
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Popup;