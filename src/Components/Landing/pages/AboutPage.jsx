import React from 'react';
import { motion } from 'framer-motion';
import AboutSection from '../components/AboutSection';
import { Helmet } from "@dr.pogodin/react-helmet";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>About ProManager | Payroll & Attendance Software</title>
                <meta
                    name="description"
                    content="Learn about ProManager (official payroll & attendance software). Discover our mission, vision, and commitment to simplifying payroll for modern businesses worldwide."
                />
                <link rel="canonical" href="https://promanager.in/about" />
            </Helmet>

            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-[#6C4CF1] via-[#5b3dd9] to-[#4B2EDB] text-white relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="about-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <circle cx="30" cy="30" r="1.5" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#about-grid)" />
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
                            About ProManager
                        </motion.h3>

                        <motion.svg
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-4"
                            viewBox="0 0 190 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <motion.path
                                d="M2 10C45 2, 90 2, 135 10C160 16, 175 10, 188 10"
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
                        Empowering Your{" "}
                        <span className="text-white/90">Payroll Journey</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-white/80 max-w-3xl mx-auto"
                    >
                        Transform your payroll management with innovative solutions designed to simplify processes, ensure accuracy, and save time for modern businesses.
                    </motion.p>
                </div>
            </section>

            <AboutSection />

            {/* Detailed About Section */}
            <section className="py-20 px-4 ">

                <div className="container mx-auto ">
                    <div className="absolute bottom-0 z-10   left-0 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left - Image */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="rounded-3xl overflow-hidden shadow-2xl"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="Payroll professionals"
                                    className="w-full h-96 object-cover"
                                />
                            </motion.div>

                            {/* Floating Stats */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-8 shadow-2xl border-2 border-[#6C4CF1]/20"
                            >
                                <div className="text-3xl font-black bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
                                    99%
                                </div>
                                <div className="text-sm text-[var(--color-text-secondary)]">Accuracy Rate</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl"
                            >
                                <div className="text-2xl font-bold text-[#6C4CF1]">10K+</div>
                                <div className="text-sm text-[var(--color-text-secondary)]">Users</div>
                            </motion.div>
                        </motion.div>

                        {/* Right - Content */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            {/* Title with Curved Line */}
                            <div className="relative mb-8">
                                <h3 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
                                    Our Mission
                                </h3>

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
                                        stroke="url(#gradient-mission)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="gradient-mission" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#6C4CF1" />
                                            <stop offset="100%" stopColor="#4B2EDB" />
                                        </linearGradient>
                                    </defs>
                                </motion.svg>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-primary)] mb-6 leading-tight">
                                Revolutionizing Payroll for{" "}
                                <span className="bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent">
                                    Modern Businesses
                                </span>
                            </h2>

                            <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed text-lg">
                                At ProManager, we believe that simplified payroll builds stronger businesses. Our mission is to transform how organizations handle salary disbursement, compliance, and workforce payments — with speed, accuracy, and transparency.
                            </p>

                            {/* Feature Points */}
                            <div className="space-y-4">
                                {[
                                    { title: "Scalable for Any Business Size", desc: "From startups to enterprises, ProManager adapts seamlessly to your needs." },
                                    { title: "Designed by Payroll Experts", desc: "Created by professionals who understand compliance and modern technology." }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex items-start gap-3 p-4 rounded-xl hover:bg-[#6C4CF1]/5 transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6C4CF1] to-[#4B2EDB] flex items-center justify-center flex-shrink-0 mt-1">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[var(--color-text-primary)] mb-1">{item.title}</h4>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Vision Section */}
            <section className="py-20 px-4 bg-white  text-black relative overflow-hidden">
                {/* Animated Background */}

                <div className="container mx-auto  relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        {/* Title with Curved Line */}
                        <div className="relative inline-block mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold">
                                Our Vision
                            </h2>

                            <motion.svg
                                initial={{ pathLength: 0, opacity: 0 }}
                                whileInView={{ pathLength: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                                className="absolute top-10 left-1/2 -translate-x-1/2 w-36 h-4"
                                viewBox="0 0 140 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <motion.path
                                    d="M2 10C30 2, 60 2, 90 10C110 16, 125 10, 138 10"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    opacity="0.6"
                                />
                            </motion.svg>
                        </div>

                        <p className="text-xl text-black/80 max-w-2xl mx-auto">
                            Built by payroll specialists and tech innovators with a passion for simplifying payroll worldwide.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                                title: "Innovation First",
                                description: "We continuously evolve with the latest payroll technology trends and client feedback.",
                                number: "01"
                            },
                            {
                                image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                                title: "Business-Centric",
                                description: "Every feature is designed with your business needs in mind — efficient and stress-free.",
                                number: "02"
                            },
                            {
                                image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                                title: "Global Support",
                                description: "Our dedicated team ensures you're never alone in your payroll journey.",
                                number: "03"
                            }
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: i * 0.15 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10 }}
                                className="group relative"
                            >
                                {/* Card */}
                                <div className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                                    {/* Image */}
                                    <div className="relative h-56 overflow-hidden">
                                        <motion.img
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ duration: 0.5 }}
                                            src={card.image}
                                            alt={card.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Number Badge */}
                                      
                                    </div>

                                    {/* Content */}
                                    <div className="p-8">
                                        <h3 className="text-xl font-bold mb-3 group-hover:text-black/90 transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-black/70 leading-relaxed">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
