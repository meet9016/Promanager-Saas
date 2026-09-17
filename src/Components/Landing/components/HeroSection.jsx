import { Button } from "../ui/button";
import { ArrowRight, Play, Sparkles, TrendingUp, Users, Shield } from "lucide-react";
import heroImage from "/images/hero1.png";
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative pt-12 lg:py-20 overflow-hidden  bg-white  ">
      <div className="absolute top-28 z-10   -left-20 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>
      <div className="container mx-auto px-4 relative z-10 ">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">

            {/* Main Heading */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-normal sm:leading-relaxed"
              >
                <motion.span
                  className="block text-[var(--color-text-primary)] mb-2 pb-1"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  Payroll & HR Software
                </motion.span>
                <motion.span
                  className="inline-block w-full bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)] bg-clip-text text-transparent pb-2 pt-1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  for Easy Employee
                </motion.span>
                <motion.span
                  className="inline-block w-full bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)] bg-clip-text text-transparent pb-2 pt-1"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  Management
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="text-lg sm:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl"
              >
                Manage employee attendance, payroll, salary, leave, loans and more with powerful HR & payroll software
                <span className="font-semibold text-[var(--color-primary-dark)]"> built for modern businesses.</span>
              </motion.p>
            </div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/pricing" className="inline-block">

                  <Button
                    size="lg"
                    className="group px-8 py-7 text-base bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-primary-darker)] text-white shadow-2xl hover:shadow-[var(--color-primary)]/50 transition-all duration-300 font-bold rounded-xl"

                  >
                    Get Started Free
                    <motion.div
                      className="inline-block ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </Link>

              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="group px-8 py-7 text-base bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-lightest)] transition-all duration-300 font-bold rounded-xl shadow-lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="flex flex-wrap gap-6 pt-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">100+</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Businesses</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-success)] to-[var(--color-success-dark)] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">99.9%</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Uptime</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Secure</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Reliable</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative max-w-md sm:max-w-lg lg:max-w-xl mx-auto w-full"
          >
            {/* Background Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] via-[#6c4cf1] to-[var(--color-primary-dark)] rounded-3xl opacity-20 blur-lg pointer-events-none" />

            {/* Main Image */}
            <motion.div
              whileHover={{ scale: 1.02, rotateY: 5 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl p-2 bg-white/90 backdrop-blur-sm border-2 border-[var(--color-primary)]/25 shadow-2xl shadow-[var(--color-primary)]/15 ring-1 ring-black/5"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="relative overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)]/5 to-transparent z-10 pointer-events-none" />
                <img
                  src={heroImage}
                  loading="lazy"
                  alt="PagarPe Dashboard"
                  className="w-full h-auto object-contain rounded-xl max-h-[420px]"
                />
              </div>
            </motion.div>

            {/* Floating Card 1 - Bottom Left */}
            {/* <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              whileHover={{ y: -10, scale: 1.05 }}
              className="absolute -bottom-8 -left-8 bg-white rounded-2xl p-5 shadow-2xl border-2 border-[var(--color-primary-light)] backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
                  <motion.span
                    className="text-white font-black text-xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    100+
                  </motion.span>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text-primary)] text-lg">Businesses</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">Empowered</p>
                </div>
              </div>
            </motion.div> */}

            {/* Floating Card 2 - Top Right */}
            {/* <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              whileHover={{ y: -10, scale: 1.05 }}
              className="absolute -top-8 -right-8 bg-white rounded-2xl p-5 shadow-2xl border-2 border-[var(--color-success-light)] backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-success-dark)] flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-success-dark)] text-2xl">50%</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Time Saved</p>
                </div>
              </div>
            </motion.div> */}

            {/* Decorative Elements */}
            {/* <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-1/4 -right-12 w-24 h-24 bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] rounded-full blur-2xl opacity-40"
            /> */}
            {/* <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-1/4 -left-12 w-32 h-32 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full blur-2xl opacity-30"
            /> */}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
