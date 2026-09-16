import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Fingerprint,
  MapPin,
  Camera,
  Cpu,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  Map,
  RotateCw
} from "lucide-react";
import biometricImg from "../../../assets/biometric_preview.jpg";
import geoImg from "../../../assets/geolocation_preview.jpg";

const BiometricGeoSection = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const biometricSteps = [
    {
      step: "01",
      title: "Scan Face",
      desc: "Employee looks at mobile or kiosk camera.",
      icon: Camera,
    },
    {
      step: "02",
      title: "AI Liveness Check",
      desc: "3D facial mesh verified in 0.2 seconds.",
      icon: Cpu,
    },
    {
      step: "03",
      title: "Instant Cloud Punch",
      desc: "Attendance logged with time & synced.",
      icon: CheckCircle2,
    },
  ];

  const geoSteps = [
    {
      step: "01",
      title: "Detect Location",
      desc: "App locks device GPS coordinates.",
      icon: Navigation,
    },
    {
      step: "02",
      title: "Geofence Check",
      desc: "Verifies if inside assigned site radius (50m).",
      icon: ShieldCheck,
    },
    {
      step: "03",
      title: "Verified Map Log",
      desc: "Punch accepted with precise map stamp.",
      icon: Map,
    },
  ];

  return (
    <section className="pt-10 lg:pt-15 bg-gradient-to-b from-white via-purple-50/20 to-slate-50 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--color-primary-dark)] blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[var(--color-primary-dark)] blur-[120px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-[1350px]">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-4 lg:mb-5"
        >
          {/* Top Title with Curved Underline (Matching Benefits Section style) */}
          <div className="relative inline-block mb-6 sm:mb-8">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]"
            >
              Biometric & Geo
            </motion.h3>

            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
              className="absolute top-10 left-1/2 -translate-x-1/2 w-44 sm:w-48 h-4"
              viewBox="0 0 160 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M2 10C40 2, 80 2, 120 10C135 16, 145 10, 158 10"
                stroke="url(#gradient-biogeo-ref)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="gradient-biogeo-ref"
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] mb-3 leading-tight">
            Smart Attendance,{" "}
            <span className="text-[var(--color-primary-dark)] block sm:inline">
              Biometric & Geo-Tracking
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 font-medium mb-6">
            Simple 3-step automated workflow for face recognition & location-based punching.
          </p>

          {/* Prominent Flip-Flop Switch Toggle Pills */}
          <div className="inline-flex p-1.5 rounded-xl bg-slate-100 border border-slate-200/80 shadow-inner gap-1.5">
            <button
              onClick={() => setIsFlipped(false)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm lg:text-base duration-300 ${!isFlipped
                ? "bg-white text-[var(--color-primary-dark)] shadow-sm border border-purple-100 scale-[1.01]"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary-dark)]" />
              <span>Face Biometric Process</span>
            </button>

            <button
              onClick={() => setIsFlipped(true)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm lg:text-base duration-300 ${isFlipped
                ? "bg-white text-[var(--color-primary-dark)] shadow-sm border border-purple-100 scale-[1.01]"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary-dark)]" />
              <span>GPS Geolocation Process</span>
            </button>
          </div>
        </motion.div>

        {/* Real 3D Flip Card Container */}
        <div className="max-w-[1200px] mx-auto min-h-[420px] relative [perspective:1400px]">
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full relative [transform-style:preserve-3d]"
          >
            {/* FRONT SIDE: Biometric Process */}
            <div className="w-full bg-white border border-purple-100/80 shadow-xl shadow-purple-950/5 rounded-2xl p-5 sm:p-7 lg:p-9 [backface-visibility:hidden] relative">


              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                {/* Left Preview Image */}
                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-xl overflow-hidden border border-purple-100 shadow-md group">
                    <img
                      src={biometricImg}
                      alt="Biometric Face Scan Process"
                      className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-purple-100 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-semibold text-slate-800">Face Match: 99.9%</span>
                    </div>
                  </div>
                </div>

                {/* Right 3-Step Process Flow */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-purple-100/80 border border-purple-200 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-sm">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Face Biometric Punch Process
                    </h3>
                  </div>

                  {/* 3 Step Cards */}
                  <div className="space-y-2.5">
                    {biometricSteps.map((s, idx) => {
                      const Icon = s.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3.5 p-2.5 px-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-purple-300 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-sm"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--color-primary-dark)] text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {s.step}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {s.title}
                            </h4>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-tight">
                              {s.desc}
                            </p>
                          </div>

                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-inner">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* BACK SIDE: Geolocation Process (Rotated 180deg) */}
            <div className="w-full bg-white border border-purple-100/80 shadow-xl shadow-purple-950/5 rounded-2xl p-5 sm:p-7 lg:p-9 [backface-visibility:hidden] [transform:rotateY(180deg)] absolute top-0 left-0">

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                {/* Left 3-Step Process Flow */}
                <div className="lg:col-span-7 space-y-4 order-2 lg:order-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-purple-100/80 border border-purple-200 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-sm">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      GPS Geolocation Punch Process
                    </h3>
                  </div>

                  {/* 3 Step Cards */}
                  <div className="space-y-2.5">
                    {geoSteps.map((s, idx) => {
                      const Icon = s.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3.5 p-2.5 px-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-purple-300 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-sm"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--color-primary-dark)] text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {s.step}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {s.title}
                            </h4>
                            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-tight">
                              {s.desc}
                            </p>
                          </div>

                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-inner">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Preview Image */}
                <div className="lg:col-span-5 relative order-1 lg:order-2">
                  <div className="relative rounded-xl overflow-hidden border border-purple-100 shadow-md group">
                    <img
                      src={geoImg}
                      alt="Geolocation Process Preview"
                      className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-purple-100 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
                      <span className="text-xs font-semibold text-slate-800">Geofence: 50m Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default BiometricGeoSection;
