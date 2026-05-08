import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Award, Check, TrendingUp, Clock, Zap } from 'lucide-react';
import AccordionDemo from '../components/Accordian';
import { Helmet } from "@dr.pogodin/react-helmet";

const BenefitItem = ({ text, index }) => (
    <motion.div
        className="flex items-start space-x-3"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ x: 5 }}
    >
        <motion.div
            className="w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.3 }}
        >
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </motion.div>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">{text}</p>
    </motion.div>
);

const PayrollBenefits = () => {
    const benefits = [
        "Automated payroll calculations ensure error-free salary processing every time.",
        "Real-time compliance updates keep you aligned with tax and labor regulations.",
        "Employee self-service portals reduce HR workload and improve transparency.",
        "Comprehensive benefits management attracts and retains top talent.",
        "Detailed analytics provide insights into payroll costs and workforce trends.",
        "Secure data encryption protects sensitive employee and financial information.",
    ];

    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>Payroll & Benefits Software | promanager</title>
                <meta name="description" content="Discover promanager Payroll & Benefits Software – automate salary disbursement, compliance, tax, and employee perks. Build trust and boost retention." />
                <link rel="canonical" href="https://promanager.in/payroll-benefits" />
            </Helmet>

            {/* Hero Section with Curved Design */}
            <div className="relative bg-[var(--color-primary)] overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                        transition={{ duration: 20, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                        animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
                        transition={{ duration: 15, repeat: Infinity }}
                    />
                </div>

                <div className="relative  mx-auto px-4 md:px-8 py-20 md:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <motion.div
                            className="space-y-8 z-10"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <motion.span
                                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-medium border border-white/20"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Zap className="w-4 h-4" />
                                All-in-One Efficiency
                            </motion.span>

                            <motion.h1
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Optimize Payroll & Benefits Management
                            </motion.h1>

                            <motion.p
                                className="text-white text-lg md:text-xl leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                Simplify payroll processing, benefits administration, and compliance management with a secure platform built for modern businesses.
                            </motion.p>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <motion.button
                                    className="bg-white text-[var(--color-primary)] px-8 py-4 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Get Started Free
                                </motion.button>
                                <motion.button
                                    className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Watch Demo
                                </motion.button>
                            </motion.div>
                        </motion.div>

                        {/* Right Stats Cards */}
                        <motion.div
                            className="grid grid-cols-2 gap-4 lg:gap-6"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {[
                                { icon: Users, label: "Companies", value: "10K+", color: "from-primary-400 to-primary-600" },
                                { icon: TrendingUp, label: "Accuracy", value: "99.9%", color: "from-green-400 to-green-600" },
                                { icon: Shield, label: "Compliant", value: "100%", color: "from-purple-400 to-purple-600" },
                                { icon: Clock, label: "Processing", value: "2min", color: "from-orange-400 to-orange-600" },
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                >
                                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                                    <p className="text-white/80 text-sm">{stat.label}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Curved Bottom */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                    </svg>
                </div>
            </div>

            {/* Features Section with Curved Title */}
            <div className="bg-white py-20">
               
                <div className=" mx-auto px-4 md:px-8">
                    {/* Curved Title Section */}
                    <div className="relative mb-16">
                        
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-block relative">
                                <span className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)]">
                                    Why Choose <span className="text-[var(--color-primary)]">Payroll Benefits</span>
                                </span>
                                <motion.svg
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                                    className="absolute -bottom-2 left-0 w-80 h-4"
                                    viewBox="0 0 320 12"
                                    fill="none"
                                >
                                    <motion.path
                                        d="M2 10C70 2, 150 2, 220 10C260 16, 290 10, 318 10"
                                        stroke="var(--color-primary)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </motion.svg>
                            </div>
                            <p className="text-[var(--color-text-secondary)] text-lg mt-6 max-w-2xl mx-auto">
                                Transform your payroll operations with intelligent automation and compliance
                            </p>
                        </motion.div>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: "Compliance Management",
                                desc: "Stay compliant with automated tax calculations and regulatory updates",
                                gradient: "from-primary-500 to-primary-600"
                            },
                            {
                                icon: Clock,
                                title: "Fast Processing",
                                desc: "Process payroll for thousands of employees in minutes, not hours",
                                gradient: "from-green-500 to-green-600"
                            },
                            {
                                icon: TrendingUp,
                                title: "Cost Optimization",
                                desc: "Reduce payroll costs with automated workflows and analytics",
                                gradient: "from-purple-500 to-purple-600"
                            },
                            {
                                icon: Users,
                                title: "Employee Self-Service",
                                desc: "Empower employees with access to payslips and tax documents",
                                gradient: "from-red-500 to-red-600"
                            },
                            {
                                icon: Award,
                                title: "Benefits Administration",
                                desc: "Manage health insurance, retirement plans, and perks seamlessly",
                                gradient: "from-yellow-500 to-yellow-600"
                            },
                            {
                                icon: Zap,
                                title: "Real-time Reports",
                                desc: "Access instant payroll reports and analytics dashboards",
                                gradient: "from-indigo-500 to-indigo-600"
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                className="group relative bg-[var(--color-white)] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[var(--color-border)]"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                            >
                                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">{feature.title}</h3>
                                <p className="text-[var(--color-text-secondary)] leading-relaxed">{feature.desc}</p>
                                <div className={`absolute bottom-0 left-0 right-0 h-1 w-[90%] m-auto bg-gradient-to-r ${feature.gradient} rounded-b-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform`} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Benefits Section with Curved Background */}
            <div className="relative bg-white py-20 ">
                {/* Top Curve */}

                <div className="absolute bottom-0 z-10   left-0 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>
                <div className="relative  mx-auto px-4 md:px-8">
                    {/* Curved Title */}
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-block relative">
                            <span className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)]">
                                Key <span className="text-[var(--color-primary)]">Benefits</span>
                            </span>
                            <motion.svg
                                initial={{ pathLength: 0, opacity: 0 }}
                                whileInView={{ pathLength: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                                className="absolute -bottom-2 left-0 w-48 h-4"
                                viewBox="0 0 190 12"
                                fill="none"
                            >
                                <motion.path
                                    d="M2 10C50 2, 100 2, 150 10C165 14, 175 10, 188 10"
                                    stroke="var(--color-primary)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </motion.svg>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <motion.div
                            className="bg-[var(--color-bg-primary)] rounded-3xl p-10 shadow-xl"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="space-y-6">
                                {benefits.map((benefit, index) => (
                                    <BenefitItem key={index} text={benefit} index={index} />
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            className="bg-[var(--color-primary)] rounded-3xl p-10 shadow-xl text-white flex flex-col justify-center"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="text-3xl font-bold mb-6">Ready to Streamline Payroll?</h3>
                            <p className="text-white/90 text-lg mb-8 leading-relaxed">
                                Join thousands of businesses that trust promanager for accurate, compliant, and efficient payroll management.
                            </p>
                            <motion.button
                                className="bg-white text-[var(--color-primary)] px-8 py-4 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all w-fit"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Start Free Trial
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>

            <AccordionDemo />
        </div>
    );
};

export default PayrollBenefits;
