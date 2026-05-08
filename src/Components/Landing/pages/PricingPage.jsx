import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "@dr.pogodin/react-helmet";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import API from "../../../api/axiosInstance";

const PricingPage = () => {
  const [users, setUsers] = useState(50);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  const [toast, setToast] = useState(null);
  const navigate = useNavigate();


  const activePlan = plans.length
    ? plans.findIndex((p, index) => {
      const range = p.user_range.trim();

      // Handle "100+"
      if (range.endsWith("+")) {
        const min = parseInt(range);
        return users >= min;
      }

      const [min, max] = range.split("-").map(Number);

      // Make upper bound exclusive EXCEPT last defined range
      return users >= min && users < max;
    })
    : 0;
  const safeActivePlan = activePlan === -1 ? plans.length - 1 : activePlan;

  const estimated = plans.length
    ? (users * Number(plans[safeActivePlan]?.price_per_user || 0)).toLocaleString("en-IN")
    : "0";
  // Toast helpers
  const showToast = (message, type = 'info') => setToast({ message, type });
  const closeToast = () => setToast(null);

  // Add color map above component or in a shared constants file
  const PLAN_COLORS = {
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
        setPlans(response.data.data);
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
    fetchPlanData()
  }, [])

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
          <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
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
            <div className="max-w-5xl mx-auto mb-16 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#6C4CF1]/20 via-[#a78bfa]/10 to-transparent rounded-[2.5rem] blur-2xl pointer-events-none" />
              <div className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[1.75rem] p-5 shadow-[0_8px_40px_rgba(108,76,241,0.12)]">
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-gray-900">Estimate Your Monthly Cost</h3>
                </div>

                <div className="mb-1 px-1">
                  <style>{`
        .pricing-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px;
          background: linear-gradient(to right, #6C4CF1 ${((users - 1) / 199) * 100}%, #e5e7eb ${((users - 1) / 199) * 100}%);
          outline: none; cursor: pointer; }
        .pricing-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px;
          border-radius: 50%; background: #6C4CF1; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(108,76,241,0.4); cursor: pointer; }
        .pricing-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #6C4CF1;
          border: 3px solid white; box-shadow: 0 2px 8px rgba(108,76,241,0.4); cursor: pointer; }
      `}</style>
                  <input type="range" min={1} max={200} value={users}
                    onChange={(e) => setUsers(Number(e.target.value))}
                    className="pricing-slider w-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] mb-4 px-1">
                  {[1, 50, 100, 150, 200].map(n => <span key={n}>{n}</span>)}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Users", value: users, accent: false },
                    { label: "Plan", value: plans[safeActivePlan]?.name, accent: true },
                    { label: "Est. Monthly", value: `₹${estimated}`, accent: true },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 px-3 py-3 text-center shadow-sm">
                      {accent && <div className="absolute inset-0 bg-gradient-to-br from-[#6C4CF1]/5 to-[#4B2EDB]/5 pointer-events-none" />}
                      <p className="text-[10px] uppercase tracking-widest mb-1">{label}</p>
                      <p className={`font-black text-xl tracking-tight ${accent ? "text-[#6C4CF1]" : "text-gray-900"}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── PLANS GRID ── */}
            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5 items-start">
              {plans.map((plan, i) => {
                const isActive = i === safeActivePlan;
                return (
                  <motion.div
                    key={i}

                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative rounded-[1.75rem] p-7 transition-all duration-300 ${isActive
                      ? "bg-gradient-to-b from-[#7C5CF5] to-[#4B2EDB] text-white shadow-[0_20px_60px_rgba(108,76,241,0.35)] scale-[1.03] border border-white/10"
                      : "bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(108,76,241,0.12)] hover:border-[#6C4CF1]/20"
                      }`}
                  >
                    {isActive && (
                      <>
                        {/* inner glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-[#6C4CF1] text-[9px] font-black px-4 py-1 rounded-full shadow-md tracking-[0.15em] uppercase">
                          Best Match
                        </span>
                      </>
                    )}

                    {/* Plan header */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`text-lg font-black tracking-tight ${isActive ? "text-white" : "text-[var(--color-text-primary)]"}`}>
                          {plan.name}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isActive ? "bg-white/15 text-white/80" : "bg-[#6C4CF1]/8 text-[#6C4CF1]"
                          }`}>
                          {plan.user_range} users
                        </span>
                      </div>
                      <div className="mt-4 flex items-end gap-1">
                        <span className={`text-[2.6rem] font-black leading-none tracking-tighter ${isActive ? "text-white" : "text-[#6C4CF1]"}`}>
                          ₹{plan.price_per_user}
                        </span>
                        <span className={`text-xs pb-1.5 ${isActive ? "text-white/50" : "text-gray-400"}`}>/user/mo</span>
                      </div>
                      {/* Divider */}
                      <div className={`mt-5 h-px ${isActive ? "bg-white/15" : "bg-gray-100"}`} />
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5 mb-7">
                      {plan.features.map((f, j) => (
                        <div key={j} className={`text-sm flex gap-2.5 items-center ${isActive ? "text-white/85" : "text-gray-500"}`}>
                          <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-[#6C4CF1]/10 text-[#6C4CF1]"
                            }`}>✓</span>
                          {f}
                        </div>
                      ))}
                    </div>

                    <button className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 ${isActive
                      ? "bg-white text-[#6C4CF1] hover:bg-white/90 shadow-md"
                      : "bg-[#6C4CF1]/8 text-[#6C4CF1] border border-[#6C4CF1]/20 hover:bg-[#6C4CF1] hover:text-white hover:border-transparent"
                      }`}
                      // PricingPage — button onClick
                      onClick={() => navigate("/payment", {
                        state: {
                          plan: {
                            ...plan,
                            ...getPlanColors(plan.name),
                          },
                          users,
                        }
                      })}
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
    </div>
  );
};

export default PricingPage;