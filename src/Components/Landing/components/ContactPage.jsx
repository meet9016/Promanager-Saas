import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Mail, Phone, MapPin, Clock, Check, Zap, User, Building2, MessageSquare, Send, MessageCircle, Sparkles, ArrowUpRight } from "lucide-react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { Link } from "react-router-dom";
import { useSoftwareConfig } from "../../../context/SoftwareConfigContext";

const AnimatedCounter = ({ from, to, duration, symbol }) => {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (isInView) {
      const start = performance.now();
      const animate = (timestamp) => {
        const progress = Math.min((timestamp - start) / duration, 1);
        const newCount = Math.floor(progress * (to - from) + from);
        setCount(newCount);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref}>
      {count}
      {symbol}
    </span>
  );
};

const ContactPage = () => {
  const { config } = useSoftwareConfig();

  // State for form data - simplified to 5 fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNo: "",
    companyName: "",
    message: "",
  });

  // State for field-level validation errors
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only numeric digits for mobile number (max 10 digits)
    if (name === "mobileNo") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle input blur for immediate validation feedback
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "email" && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        setErrors((prev) => ({
          ...prev,
          email: "Invalid email address (e.g. name@example.com)",
        }));
      }
    }
    if (name === "mobileNo" && value.trim()) {
      if (value.trim().length < 10) {
        setErrors((prev) => ({
          ...prev,
          mobileNo: "Mobile number must be 10 digits",
        }));
      }
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Invalid email address (e.g. name@example.com)";
    }

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile number is required";
    } else if (formData.mobileNo.trim().length < 10) {
      newErrors.mobileNo = "Mobile number must be 10 digits";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - opens WhatsApp
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!validateForm()) {
      return;
    }

    // Format the message for WhatsApp
    const message = `*New Contact Form Submission - promanager*%0A%0A
*Personal Details:*%0A
👤 Full Name: ${formData.fullName}%0A
📧 Email: ${formData.email}%0A
📱 Mobile No: ${formData.mobileNo}%0A
💼 Company: ${formData.companyName}%0A%0A

*Message:*%0A${formData.message || "No message provided"}`;

    // WhatsApp number (replace with your actual number)
    const phoneNumber = "918866779008"; // Format: country code + number without +

    // Create WhatsApp URL
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;

    // Open WhatsApp
    window.open(whatsappURL, "_blank");
  };

  const faqData = [
    {
      question: "How quickly can we get set up on promanager?",
      answer:
        "Most organizations can get started within minutes. promanager offers a simple and guided setup process for payroll and attendance management.",
    },
    {
      question: "Do you provide customer support?",
      answer:
        "Yes! promanager provides dedicated customer support via chat, email, and phone to assist you at every step.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "Currently, promanager does not offer a free trial. However, our team is happy to provide a guided demo to help you understand the platform before getting started.",
    },
    {
      question: "Can promanager integrate with existing systems?",
      answer:
        "Yes, promanager supports seamless integration with various HR, attendance, and accounting systems to ensure smooth payroll operations.",
    },
    {
      question: "Can I access promanager from multiple devices?",
      answer:
        "Yes! promanager is a cloud-based platform, allowing authorized users to securely access payroll, attendance, and employee information from multiple devices.",
    },
    {
      question: "Is my employee and payroll data secure?",
      answer:
        "Yes! promanager is designed with secure and encrypted data handling to help protect sensitive employee and payroll information.",
    },
    {
      question: "Can promanager grow with my business?",
      answer:
        "Absolutely! promanager is designed to support growing teams and streamline payroll and workforce operations as your organization expands.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Helmet>
        <title>Contact promanager | Book a Demo & Support</title>
        <meta
          name="description"
          content="Get in touch with promanager payroll experts. Book a demo, schedule a call, or reach our support team for payroll, HR, and compliance assistance."
        />
        <link rel="canonical" href="https://promanager.in/contact" />
      </Helmet>


      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-br from-[#180544] via-[#340C8E] to-[#5516a8] text-white overflow-hidden pt-12 sm:pt-16 pb-24 sm:pb-32">
        {/* Animated Ambient Light Orbs & Grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(108,76,241,0.3),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(192,132,252,0.2),transparent_50%)]" />
          <motion.div
            className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* Left Column - Hero Headline */}
            <motion.div
              className="lg:col-span-6 space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >


              <motion.h1
                className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Let's Transform Your{" "}
                <span className="text-white">
                  HR Together
                </span>
              </motion.h1>

              <motion.p
                className="text-purple-100/90 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl font-normal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Book a personalized demo and discover how promanager can
                streamline your payroll, attendance, and workforce management.
              </motion.p>
            </motion.div>

            {/* Right Column - 4 Contact Cards Grid */}
            <motion.div
              className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {[
                {
                  icon: Mail,
                  label: "Email",
                  value: config?.email || "-",
                  gradient: "from-indigo-500 to-purple-600",
                  href: config?.email ? `mailto:${config.email}` : "mailto:contact@promanager.in",
                  isExternal: false,
                },
                {
                  icon: Phone,
                  label: "Phone",
                  value: config?.mobile_number || config?.mobileNumber || "-",
                  gradient: "from-emerald-500 to-teal-600",
                  href: (config?.mobile_number || config?.mobileNumber) ? `tel:${config?.mobile_number || config?.mobileNumber}` : "tel:+919274889008",
                  isExternal: false,
                },
                {
                  icon: MapPin,
                  label: "Location",
                  value: config?.address || "-",
                  gradient: "from-purple-500 to-pink-600",
                  href: "https://maps.app.goo.gl/kHPcDofAdk9mjnJp7",
                  isExternal: true,
                },
                {
                  icon: Clock,
                  label: "Support",
                  value: "10:00 AM to 5:00 PM",
                  gradient: "from-amber-500 to-orange-600",
                  href: null,
                  isExternal: false,
                },
              ].map((contact, index) => {
                const ContactIcon = contact.icon;
                const CardElement = contact.href ? 'a' : 'div';
                return (
                  <CardElement
                    key={index}
                    href={contact.href || undefined}
                    target={contact.isExternal ? "_blank" : undefined}
                    rel={contact.isExternal ? "noopener noreferrer" : undefined}
                    className={`group relative bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between ${contact.href ? "cursor-pointer" : "cursor-default"
                      }`}
                  >
                    {/* Top glass shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${contact.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <ContactIcon className="w-5 h-5 text-white" />
                        </div>
                        {contact.href && (
                          <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        )}
                      </div>

                      <p className="text-purple-200/80 text-xs font-semibold uppercase tracking-wider mb-1">
                        {contact.label}
                      </p>
                      <h3 className="text-white font-bold text-base sm:text-lg truncate group-hover:text-purple-100 transition-colors">
                        {contact.value}
                      </h3>
                    </div>
                  </CardElement>
                );
              })}
            </motion.div>

          </div>
        </div>

        {/* Curved Bottom Divider */}
        <div className="absolute bottom-0 left-0 right-0 leading-none z-20 pointer-events-none">
          <svg
            viewBox="0 0 1440 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto text-white block"
          >
            <path
              d="M0 90L60 78.8C120 68 240 45 360 33.8C480 23 600 23 720 31.5C840 40 960 56 1080 63C1200 70 1320 70 1380 70L1440 70V90H1380C1320 90 1200 90 1080 90C960 90 840 90 720 90C600 90 480 90 360 90C240 90 120 90 60 90H0Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>


      <div className="bg-white pb-20 relative">
        <div
          className="absolute top-1/2 z-10 left-0 w-[400px] h-[500px] rounded-full
          bg-[#6c4cf1] blur-[90px] opacity-20"
        />
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          <div className="relative mb-16">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-block relative">
                <span className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)]">
                  Get In{" "}
                  <span className="text-[var(--color-primary)]">Touch</span>
                </span>
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                  className="absolute -bottom-2 left-0 w-48 h-4"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <motion.path
                    d="M2 10C50 2, 100 2, 150 10C170 16, 185 10, 198 10"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </div>
              <p className="text-[var(--color-text-secondary)] text-lg mt-6 max-w-2xl mx-auto">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </motion.div>
          </div>


          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >


            <Card className="border border-purple-200/80 bg-white/95 backdrop-blur-xl shadow-2xl shadow-purple-900/10 rounded-3xl overflow-hidden relative">
              <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500" />
              <CardContent className="p-6 sm:p-8 md:p-10">
                <form onSubmit={handleSubmit} noValidate className="space-y-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Full Name <span className="text-purple-600 font-bold ml-0.5">*</span></span>
                      </label>
                      <div className="relative flex items-center">
                        <User className={`absolute left-3.5 w-5 h-5 ${errors.fullName ? "text-red-400" : "text-slate-400"} pointer-events-none`} />
                        <Input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className={`pl-11 pr-4 h-12 bg-slate-50/80 border rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white transition-all duration-200 shadow-sm ${errors.fullName
                            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                            : "border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 hover:border-purple-300"
                            }`}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-xs text-red-500 font-medium pl-1 animate-fadeIn">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Email Address <span className="text-purple-600 font-bold ml-0.5">*</span></span>
                      </label>
                      <div className="relative flex items-center">
                        <Mail className={`absolute left-3.5 w-5 h-5 ${errors.email ? "text-red-400" : "text-slate-400"} pointer-events-none`} />
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your email address"
                          className={`pl-11 pr-4 h-12 bg-slate-50/80 border rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white transition-all duration-200 shadow-sm ${errors.email
                            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                            : "border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 hover:border-purple-300"
                            }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-500 font-medium pl-1 animate-fadeIn">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Mobile Number <span className="text-purple-600 font-bold ml-0.5">*</span></span>
                      </label>
                      <div className="relative flex items-center">
                        <Phone className={`absolute left-3.5 w-5 h-5 ${errors.mobileNo ? "text-red-400" : "text-slate-400"} pointer-events-none`} />
                        <Input
                          type="tel"
                          name="mobileNo"
                          value={formData.mobileNo}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          maxLength={10}
                          placeholder="Enter your mobile number"
                          className={`pl-11 pr-4 h-12 bg-slate-50/80 border rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white transition-all duration-200 shadow-sm ${errors.mobileNo
                            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                            : "border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 hover:border-purple-300"
                            }`}
                        />
                      </div>
                      {errors.mobileNo && (
                        <p className="text-xs text-red-500 font-medium pl-1 animate-fadeIn">
                          {errors.mobileNo}
                        </p>
                      )}
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>Company Name <span className="text-purple-600 font-bold ml-0.5">*</span></span>
                      </label>
                      <div className="relative flex items-center">
                        <Building2 className={`absolute left-3.5 w-5 h-5 ${errors.companyName ? "text-red-400" : "text-slate-400"} pointer-events-none`} />
                        <Input
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="Enter your company name"
                          className={`pl-11 pr-4 h-12 bg-slate-50/80 border rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white transition-all duration-200 shadow-sm ${errors.companyName
                            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                            : "border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 hover:border-purple-300"
                            }`}
                        />
                      </div>
                      {errors.companyName && (
                        <p className="text-xs text-red-500 font-medium pl-1 animate-fadeIn">
                          {errors.companyName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                      <span>Message</span>
                      <span className="text-[11px] font-normal text-slate-400 lowercase">Optional</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        rows={4}
                        className="pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 hover:border-purple-300 transition-all duration-200 resize-none shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#370d95] via-[#4a15bf] to-[#370d95] text-white py-4 px-8 rounded-xl font-bold text-base shadow-xl shadow-purple-900/25 flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-2xl hover:shadow-purple-900/35 hover:-translate-y-0.5 active:translate-y-0"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >

                    <span>Send Message via WhatsApp</span>
                    <Send className="w-4 h-4 ml-1 opacity-80" />
                  </motion.button>

                </form>
              </CardContent>
            </Card>


          </motion.div>
        </div>
      </div>

      <div className=" bg-white pb-20">
        <div
          className="absolute top-1/2 z-10 right-0 w-[400px] h-[500px] rounded-full
          bg-[#6c4cf1] blur-[90px] opacity-20"
        />

        <div className="max-w-7xl   mx-auto px-4 md:px-8">

          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block relative">
              <span className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)]">
                Frequently Asked{" "}
                <span className="text-[var(--color-primary)]">Questions</span>
              </span>
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                className="absolute -bottom-2 left-0 w-80 h-4"
                viewBox="0 0 320 12"
                fill="none"
              >
                <motion.path
                  d="M2 10C70 2, 150 2, 230 10C270 16, 300 10, 318 10"
                  stroke="var(--color-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </motion.svg>
            </div>
            <p className="text-[var(--color-text-secondary)] text-lg mt-6">
              Quick answers to common questions about our platform
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-[#370d9594] bg-[var(--color-bg-primary)] hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--color-text-primary)] mb-2 text-lg">
                          {faq.question}
                        </h4>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;