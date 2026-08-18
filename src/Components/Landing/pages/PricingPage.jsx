

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useNavigate } from "react-router-dom";
import API from "../../../api/axiosInstance";
import RegisterModal from "../../comman/RegisterModal";

const PricingPage = () => {
  const [users, setUsers] = useState(3);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Dynamic mapping functions so small user ranges (0..3) have clear visual space
  const userToPos = (u) => {
    if (u <= 0) return 0;
    if (u <= 3) return (u / 3) * 15;
    if (u <= 20) return 15 + ((u - 3) / 17) * 20;
    if (u <= 50) return 35 + ((u - 20) / 30) * 25;
    if (u <= 100) return 60 + ((u - 50) / 50) * 20;
    return 80 + ((u - 100) / 100) * 20;
  };

  const posToUser = (p) => {
    if (p <= 0) return 0;
    if (p <= 15) return Math.round((p / 15) * 3);
    if (p <= 35) return Math.round(3 + ((p - 15) / 20) * 17);
    if (p <= 60) return Math.round(20 + ((p - 35) / 25) * 30);
    if (p <= 80) return Math.round(50 + ((p - 60) / 20) * 50);
    return Math.round(100 + ((p - 80) / 20) * 100);
  };

  const activePlan = plans.length
    ? plans.findIndex((p) => {
      const range = (p.user_range || "").trim();

      if (range.endsWith("+")) {
        const min = parseInt(range);
        return users >= min;
      }

      const [min, max] = range.split("-").map(Number);
      return users >= min && users <= max;
    })
    : 0;
  const safeActivePlan = activePlan === -1 ? plans.length - 1 : activePlan;

  const estimated = plans.length
    ? (users * Number(plans[safeActivePlan]?.price_per_user || 0)).toLocaleString("en-IN")
    : "0";

  // Toast helpers
  const showToast = (message, type = 'info') => setToast({ message, type });

  const PLAN_COLORS = {
    free: { color: 'from-emerald-500 to-teal-600', accent: '#10b981' },
    silver: { color: 'from-slate-400 to-slate-500', accent: '#94a3b8' },
    gold: { color: 'from-[#6C4CF1] to-[#4B2EDB]', accent: '#6C4CF1' },
    platinum: { color: 'from-amber-500 to-yellow-400', accent: '#f59e0b' },
  };

  const getPlanColors = (name = '') => {
    const key = name.toLowerCase();
    return PLAN_COLORS[key] || PLAN_COLORS.gold;
  };

  const fetchPlanData = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const formData = new FormData();
      const response = await API.post('pricelist', formData, {
        apiType: 'web'
      });

      if (response?.data?.success) {
        const rawPlans = response.data.data || [];
        const hasFree = rawPlans.some(
          (p) => p.name?.toLowerCase() === "free" || Number(p.price_per_user) === 0 || p.user_range === "0-3"
        );

        if (!hasFree && rawPlans.length > 0) {
          const freePlan = {
            id: "free-plan",
            name: "Free",
            user_range: "0-3",
            price_per_user: "0",
            features: [
              "Attendance & Payroll",
              "Mobile + Web App",
              "AI Face + Biometric",
              "Leave & Expense Mgmt",
              "Reports & Compliance",
              "Roles & Permissions"
            ]
          };
          setPlans([freePlan, ...rawPlans]);
        } else {
          setPlans(rawPlans);
        }
      } else {
        showToast(
          response?.data?.message || 'Failed to fetch pricing data',
          'error'
        );
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      showToast(
        'Failed to load pricing data. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Pricing | ProManager</title>
        <meta name="description" content="Transparent pricing for payroll software." />
      </Helmet>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center pt-16 pb-10 px-4"
      >
        {/* Benefits Title with Curved Line */}
        <div className="relative inline-block mb-8">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]"
          >
            Pricing
          </motion.h3>

          {/* Curved Line SVG */}
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
              stroke="url(#gradient-benefits)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="gradient-benefits"
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

        <h2 className="text-4xl lg:text-5xl font-extrabold text-[var(--color-text-primary)] mb-4">
          Choose The Best Plan,{" "}
          <span className="bg-[var(--color-primary-dark)] bg-clip-text text-transparent">
            For Your Business
          </span>
        </h2>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Plans are customized as per your company size
        </p>
      </motion.div>

      <section className="px-4 pb-20">
        {loading || !plans.length ? (
          <div className="text-center py-20 text-[#6C4CF1] font-semibold animate-pulse">
            Loading pricing...
          </div>
        ) : (
          <>
            {/* ── ESTIMATOR ── */}
            <div className="container mx-auto mb-16 relative px-4 py-4">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#6C4CF1]/20 via-[#a78bfa]/10 to-transparent rounded-[2.5rem] blur-2xl pointer-events-none" />
              <div className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[1.75rem] p-5 shadow-[0_8px_40px_rgba(108,76,241,0.12)]">
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-gray-900">Estimate Your Monthly Cost</h3>
                </div>

                <div className="mb-1 px-1">
                  <style>{`
        .pricing-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px;
          background: linear-gradient(to right, #6C4CF1 ${userToPos(users)}%, #e5e7eb ${userToPos(users)}%);
          outline: none; cursor: pointer; }
        .pricing-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px;
          border-radius: 50%; background: #6C4CF1; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(108,76,241,0.4); cursor: pointer; }
        .pricing-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #6C4CF1;
          border: 3px solid white; box-shadow: 0 2px 8px rgba(108,76,241,0.4); cursor: pointer; }
      `}</style>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={userToPos(users)}
                    onChange={(e) => setUsers(posToUser(Number(e.target.value)))}
                    className="pricing-slider w-full"
                  />
                </div>

                {/* Clickable Tick Mark Labels with Proportional Visual Spacing */}
                <div className="relative w-full h-6 text-xs font-bold text-gray-500 mt-1 mb-4 select-none">
                  {[
                    { label: "0", val: 0, pos: "0%" },
                    { label: "3", val: 3, pos: "15%" },
                    { label: "20", val: 20, pos: "35%" },
                    { label: "50", val: 50, pos: "60%" },
                    { label: "100", val: 100, pos: "80%" },
                    { label: "200", val: 200, pos: "100%" },
                  ].map(({ label, val, pos }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setUsers(val)}
                      style={{
                        left: pos,
                        transform: pos === "0%" ? "none" : pos === "100%" ? "translateX(-100%)" : "translateX(-50%)"
                      }}
                      className={`absolute transition-all duration-150 hover:text-[#6C4CF1] cursor-pointer ${users === val ? "text-[#6C4CF1] font-black scale-110" : ""
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* 3 Estimator Cards matching Image 1 Red Box design */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {/* Card 1: USERS */}
                  <div className="bg-white rounded-2xl border border-[#6c4cf19e] p-4 sm:p-5 shadow-[0_4px_20px_rgba(108,76,241,0.04)] flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#EDE8FF] text-[#6C4CF1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-8" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        USERS
                      </span>
                      <span className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                        {users}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: SELECTED PLAN */}
                  <div className="bg-white rounded-2xl border border-[#6c4cf19e] p-4 sm:p-5 shadow-[0_4px_20px_rgba(108,76,241,0.04)] flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#EDE8FF] text-[#6C4CF1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-8" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        SELECTED PLAN
                      </span>
                      <span className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                        {plans[safeActivePlan]?.name || "Free"}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: EST. MONTHLY */}
                  <div className="bg-white rounded-2xl border border-[#6c4cf19e] p-4 sm:p-5 shadow-[0_4px_20px_rgba(108,76,241,0.04)] flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#EDE8FF] text-[#6C4CF1] flex items-center justify-center flex-shrink-0">
                      <svg className="w-8" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        EST. MONTHLY
                      </span>
                      <span className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                        ₹{estimated}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── PLANS GRID ── */}
            <div className="container mx-auto mb-16 relative px-4 py-4 grid md:grid-cols-4 gap-5 items-start">
              {plans.map((plan, i) => {
                const isActive = i === safeActivePlan;
                return (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative rounded-[1.75rem] p-7 transition-all duration-300 ${isActive
                      ? "bg-[var(--color-primary-dark)] text-white shadow-[0_20px_60px_rgba(108,76,241,0.35)] scale-[1.03] border border-white/10"
                      : "bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(108,76,241,0.12)] hover:border-[#6C4CF1]/20"
                      }`}
                  >
                    {isActive && (
                      <>
                        {/* inner glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-[var(--color-primary-darker)] text-[9px] font-black px-4 py-1 rounded-full shadow-md tracking-[0.15em] uppercase">
                          Best Match
                        </span>
                      </>
                    )}

                    {/* Plan header */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`text-lg font-black  ${isActive ? "text-white" : "text-[var(--color-text-primary)]"}`}>
                          {plan.name}
                        </h3>
                        <span className={`text-[12px] px-2 py-0.5 rounded-full font-semibold ${isActive ? "bg-white/15 text-white/80" : "bg-[#6C4CF1]/8 text-[var(--color-primary-darker)]"}`}>
                          {plan.user_range} users
                        </span>
                      </div>
                      <div className="mt-4 flex items-end gap-1">
                        <span className={`text-[2.6rem] font-black leading-none tracking-tighter ${isActive ? "text-white" : "text-[var(--color-primary-darker)]"}`}>
                          ₹{plan.price_per_user}
                        </span>
                        <span className={`text-sm pb-1.5 ${isActive ? "text-white/50" : "text-gray-400"}`}>/user/mo</span>
                      </div>
                      {/* Divider */}
                      <div className={`mt-5 h-px ${isActive ? "bg-white/15" : "bg-gray-100"}`} />
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5 mb-7">
                      {plan.features.map((f, j) => (
                        <div key={j} className={`text-sm flex gap-2.5 items-center ${isActive ? "text-white/85" : "text-gray-500"}`}>
                          <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-[#6C4CF1]/10 text-[var(--color-primary-darker)]"
                            }`}>✓</span>
                          {f}
                        </div>
                      ))}
                    </div>

                    <button
                      className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 ${isActive
                        ? "bg-white text-[var(--color-primary-darker)] hover:bg-white/90 shadow-md"
                        : "bg-[#6C4CF1]/8 text-[var(--color-primary-darker)] border border-[#6C4CF1]/20 hover:bg-[#6C4CF1] hover:text-white hover:border-transparent"
                        }`}
                      onClick={() => {
                        const isFree =
                          plan.name?.toLowerCase() === "free" ||
                          Number(plan.price_per_user) === 0 ||
                          plan.user_range === "0-3";

                        if (isFree) {
                          setIsRegisterOpen(true);
                        } else {
                          navigate("/payment", {
                            state: {
                              plan: {
                                ...plan,
                                ...getPlanColors(plan.name),
                              },
                              users,
                            },
                          });
                        }
                      }}
                    >
                      Get Started
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Free Plan Register Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </div>
  );
};

export default PricingPage;

