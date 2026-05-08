import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const coreFeatures = [
  {
    title: "Automated Payroll Processing",
    description: "Eliminate manual errors with precise salary, deduction, and compliance calculations.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
    benefits: ["Zero calculation errors", "Tax compliance ready", "Instant processing"]
  },
  {
    title: "Digital Payslip Distribution",
    description: "Deliver payslips instantly and securely to employees with one-click access.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
    benefits: ["Instant delivery", "Secure access", "Mobile friendly"]
  },
  {
    title: "Leave & Attendance Integration",
    description: "Seamlessly sync attendance and leave data for accurate payroll every cycle.",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
    benefits: ["Real-time sync", "Accurate tracking", "Auto calculations"]
  }
];

const CoreFeaturesSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-[var(--color-primary)] text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="core-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <motion.circle
                cx="30"
                cy="30"
                r="1.5"
                fill="white"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#core-grid)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header with Curved Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          {/* Curved Title Section */}
          <div className="relative mb-8">
            <motion.div
              className="inline-block relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Core Features
              </h3>

              {/* Curved Line SVG */}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-4"
                viewBox="0 0 160 12"
                fill="none"
              >
                <motion.path
                  d="M2 10C35 2, 70 2, 105 10C130 16, 145 10, 158 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </motion.svg>
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl lg:text-5xl font-extrabold mb-6"
          >
            Smart Payroll. Zero Hassle.{" "}
            <span className="text-white/90">Maximum Accuracy.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/80 text-lg leading-relaxed"
          >
            Explore the powerful features of ProManager designed to automate payroll,
            ensure compliance, and give employees a seamless experience.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {coreFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="relative h-full">
                {/* Number Badge */}


                {/* Card Content */}
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 h-full flex flex-col hover:bg-white/15 transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <motion.img
                      loading="lazy"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/50 to-transparent" />

                    {/* Sparkle Icon */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col space-y-4">
                    <h3 className="text-xl font-bold group-hover:text-white/90 transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-white/70 text-sm leading-relaxed flex-1">
                      {feature.description}
                    </p>

                    {/* Benefits */}
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: index * 0.15 + 0.5 + idx * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-white/80 text-sm">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Arrow */}
                    <Link to="/login" className="inline-block">

                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors cursor-pointer pt-2"
                      >
                        <span className="text-sm font-semibold">Learn More</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </Link>

                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full border border-white/20">
            <span className="text-3xl font-black">0</span>
            <span className="text-lg">Payroll Errors in Last 12 Months</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CoreFeaturesSection;
