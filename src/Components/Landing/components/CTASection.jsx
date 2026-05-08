import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Free 30-day trial",
  "No setup fees",
  "24/7 support",
  "GDPR compliant"
];

const CTASection = () => {
  return (
    <section className="py-20 lg:py-28 bg-white relative">
      {/* Decorative Background Elements */}
      <div className="absolute -top-20 z-10   -left-20 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Curved Title Section */}
          <div className="relative mb-8">
            <motion.div
              className="inline-block relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-xl lg:text-2xl font-bold text-[var(--color-primary)] mb-2">
                Start Your Journey Today
              </h3>

              {/* Curved Line SVG */}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-56 h-4"
                viewBox="0 0 220 12"
                fill="none"
              >
                <motion.path
                  d="M2 10C50 2, 100 2, 150 10C180 16, 200 10, 218 10"
                  stroke="var(--color-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </motion.svg>
            </motion.div>
          </div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-3xl lg:text-5xl font-extrabold mb-6 leading-tight text-[var(--color-text-primary)]"
          >
            Ready to Transform Your{" "}
            <span className="text-[var(--color-primary)]">Payroll Operations?</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Join thousands of companies using ProManager to streamline workforce management.
            Start your free trial today.
          </motion.p>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 mb-10"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-2 bg-[var(--color-primary)]/5 px-4 py-2 rounded-full"
              >
                <CheckCircle className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="text-[var(--color-text-primary)] font-medium">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Link to="/pricing" className="inline-block">

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-[var(--color-primary)] text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to="/contact" className="inline-block">

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[var(--color-primary)] font-bold rounded-full border-2 border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all duration-300"
            >
              Schedule Demo
            </motion.button>
            </Link>

          </motion.div>


          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-[var(--color-text-secondary)] text-sm"
          >
            No credit card required • Setup in 5 minutes
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
