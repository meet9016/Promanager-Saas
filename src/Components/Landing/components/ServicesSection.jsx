import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserCheck, BarChart3, CheckCircle2, Sparkles } from "lucide-react";

const services = [
  {
    id: "payroll",
    icon: Users,
    badgeText: "01. AUTOMATION",
    title: "Automated Payroll Management",
    description: "Process salaries, deductions, and taxes accurately with just a few clicks — reducing errors and saving time.",
    description1: "Simplify your payroll process with a smart and efficient solution designed to handle salaries, deductions, taxes, and payments with ease. Save time, improve accuracy, and keep your payroll operations smooth, reliable, and hassle-free.",
    image: "/images/Automated-Payroll-Management.png",
    highlights: ["100% Error-free salary calculation", "Automated tax & PF deduction", "One-click bulk salary payouts"],
    statBadge: "Save 50% Time"
  },
  {
    id: "attendance",
    icon: UserCheck,
    badgeText: "02. INTEGRATION",
    title: "Leave & Attendance Integration",
    description: "Seamlessly sync employee attendance and leave records to ensure payroll is always accurate and compliant.",
    description1: "Streamline your leave and attendance management with a seamless system that keeps all employee records organized and up to date. Automatically sync attendance, working hours, and leave details to reduce manual effort and minimize errors. This helps ensure accurate payroll calculations, better workforce visibility, and smooth compliance across your organization.",
    image: "/images/Leave-Attendance-Integration.png",
    highlights: ["Real-time leave balance sync", "Biometric & GPS attendance", "Overtime & shift calculations"],
    statBadge: "Real-time Sync"
  },
  {
    id: "insights",
    icon: BarChart3,
    badgeText: "03. ANALYTICS",
    title: "Real-Time Payroll Insights",
    description: "Track expenses, monitor compliance, and generate payroll reports with actionable insights in real time.",
    description1: "Gain real-time visibility into your payroll expenses, compliance, and key financial trends. Access clear and accurate insights to monitor performance, identify important patterns, and make smarter decisions for better payroll management.",
    image: "/images/Real-Time-Payroll-Insights.png",
    highlights: ["Customizable financial reports", "Department-wise cost analysis", "Bank-grade audit readiness"],
    statBadge: "Live Reports"
  }
];

const ServicesSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-12 lg:py-20 bg-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-20 -left-20 w-[400px] h-[500px] rounded-full bg-[var(--color-primary-dark)] blur-[100px] opacity-15 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[500px] rounded-full bg-[var(--color-primary-dark)] blur-[100px] opacity-15 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6 inline-block">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]"
              > 
                Our Services 
              </motion.span>

              {/* Curved Line SVG */}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                className="absolute top-10 left-0 w-40 h-4"
                viewBox="0 0 160 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M2 10C35 2, 70 2, 105 10C130 16, 145 10, 158 10"
                  stroke="url(#gradient-services)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient-services" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5917A8" />
                    <stop offset="100%" stopColor="#7300ff" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] leading-tight">
              Future-Ready Payroll
              <br />
              <span className="bg-[var(--color-primary-dark)] bg-clip-text text-transparent">
                Management Platform
              </span>
            </h2>
          </div>
        </motion.div>

        {/* Tab Navigation Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 max-w-4xl mx-auto">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isActive = activeTab === index;

            return (
              <button
                key={service.id}
                onClick={() => setActiveTab(index)}
                className={`relative flex items-center gap-3 px-6 py-3.5 rounded-2xl font-medium transition-all duration-300 ${isActive
                  ? "text-white shadow-xl shadow-[var(--color-primary-dark)]/25 scale-[1.02]"
                  : "bg-slate-50 hover:bg-slate-100 text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-[var(--color-primary-dark)] rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[var(--color-primary-dark)]"}`} />
                <span className="text-sm font-semibold">{service.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Service Interactive Showcase Display */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl border border-[var(--color-border-primary)] shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden"
            >
              {/* Background Glassmorphic Blur Decor */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary-alpha-10)] rounded-full blur-3xl pointer-events-none" />

              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left Content Side */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary-alpha-10)] border border-[var(--color-primary-alpha-20)] text-[var(--color-primary-darker)] text-xs font-bold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    {services[activeTab].badgeText}
                  </div>

                  <h3 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] leading-tight">
                    {services[activeTab].title}
                  </h3>

                  <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                    {services[activeTab].description}
                  </p>

                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {services[activeTab].description1}
                  </p>

                  {/* Highlights List */}
                  <div className="space-y-3 pt-2">
                    {services[activeTab].highlights.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[var(--color-primary-alpha-10)] flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-[var(--color-primary-dark)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Image Display Box */}
                <div className="lg:col-span-6">
                  <div className="relative group">
                    {/* Glowing Aura */}
                    <div className="absolute -inset-2 bg-[var(--color-primary-alpha-10)] rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500" />

                    {/* Image Card Container - Tight Fit Without Extra Space */}
                    <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border-primary)] shadow-xl bg-white">
                      <motion.img
                        key={services[activeTab].image}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        src={services[activeTab].image}
                        alt={services[activeTab].title}
                        loading="lazy"
                        className="w-full h-auto object-cover rounded-xl"
                      />

                      {/* Floating Badge Chip */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-[var(--color-border-primary)] text-xs font-bold text-[var(--color-primary-darker)] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {services[activeTab].statBadge}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
