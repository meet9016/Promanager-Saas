import React, { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import {
    Clock,
    BarChart,
    User,
    DollarSign,
    Cloud,
    Headphones,
    Layers,
    Puzzle
} from 'lucide-react';
import ServicesSection from '../components/ServicesSection';
import { Helmet } from "@dr.pogodin/react-helmet";

const cn = (...classes) => classes.filter(Boolean).join(' ');

const AnimatedCounter = ({ value, duration = 2000, prefix = '', suffix = '' }) => {
    const ref = useRef();
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { duration });
    const isInView = useInView(ref, { once: true, margin: "-10%" });

    useEffect(() => {
        if (isInView) motionValue.set(value);
    }, [motionValue, isInView, value]);

    useEffect(() => {
        springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = prefix + Math.floor(latest) + suffix;
            }
        });
    }, [springValue, prefix, suffix]);

    return <span ref={ref}>{prefix}0{suffix}</span>;
};

const Feature = ({ title, description, icon, index }) => {
    return (
        <motion.div
            className={cn(
                "flex flex-col lg:border-r py-10 relative group/feature",
                (index === 0 || index === 4) && "lg:border-l",
                index < 4 && "lg:border-b"
            )}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
            {index < 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-[#6C4CF1]/5 to-transparent pointer-events-none" />
            )}
            {index >= 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-[#6C4CF1]/5 to-transparent pointer-events-none" />
            )}

            <motion.div
                className="mb-4 relative z-10 px-10 text-[#6C4CF1]"
                whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2 } }}
            >
                {icon}
            </motion.div>

            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-[var(--color-border-secondary)] group-hover/feature:bg-[#6C4CF1] transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-[var(--color-text-primary)]">
                    {title}
                </span>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)] max-w-xs relative z-10 px-10">
                {description}
            </p>
        </motion.div>
    );
};

const ServicePage = () => {
    const features = [
        {
            title: "Seamless Payroll",
            description: "Automate salary calculations, deductions, and compliance with ease.",
            icon: <DollarSign className="w-6 h-6" />,
        },
        {
            title: "Smart Attendance",
            description: "Track employee attendance and leave with accuracy and real-time updates.",
            icon: <Clock className="w-6 h-6" />,
        },
        {
            title: "Scalable & Secure",
            description: "A cloud-based solution designed to grow with your business while keeping data safe.",
            icon: <Cloud className="w-6 h-6" />,
        },
        {
            title: "Employee Self-Service",
            description: "Give employees easy access to payslips, leave balances, and requests.",
            icon: <User className="w-6 h-6" />,
        },
        {
            title: "Performance Insights",
            description: "Get actionable analytics to measure workforce efficiency and productivity.",
            icon: <BarChart className="w-6 h-6" />,
        },
        {
            title: "Multi-Company Support",
            description: "Manage payroll and HR across multiple entities from one platform.",
            icon: <Layers className="w-6 h-6" />,
        },
        {
            title: "24/7 Support",
            description: "Our team is here to help you anytime, ensuring smooth operations.",
            icon: <Headphones className="w-6 h-6" />,
        },
        {
            title: "Flexible Integrations",
            description: "Easily connect with your existing tools and workflows for a unified system.",
            icon: <Puzzle className="w-6 h-6" />,
        },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>Payroll & HR Services | ProManager Official Platform</title>
                <meta name="description" content="Discover ProManager payroll and HR services. Automate salary, compliance, attendance, employee management, and insights with our secure SaaS platform." />
                <link rel="canonical" href="https://promanager.in/services" />
            </Helmet>

            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-[#6C4CF1] via-[#5b3dd9] to-[#4B2EDB] text-white relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="service-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <circle cx="30" cy="30" r="1.5" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#service-grid)" />
                    </svg>
                </div>

                <div className="container mx-auto  text-center relative z-10">
                    {/* Title with Curved Line */}
                    <div className="relative inline-block mb-8">
                        <motion.h3
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-xl lg:text-2xl font-bold"
                        >
                            Our Services
                        </motion.h3>
                        
                        <motion.svg
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-4"
                            viewBox="0 0 160 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <motion.path
                                d="M2 10C35 2, 70 2, 105 10C130 16, 145 10, 158 10"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                opacity="0.6"
                            />
                        </motion.svg>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl md:text-6xl font-extrabold mb-6"
                    >
                        Streamline Payroll &{" "}
                        <span className="text-white/90">Workforce Management</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-white/80 max-w-3xl mx-auto mb-8"
                    >
                        Manage everything from attendance and leave tracking to payroll, compliance, and employee insights — all in one secure platform.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-white text-[#6C4CF1] font-bold rounded-xl shadow-2xl hover:shadow-white/20 transition-all duration-300"
                        >
                            Get Started
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 font-bold rounded-xl hover:bg-white/20 transition-all duration-300"
                        >
                            Explore Features
                        </motion.button>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="py-16 ">
                <div className="container mx-auto  px-4">
                    {/* Title with Curved Line */}
                    <div className="relative text-center mb-16">
                        <div className="relative inline-block mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
                                Platform Features
                            </h2>
                            
                            <motion.svg
                                initial={{ pathLength: 0, opacity: 0 }}
                                whileInView={{ pathLength: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                                className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-4"
                                viewBox="0 0 190 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <motion.path
                                    d="M2 10C45 2, 90 2, 135 10C160 16, 175 10, 188 10"
                                    stroke="url(#gradient-features)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient-features" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6C4CF1" />
                                        <stop offset="100%" stopColor="#4B2EDB" />
                                    </linearGradient>
                                </defs>
                            </motion.svg>
                        </div>

                        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                            Empower your workforce with agile, scalable, and intelligent HR solutions built for tomorrow's challenges
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <Feature key={feature.title} {...feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            <ServicesSection />
        </div>
    );
};

export default ServicePage;
