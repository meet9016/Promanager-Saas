import React from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const PagarPeComparisonSection = () => {
  return (
    <section className="py-10 lg:py-16 bg-gradient-to-b from-slate-50 via-white to-purple-50/20 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 -left-20 w-[350px] h-[400px] rounded-full bg-[var(--color-primary-dark)] blur-[100px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-5 -right-20 w-[350px] h-[400px] rounded-full bg-[#6C4CF1] blur-[100px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-[1280px]">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 lg:mb-12 text-center"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-2 inline-block">
              <span className="text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
                Your HR Work Is Now <span className="text-[var(--color-primary-dark)]">Super Easy!</span>
              </span>

              {/* Curved Line SVG under title */}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
                className="absolute top-9 lg:top-11 left-1/2 -translate-x-1/2 w-56 lg:w-72 h-3.5"
                viewBox="0 0 280 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 10C60 2, 140 2, 210 10C240 16, 260 10, 278 10"
                  stroke="url(#gradient-pagarpe-ref)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient-pagarpe-ref" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5917A8" />
                    <stop offset="100%" stopColor="#7300ff" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </div>
          </div>
        </motion.div>

        {/* Comparison Cards Grid Container with Centered Round VS Badge */}
        <div className="relative">
          {/* Desktop Centered Round VS Badge (Continuous Infinity Animation) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 6, -6, 0],
                y: [0, -6, 0],
                boxShadow: [
                  "0 10px 25px -5px rgba(51, 15, 129, 0.3), 0 0 0 0px rgba(115, 0, 255, 0.5)",
                  "0 20px 35px -5px rgba(51, 15, 129, 0.4), 0 0 0 16px rgba(115, 0, 255, 0)",
                  "0 10px 25px -5px rgba(51, 15, 129, 0.3), 0 0 0 0px rgba(115, 0, 255, 0.5)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#330F81] via-[#5917A8] to-[#7300ff] border-4 border-white text-white font-black text-base sm:text-lg flex items-center justify-center tracking-wider cursor-default select-none pointer-events-auto"
            >
              VS
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch relative z-10">

            {/* ================= LEFT CARD: Without PagarPe (Light Grey Clean Style) ================= */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border border-slate-200/90 bg-slate-50/70 p-6 sm:p-8 flex flex-col justify-between shadow-xs relative"
            >
              <div>
                {/* Card Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">
                  Without PagarPe
                </h3>

                {/* 5 Pain Points List with Dividers (From Software_Benefits.md Disadvantages) */}
                <div className="divide-y divide-slate-200/70 border-t border-b border-slate-200/70 mb-8">
                  <div className="py-3.5 flex items-start gap-3.5">
                    <X className="w-5 h-5 text-red-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-700 leading-snug">
                      <span className="font-bold text-slate-900">High Error Rate:</span> Manual data entry and calculations increase the risk of costly mistakes in payroll and attendance.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <X className="w-5 h-5 text-red-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-700 leading-snug">
                      <span className="font-bold text-slate-900">Time Consuming:</span> HR staff spends countless hours on paperwork instead of productive tasks.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <X className="w-5 h-5 text-red-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-700 leading-snug">
                      <span className="font-bold text-slate-900">Data Loss Risk:</span> Physical files or local spreadsheets can be easily lost, damaged, or corrupted.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <X className="w-5 h-5 text-red-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-700 leading-snug">
                      <span className="font-bold text-slate-900">Lack of Transparency:</span> Employees have no real-time visibility into leave balances or attendance records, leading to constant HR queries.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <X className="w-5 h-5 text-red-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-700 leading-snug">
                      <span className="font-bold text-slate-900">Slow Processes:</span> Leave approvals, payroll generation, and reporting face significant delays due to manual bottlenecks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Illustration Box & Bottom Warning Callout */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
                  <img
                    src="/images/without_pagarpe1.png"
                    alt="Without Pagarpe Illustration"
                    className="w-full h-48 sm:h-56 object-cover"
                  />
                </div>


              </div>
            </motion.div>

            {/* Mobile Centered Round VS Badge */}
            <div className="flex lg:hidden items-center justify-center py-2 z-20 relative">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                animate={{
                  scale: [1, 1.08, 1],
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#330F81] via-[#5917A8] to-[#7300ff] border-4 border-white text-white font-black text-sm flex items-center justify-center shadow-md tracking-wider select-none"
              >
                VS
              </motion.div>
            </div>

            {/* ================= RIGHT CARD: With PagarPe (Dynamic Brand Color & Thick Border Style) ================= */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border-[3px] border-[#330F81] bg-purple-50/40 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative"
            >
              <div>
                {/* Card Title in Brand Dynamic Color */}
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-primary-dark)] mb-6">
                  With PagarPe
                </h3>

                {/* 5 Benefit Points List with Dividers (From Software_Benefits.md Advantages) */}
                <div className="divide-y divide-purple-100/80 border-t border-b border-purple-100/80 mb-8">
                  <div className="py-3.5 flex items-start gap-3.5">
                    <Check className="w-5 h-5 text-[var(--color-primary-dark)] stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      <span className="font-bold text-slate-900">Attendance Tracking:</span> Automated, real-time check-ins prevent errors and buddy punching compared to manual registers.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <Check className="w-5 h-5 text-[var(--color-primary-dark)] stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      <span className="font-bold text-slate-900">Payroll Processing:</span> Instant, error-free salary calculations instead of time-consuming manual math.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <Check className="w-5 h-5 text-[var(--color-primary-dark)] stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      <span className="font-bold text-slate-900">Leave Management:</span> Digital leave applications with quick approvals and automatic balance tracking, replacing messy paper forms.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <Check className="w-5 h-5 text-[var(--color-primary-dark)] stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      <span className="font-bold text-slate-900">Data Security & Storage:</span> Centralized, secure cloud storage ensures data is never lost and is easily searchable.
                    </p>
                  </div>

                  <div className="py-3.5 flex items-start gap-3.5">
                    <Check className="w-5 h-5 text-[var(--color-primary-dark)] stroke-[2.5] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-800 leading-snug">
                      <span className="font-bold text-slate-900">Reporting & Efficiency:</span> Instant PDF/Excel reports, role-based access, and automated tasks save time and boost productivity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Illustration Box & Bottom Success Callout */}
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-purple-100 shadow-sm bg-white">
                  <img
                    src="/images/with_pagarpe1.png"
                    alt="With Pagarpe Illustration"
                    className="w-full h-48 sm:h-56 object-cover"
                  />
                </div>


              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default PagarPeComparisonSection;

