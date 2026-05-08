import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, Shield, Zap } from "lucide-react";
import AboutProManager from "/images/About-ProManager.png";

const AboutSection = () => {
  const features = [
    {
      icon: CheckCircle2,
      title: "100% Accurate",
      desc: "Automated calculations ensure error-free payroll processing"
    },
    {
      icon: TrendingUp,
      title: "Save 50% Time",
      desc: "Reduce manual work and focus on growing your business"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      desc: "Bank-grade security with full tax compliance"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "Process payroll for 1000+ employees in minutes"
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-white relative ">

 <div className="absolute top-1/2 z-10   right-0 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Image */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              {/* Main Image */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden"
              >
                <img

                  src={AboutProManager}
                  alt="ProManager Dashboard"
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </motion.div>

              {/* Floating Stats Card */}
              {/* <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ y: -10 }}
                className="absolute -bottom-8 -right-8 bg-white rounded-2xl p-8 shadow-2xl border-2 border-[#6C4CF1]/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] flex items-center justify-center">
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-white font-black text-2xl"
                    >
                      10K+
                    </motion.span>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-text-primary)] text-xl">Payrolls</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Processed Monthly</p>
                  </div>
                </div>
              </motion.div> */}

             
            </div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8 order-1 lg:order-2"
          >
            {/* Badge with Curved Line */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-block mb-6"
              >
                <span className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
                  About ProManager
                </span>
              </motion.div>
              
              {/* Curved Line SVG under badge */}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                className="absolute top-10 left-0 w-56 h-4"
                viewBox="0 0 220 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M2 10C50 2, 100 2, 150 10C180 16, 200 10, 218 10"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6C4CF1" />
                    <stop offset="100%" stopColor="#4B2EDB" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl lg:text-5xl font-extrabold text-[var(--color-text-primary)] leading-tight mb-6"
            >
              Simplify Payroll,{" "}
              <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
                Empower Teams
              </span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-[var(--color-text-secondary)] leading-relaxed"
            >
              At our core, we believe that seamless payroll builds stronger teams. 
              That's why we created <span className="font-semibold text-[#6C4CF1]">ProManager</span> — an ultimate payroll software designed to simplify every aspect of workforce pay, 
              from salary and compliance to attendance, leave, and employee benefits.
            </motion.p>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[var(--color-border-primary)] shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--color-text-primary)] mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
