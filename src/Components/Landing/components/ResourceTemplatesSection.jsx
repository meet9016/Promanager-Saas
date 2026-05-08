import React from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Heart, FileText, DollarSign, GraduationCap, Clock, UserMinus } from "lucide-react";

const resourceCategories = [
  {
    icon: Users,
    title: "Recruitment & Onboarding",
    description: "Hire the right talent and onboard employees seamlessly with structured workflows and checklists.",
  },
  {
    icon: TrendingUp,
    title: "Performance Management",
    description: "Set goals, track progress, and run performance reviews to boost employee productivity.",
  },
  {
    icon: Heart,
    title: "Employee Relations",
    description: "Build a positive workplace culture and resolve employee concerns with transparency.",
  },
  {
    icon: FileText,
    title: "HR Policies & Compliance",
    description: "Maintain updated policies and ensure your business stays compliant with labor regulations.",
  },
  {
    icon: DollarSign,
    title: "Payroll & Compensation",
    description: "Automate payroll processing, manage benefits, and ensure accurate salary disbursement.",
  },
  {
    icon: GraduationCap,
    title: "Training & Development",
    description: "Empower employees with skill development programs and track learning progress.",
  },
  {
    icon: Clock,
    title: "Time & Attendance",
    description: "Track employee working hours, leaves, and shifts with accurate time management tools.",
  },
  {
    icon: UserMinus,
    title: "Offboarding Management",
    description: "Handle resignations and exits smoothly with structured offboarding checklists.",
  }
];

const ResourceTemplatesSection = () => {
  return (
    <section className="py-10 lg:py-10 bg-white relative overflow-hidden">
      {/* Minimalist Monochrome Abstract SVG Background */}
      <div className="absolute inset-0 opacity-50">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#6C4CF1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Abstract Shapes */}
          <path d="M 0 50 Q 25 25, 50 50 T 100 50" stroke="#6C4CF1" strokeWidth="2" fill="none" opacity="0.05" />
          <path d="M 100 0 Q 75 25, 50 0 T 0 0" stroke="#4B2EDB" strokeWidth="2" fill="none" opacity="0.05" />
          
          {/* Geometric Lines */}
          <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#6C4CF1" strokeWidth="1" opacity="0.03" />
          <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#4B2EDB" strokeWidth="1" opacity="0.03" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#6C4CF1" strokeWidth="1" opacity="0.03" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#4B2EDB" strokeWidth="1" opacity="0.03" />
        </svg>
      </div>

      

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="max-w-3xl">
            {/* Title with Curved Line */}
            <div className="relative mb-8">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)] mb-6"
              >
                Resource Categories
              </motion.h3>
              
              {/* Curved Line SVG */}
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
                  stroke="url(#gradient-resources)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient-resources" x1="0%" y1="0%" x2="100%" y2="0%">
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
              className="text-4xl lg:text-5xl font-extrabold text-[var(--color-text-primary)] mb-6 leading-tight"
            >
              Organize HR Workflows with{" "}
              <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
                Ready-to-Use Templates
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-[var(--color-text-secondary)] leading-relaxed"
            >
              Access essential HR categories to streamline every stage of the employee lifecycle — from hiring to exit.
            </motion.p>
          </div>
        </motion.div>

        {/* Resource Categories Grid - Unique Design */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resourceCategories.map((category, index) => {
            const Icon = category.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                {/* Unique Layout - No traditional card */}
                <div className="relative">
                  {/* Icon Circle with Gradient Border */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-20 h-20 mb-4"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
                    <div className="absolute inset-0.5 bg-white rounded-2xl flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[#6C4CF1] transition-colors duration-300">
                      {category.title}
                    </h3>
                    
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {category.description}
                    </p>

                    {/* Animated Underline */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.08 + 0.3 }}
                      className="h-0.5 w-12 bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] origin-left group-hover:w-full transition-all duration-300"
                    />
                  </div>

                  {/* Hover Effect - Decorative Circle */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 0.1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] rounded-full blur-2xl"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Decorative Element */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6C4CF1]/10 to-[#4B2EDB]/10 rounded-full border border-[#6C4CF1]/20">
            <span className="text-sm font-semibold text-[#6C4CF1]">
              8 Essential HR Categories
            </span>
            <div className="w-2 h-2 bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] rounded-full animate-pulse" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResourceTemplatesSection;
