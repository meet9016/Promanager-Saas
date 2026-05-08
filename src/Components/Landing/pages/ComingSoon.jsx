import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Clock, Rocket, Bell, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ComingSoon = () => {
    const location = useLocation();
    const pageName = location.state?.pageName || 'This Feature';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-gradient-start)] via-[var(--color-primary-lightest)] to-[var(--color-primary-lighter)] flex items-center justify-center px-4 py-20">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center space-y-8">
                    {/* Animated Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.8,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                        }}
                        className="flex justify-center"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                                className="w-32 h-32 bg-[var(--color-primary-darker)] rounded-full flex items-center justify-center shadow-2xl"
                            >
                                <Rocket className="w-16 h-16 text-[var(--color-text-white)]" />
                            </motion.div>
                            
                            {/* Orbiting particles */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0"
                            >
                                <div className="w-3 h-3 bg-[var(--color-primary-darker)] rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2"></div>
                            </motion.div>
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0"
                            >
                                <div className="w-2 h-2 bg-[var(--color-primary-darker)] rounded-full absolute top-1/2 -right-3 transform -translate-y-1/2"></div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Coming Soon Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center px-6 py-3 bg-[var(--color-bg-secondary-30)] text-[var(--color-text-primary)] rounded-full text-sm font-medium border border-[var(--color-border-primary)] backdrop-blur-sm"
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Coming Soon
                    </motion.div>

                    {/* Main Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="space-y-4"
                    >
                        <h1 className="text-5xl lg:text-7xl font-bold text-[var(--color-text-primary)] leading-tight">
                            <span className="bg-[var(--color-primary-darker)] bg-clip-text text-transparent">
                                {pageName}
                            </span>{' '}
                            is On Its Way
                        </h1>
                        
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="text-lg lg:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto"
                        >
                            We're working hard to bring you something amazing. This feature will revolutionize your payroll experience with promanager.
                        </motion.p>
                    </motion.div>

                    {/* Notification Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-8 shadow-xl max-w-md mx-auto backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-center mb-4">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                }}
                            >
                                <Bell className="w-8 h-8 text-[var(--color-primary-darker)]" />
                            </motion.div>
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                            Get Notified When We Launch
                        </h3>
                        <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
                            Be the first to know when this feature goes live. We'll send you an update as soon as it's ready.
                        </p>
                        
                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-gradient-start)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-darker)] transition-all"
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="px-6 py-3 bg-[var(--color-primary-darker)] hover:bg-[var(--color-primary-darkest)] text-[var(--color-text-white)] rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                Notify Me
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Back to Home Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        className="pt-8"
                    >
                        <Link to="/">
                            <motion.button
                                whileHover={{ scale: 1.05, x: -5 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="inline-flex items-center px-8 py-4 text-base border-2 border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-focus)] rounded-full font-semibold transition-all duration-300"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Back to Home
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Features Preview */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12"
                    >
                        {[
                            { title: "Powerful", desc: "Built with cutting-edge technology" },
                            { title: "Intuitive", desc: "User-friendly and easy to navigate" },
                            { title: "Secure", desc: "Enterprise-grade security standards" }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 1.2 + (index * 0.1) }}
                                whileHover={{ y: -5 }}
                                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl p-8 backdrop-blur-sm hover:shadow-lg transition-all"
                            >
                                <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                                    {feature.title}
                                </h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;