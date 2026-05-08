import React from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Users,
    title: "Automated Payroll Management",
    description: "Process salaries, deductions, and taxes accurately with just a few clicks — reducing errors and saving time.",
    image: "/images/Automated-Payroll-Management.png",
  },
  {
    icon: UserCheck,
    title: "Leave & Attendance Integration",
    description: "Seamlessly sync employee attendance and leave records to ensure payroll is always accurate and compliant.",
    image: "/images/Leave-Attendance-Integration.png",
  },
  {
    icon: BarChart3,
    title: "Real-Time Payroll Insights",
    description: "Track expenses, monitor compliance, and generate payroll reports with actionable insights in real time.",
    image: "/images/Real-Time-Payroll-Insights.png",
  }
];

const ServicesSection = () => {
  return (
    <section className="py-16 lg:py-20 bg-white relative ">
      <div className="absolute top-20 z-10   -left-20 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>

      <div className="absolute bottom-0 z-10   right-0 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>
      {/* Decorative Elements */}


      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="relative mb-8">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]"
                >
                  Our Services
                </motion.span>

                {/* Curved Line SVG */}
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                  className="absolute top-10 left-0 w-40 h-4"
                  viewBox="0 0 160 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M2 10C35 2, 70 2, 105 10C130 16, 145 10, 158 10"
                    stroke="url(#gradient-services)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient-services" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6C4CF1" />
                      <stop offset="100%" stopColor="#4B2EDB" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </div>

              <h2 className="text-3xl lg:text-4xl font-extrabold text-[var(--color-text-primary)] leading-tight">
                Future-Ready Payroll
                <br />
                <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
                  Management Platform
                </span>
              </h2>
            </div>
            <motion.p
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base text-[var(--color-text-secondary)] max-w-md"
            >
              Streamline your workforce management with powerful automation and insights
            </motion.p>
          </div>
        </motion.div>

        {/* Services - Alternating Layout */}
        <div className="space-y-16 lg:space-y-20">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isEven ? "" : "lg:grid-flow-dense"
                  }`}
              >
                {/* Image Side */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -100 : 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className={`relative ${isEven ? "" : "lg:col-start-2"}`}
                >
                  <div className="relative group">
                    {/* Main Image */}
                    <div className="relative rounded-2xl overflow-hidden ">

                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        src={service.image}
                        alt={service.title}
                        loading="lazy"
                        className="w-full h-[320px] object-contain"
                      />
                    </div>

                    {/* Floating Icon Badge */}
                    {/* <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
                      className={`absolute ${
                        isEven ? "-right-6 -bottom-6" : "-left-6 -bottom-6"
                      } w-16 h-16 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-xl flex items-center justify-center shadow-xl`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div> */}

                    {/* Decorative Elements */}
                    {/* <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className={`absolute ${
                        isEven ? "-left-8 top-8" : "-right-8 top-8"
                      } w-10 h-10 border-4 border-[#6C4CF1]/20 rounded-full`}
                    /> */}
                  </div>
                </motion.div>

                {/* Content Side */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 100 : -100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className={`space-y-6 ${isEven ? "" : "lg:col-start-1 lg:row-start-1"}`}
                >
                  {/* Number Badge */}


                  {/* Title */}
                  <h3 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] leading-tight">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                    {service.description}
                  </p>

                  {/* Learn More Link */}
                  <Link to="/login" className="inline-block">

                    <motion.div
                      whileHover={{ x: 10 }}
                      className="inline-flex items-center gap-3 text-[#6C4CF1] font-bold text-lg cursor-pointer group"
                    >
                      <span>Learn More</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6" />
                      </motion.div>
                    </motion.div>
                  </Link>


                  {/* Decorative Line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="h-1 w-16 bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] rounded-full origin-left"
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
