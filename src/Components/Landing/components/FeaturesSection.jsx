import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: DollarSign,
    title: "Accurate Payroll Processing",
    description:
      "Eliminate manual errors with automated salary calculations, tax deductions, and compliance-ready reports.",
  },
  {
    icon: Calendar,
    title: "Leave & Attendance Integration",
    description:
      "Sync employee attendance and leave records directly into payroll for seamless payouts every cycle.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Insights & Analytics",
    description:
      "Access dashboards and reports to track payroll expenses, employee costs, and financial trends instantly.",
  },
  {
    icon: Shield,
    title: "Compliance & Data Security",
    description:
      "Stay compliant with statutory regulations while ensuring sensitive employee payroll data remains secure.",
  },
  {
    icon: Users,
    title: "Employee Self-Service",
    description:
      "Enable employees to view payslips, tax documents, and payroll history anytime through a secure portal.",
  },
  {
    icon: Zap,
    title: "Faster & Scalable Operations",
    description:
      "Process payroll in minutes and scale effortlessly as your workforce grows, without added complexity.",
  },
];

// Features data from the provided HTML
const features = [
  {
    image: "/images/feature1.PNG",
    alt: "Attendance Management",
    title: "Attendance Management",
    description:
      "Track employee attendance in real-time with automated check-ins, biometric integration, and detailed logs to ensure accuracy and efficiency.",
  },
  {
    image: "/images/features3.PNG",
    alt: "Employee Management",
    title: "Employee Management",
    description:
      "Manage employee records, profiles, roles, and performance from a centralized dashboard for better workforce organization.",
  },
  {
    image: "/images/feature2.PNG",
    alt: "Shift Management",
    title: "Shift Management",
    description:
      "Easily create, assign, and manage employee shifts with flexible scheduling and real-time updates.",
  },
  {
    image: "/images/features4.PNG",
    alt: "Leave and Holiday Management",
    title: "Leave and Holiday Management",
    description:
      "Simplify leave requests, approvals, and holiday tracking with an automated system for better planning.",
  },
  {
    image: "/images/features5.PNG",
    alt: "Payroll Management",
    title: "Payroll Management",
    description:
      "Automate salary calculations, deductions, and payslip generation with an accurate and reliable payroll system.",
  },
  {
    image: "/images/features6.PNG",
    alt: "Loan and Advance Management",
    title: "Loan and Advance Management",
    description:
      "Manage employee loans and salary advances with easy tracking, approvals, and repayment scheduling.",
  },
  {
    image: "/images/features7.PNG",
    alt: "Reports",
    title: "Reports",
    description:
      "Generate detailed reports for attendance, payroll, and employee activities to gain insights and make better decisions.",
  },
];

const FeaturesSection = ({ noMoreFeatures = false }) => {
  return (
    <section className="py-10 lg:py-10 bg-white relative overflow-hidden">
      <Helmet>
        <title>Payroll Software Features | promanager</title>
        <meta
          name="description"
          content="Explore promanager payroll software features: automated salary processing, compliance-ready payroll, real-time insights, employee self-service, and secure HR operations."
        />
        <link rel="canonical" href="https://promanager.in/features" />
      </Helmet>

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#6C4CF1]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-[#4B2EDB]/5 to-transparent rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
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
              Benefits
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

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl lg:text-5xl font-extrabold text-[var(--color-text-primary)] mb-6"
          >
            Smarter Payroll,{" "}
            <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
              Better Business Outcomes
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto"
          >
            Drive efficiency, compliance, and employee satisfaction with
            intelligent, automated payroll management tools.
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-12 items-start  mx-auto mb-24">
          {/* Left Column - Benefits 1-3 */}
          <div className="space-y-10">
            {benefits.slice(0, 3).map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 mt-1"
                    >
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
                        <div className="absolute inset-0.5 bg-white rounded-2xl flex items-center justify-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-xl flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Content */}
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[#6C4CF1] transition-colors duration-300">
                        {benefit.title}
                      </h3>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Center Column - Image */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Decorative Elements */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-[#6C4CF1]/30 to-transparent rounded-full blur-2xl"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{
                  duration: 3,
                  delay: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-[#4B2EDB]/30 to-transparent rounded-full blur-2xl"
              />

              {/* Main Image */}
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.4 }}
                className="relative h-96"
              >
                <img
                  src="/images/Smarter-Payroll.png"
                  alt="Payroll Dashboard"
                  loading="lazy"
                  className="w-full h-full object-contain"
                />
              </motion.div>

              {/* Floating Shapes */}
              <motion.div
                animate={{ y: [-5, 5, -5], rotate: [0, 180, 360] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-12 -right-8 w-6 h-6 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded opacity-70"
              />
              <motion.div
                animate={{ y: [5, -5, 5], x: [-2, 2, -2] }}
                transition={{
                  duration: 3,
                  delay: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-20 -left-6 w-4 h-4 bg-gradient-to-br from-[#4B2EDB] to-[#6C4CF1] rounded opacity-70"
              />
            </div>
          </motion.div>

          {/* Right Column - Benefits 4-6 */}
          <div className="space-y-10">
            {benefits.slice(3, 6).map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index + 3}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 mt-1"
                    >
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
                        <div className="absolute inset-0.5 bg-white rounded-2xl flex items-center justify-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-xl flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Content */}
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[#6C4CF1] transition-colors duration-300">
                        {benefit.title}
                      </h3>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Zig-Zag Features Section */}
        <div className="pay-features-section image-title-text mt-20">
          {/* Features Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="relative inline-block mb-8">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]"
              >
                Powerful Features
              </motion.h3>

              {/* Curved Line SVG */}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-4"
                viewBox="0 0 160 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M2 10C40 2, 80 2, 120 10C140 16, 150 10, 158 10"
                  stroke="url(#gradient-features)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="gradient-features"
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

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl lg:text-5xl font-extrabold text-[var(--color-text-primary)] mb-6"
            >
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
                Manage Your Workforce
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto"
            >
              Comprehensive tools for attendance, payroll, compliance, and
              workforce management all in one place.
            </motion.p>
          </motion.div>

          {!noMoreFeatures ? (
            <div className="pay-features-container max-w-6xl mx-auto space-y-20">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className={`pay-feature-item flex flex-col ${index % 2 === 0
                      ? "lg:flex-row" // Even index: Image left, text right
                      : "lg:flex-row-reverse" // Odd index: Image right, text left
                    } items-center gap-8 lg:gap-16`}
                >
                  {/* Feature Image */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="pay-feature-image flex-1 w-full"
                  >
                    <div className="relative">
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#6C4CF1]/20 to-[#4B2EDB]/20 rounded-3xl blur-3xl transform scale-90" />

                      {/* Image */}
                      <img
                        src={feature.image}
                        alt={feature.alt}
                        loading="lazy"
                        className="w-full h-auto rounded-2xl shadow-2xl relative z-10"
                      />

                      {/* Decorative elements */}
                      <motion.div
                        animate={{
                          y: [-5, 5, -5],
                          rotate: [0, 5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className={`absolute ${index % 2 === 0
                            ? "-right-4 -bottom-4"
                            : "-left-4 -bottom-4"
                          } w-16 h-16 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-2xl opacity-20 blur-xl`}
                      />
                    </div>
                  </motion.div>

                  {/* Feature Text Content */}
                  <motion.div
                    initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="pay-feature-text flex-1 space-y-4"
                  >
                    {/* Feature number badge */}
                    <div className="inline-block">
                      <span className="text-sm font-semibold text-[#6C4CF1] bg-[#6C4CF1]/10 px-4 py-2 rounded-full">
                        Feature {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] leading-tight">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Learn More Link */}
                    <Link to="/login" className="inline-block">

                      <motion.a
                        href="/login"
                        className="inline-flex items-center gap-2 text-[#6C4CF1] font-semibold group mt-4"
                        whileHover={{ x: 5 }}
                      >
                        Learn More
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </motion.a>
                    </Link>

                  </motion.div>
                </motion.div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
