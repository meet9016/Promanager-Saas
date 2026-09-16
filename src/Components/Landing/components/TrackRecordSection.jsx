import React from "react";
import { motion } from "framer-motion";
import {
  Fingerprint,
  CloudUpload,
  Settings,
  Calculator,
  Send,
  ArrowRight,
  Sparkles
} from "lucide-react";

const processSteps = [
  {
    stepNumber: "01",
    icon: Fingerprint,
    title: "Punch",
    desc: "Finger or face scan",
  },
  {
    stepNumber: "02",
    icon: CloudUpload,
    title: "Sync",
    desc: "Data reaches the Cloud",
  },
  {
    stepNumber: "03",
    icon: Settings,
    title: "Process",
    desc: "Attendance, Shifts, Leaves applied",
  },
  {
    stepNumber: "04",
    icon: Calculator,
    title: "Calculate",
    desc: "Salary computed daily",
  },
  {
    stepNumber: "05",
    icon: Send,
    title: "Deliver",
    desc: "Payslip on Employee App",
  },
];

const TrackRecordSection = () => {
  return (
    <section className="pb-16 lg:pb-24 bg-gradient-to-b from-white via-purple-50/20 to-slate-50 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--color-primary-dark)] blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[var(--color-primary-dark)] blur-[120px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-[1450px]">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
        >
          {/* Top Title with Curved Underline (Matching Benefits Section style) */}
          <div className="relative inline-block mb-8">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]"
            >
              Workflow
            </motion.h3>

            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
              className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-4"
              viewBox="0 0 130 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M2 10C30 2, 60 2, 90 10C105 16, 115 10, 128 10"
                stroke="url(#gradient-workflow-ref)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="gradient-workflow-ref"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#6C4CF1" />
                  <stop offset="100%" stopColor="#4B2EDB" />
                </linearGradient>
              </defs>
            </motion.svg>
          </div>

          {/* Main Title */}
          <h2 className="text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
            From Punch To Payslip,{" "}
            <span className="text-[var(--color-primary-dark)] block sm:inline">
              Fully Automated
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-500 font-medium">
            Five simple steps. Zero manual efforts.
          </p>
        </motion.div>

        {/* 5 Process Steps Flow Container with Larger Gap */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-6 relative max-w-[1400px] mx-auto">
          {processSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <React.Fragment key={index}>
                {/* Step Item */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="flex flex-col items-center text-center group relative w-full sm:w-52 lg:w-44"
                >
                  {/* Big Icon Circle Container with Rotating Dotted Border & White Number Badge */}
                  <div className="relative mb-6">

                    {/* Main Big White Circle */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full bg-white border border-purple-100 shadow-xl shadow-purple-900/10 flex items-center justify-center transition-all duration-300 group-hover:shadow-purple-900/20 ">

                      {/* Continuous Rotating Dotted Outer Ring (Centered around main circle) */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                        className="absolute -inset-3.5 sm:-inset-4.5 lg:-inset-5.5 rounded-full border-[2.5px] border-dashed border-[var(--color-primary-dark)] opacity-70 pointer-events-none"
                        style={{ transformOrigin: "50% 50%" }}
                      />

                      <Icon className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-[var(--color-primary-dark)] transition-transform duration-300 group-hover:scale-110" />

                      {/* Step Number Badge (White Background with Dynamic Text & Border) */}
                      <div className="absolute top-0 right-0 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-white text-[var(--color-primary-dark)] font-extrabold text-xs sm:text-sm lg:text-base flex items-center justify-center shadow-lg border-2 border-[var(--color-primary-dark)] z-20">
                        {step.stepNumber}
                      </div>
                    </div>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-[16px] sm:text-[16px] font-medium text-slate-500 leading-snug max-w-[170px] mx-auto">
                    {step.desc}
                  </p>
                </motion.div>

                {/* Horizontal Animated Right Arrow between steps (Desktop only) */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center -mt-16 shrink-0 w-14 lg:w-18 px-1">
                    <motion.div
                      animate={{ x: [0, 6, 0], opacity: [0.75, 1, 0.75] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                      }}
                      className="w-full text-[var(--color-primary-dark)] flex items-center justify-center"
                    >
                      <svg
                        viewBox="0 0 65 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-7 lg:h-9 text-[var(--color-primary-dark)] stroke-current"
                      >
                        <path
                          d="M4 12H57M57 12L47 5M57 12L47 19"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default TrackRecordSection;




