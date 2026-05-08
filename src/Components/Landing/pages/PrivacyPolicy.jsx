import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Database, Eye, FileText, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const PrivacyPolicy = () => {
    const sections = [
        {
            id: 1,
            title: "Data Controller & Processor",
            icon: Shield,
            content: [
                { label: "Employer/Subscriber", desc: "Acts as the Data Controller." },
                { label: "promanager", desc: "Functions as the Data Processor, processing data solely to provide the platform services." },
                { label: "Note", desc: "Employers are responsible for obtaining necessary consent from employees before importing any personal or biometric data." }
            ]
        },
        {
            id: 2,
            title: "Information We Collect",
            icon: Database,
            subsections: [
                {
                    subtitle: "Personal & Employment Data",
                    items: ["Name, phone, email", "Address, date of birth", "Employee ID", "Joining date, department, designation", "Salary, payroll cycle", "Bank account details", "Tax-related information", "Emergency contacts"]
                },
                {
                    subtitle: "Attendance & Biometric Logs",
                    items: ["Imported biometric punch logs", "In/Out timestamps", "Optional GPS location for attendance (used only when employer enables GPS-based attendance)"]
                },
                {
                    subtitle: "Device & App Data",
                    items: ["Mobile OS information", "Device identifiers", "Camera access (profile images, document uploads)"]
                },
                {
                    subtitle: "Communication Data",
                    items: ["SMS OTP via MSG91", "Email via AWS SES", "Push notifications via Firebase"]
                }
            ]
        },
        {
            id: 3,
            title: "How We Use Your Data",
            icon: Eye,
            content: [
                "Attendance calculation & payroll processing",
                "Employee record management",
                "Notifications and alerts",
                "Security and fraud prevention",
                "Customer support",
                "App functionality & analytics"
            ]
        },
        {
            id: 4,
            title: "Storage & Security",
            icon: Lock,
            content: [
                { label: "Infrastructure", desc: "VPS + SQL Server, India region only" },
                { label: "Encryption", desc: "AES-256 at rest, TLS 1.2+ in transit" },
                { label: "Access Control", desc: "Role-based access with audit logging" },
                { label: "Backups", desc: "30-day retention" },
                { label: "Security Scans", desc: "Internal automated scans" },
                { label: "Data Isolation", desc: "No employee data stored outside app sandbox" }
            ]
        },
        {
            id: 5,
            title: "Data Retention",
            icon: FileText,
            content: [
                "Active subscription: data retained",
                "Backup retention: 30 days",
                "After subscription cancellation: 30-day window to export data; then permanent deletion",
                "Limited metadata may be retained for operational purposes"
            ]
        },
        {
            id: 6,
            title: "User Rights",
            icon: CheckCircle,
            content: [
                "Access to personal data",
                "Correction of inaccurate information",
                "Deletion (via employer request, as employer is Data Controller)"
            ]
        }
    ];

    const thirdPartyServices = [
        { service: "Firebase", purpose: "Notifications & analytics" },
        { service: "MSG91", purpose: "SMS OTP delivery" },
        { service: "Google Maps", purpose: "Optional location validation" },
        { service: "AWS SES", purpose: "Email communication" },
        { service: "Razorpay", purpose: "Subscription/payment processing" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-gradient-start)] via-[var(--color-primary-lightest)] to-[var(--color-primary-lighter)] py-20">
            <div className="container mx-auto px-4 ">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-primary-darker)] rounded-full mb-6 shadow-xl"
                    >
                        <Shield className="w-10 h-10 text-[var(--color-text-white)]" />
                    </motion.div>
                    
                    <h1 className="text-4xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-4">
                        🔒 <span className="bg-[var(--color-primary-darker)] bg-clip-text text-transparent">Privacy Policy</span>
                    </h1>
                    
                    <p className="text-lg text-[var(--color-text-secondary)] mb-2">
                        Effective Date: December 2025
                    </p>
                    
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-base text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed"
                    >
                        promanager ("we", "our", "Company") is committed to protecting your personal and employee information. This Privacy Policy explains how we collect, process, store, and handle data through our website, mobile apps, and services.
                    </motion.p>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="mt-6 inline-flex items-center px-6 py-3 bg-[var(--color-bg-secondary-30)] text-[var(--color-text-primary)] rounded-full text-sm font-medium border border-[var(--color-border-primary)] backdrop-blur-sm"
                    >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        By using promanager, you agree to the practices described below
                    </motion.div>
                </motion.div>

                {/* Main Sections */}
                {sections.map((section, index) => {
                    const IconComponent = section.icon;
                    return (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="mb-8"
                        >
                            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-8 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-primary-lightest)] rounded-lg flex items-center justify-center">
                                        <IconComponent className="w-6 h-6 text-[var(--color-primary-darker)]" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                                            {section.id}. {section.title}
                                        </h2>
                                    </div>
                                </div>

                                {section.subsections ? (
                                    <div className="space-y-6 ml-16">
                                        {section.subsections.map((subsection, subIndex) => (
                                            <div key={subIndex}>
                                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                                                    {section.id}.{subIndex + 1} {subsection.subtitle}
                                                </h3>
                                                <ul className="space-y-2">
                                                    {subsection.items.map((item, itemIndex) => (
                                                        <li key={itemIndex} className="flex items-start gap-3">
                                                            <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                            <span className="text-[var(--color-text-secondary)]">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="ml-16 space-y-3">
                                        {section.content.map((item, itemIndex) => (
                                            <div key={itemIndex}>
                                                {typeof item === 'string' ? (
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                        <span className="text-[var(--color-text-secondary)]">{item}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                        <div>
                                                            <span className="font-semibold text-[var(--color-text-primary)]">{item.label}:</span>
                                                            <span className="text-[var(--color-text-secondary)] ml-2">{item.desc}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Third Party Services Table */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mb-8"
                >
                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-8 shadow-lg backdrop-blur-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-primary-lightest)] rounded-lg flex items-center justify-center">
                                <Database className="w-6 h-6 text-[var(--color-primary-darker)]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                    4. Third-Party Sharing
                                </h2>
                                <p className="text-[var(--color-text-secondary)] mb-4">
                                    We share data only with trusted vendors to provide the service:
                                </p>
                            </div>
                        </div>

                        <div className="ml-16 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--color-border-primary)]">
                                        <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">Service</th>
                                        <th className="text-left py-3 px-4 font-semibold text-[var(--color-text-primary)]">Purpose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {thirdPartyServices.map((item, index) => (
                                        <tr key={index} className="border-b border-[var(--color-border-primary)] hover:bg-[var(--color-bg-hover)] transition-colors">
                                            <td className="py-3 px-4 font-medium text-[var(--color-text-primary)]">{item.service}</td>
                                            <td className="py-3 px-4 text-[var(--color-text-secondary)]">{item.purpose}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <p className="mt-4 ml-16 text-[var(--color-text-secondary)] font-medium">
                            We do not sell personal data to third parties or advertisers.
                        </p>
                    </div>
                </motion.div>

                {/* Additional Sections */}
                {[
                    {
                        num: 7,
                        title: "Children's Data",
                        content: "promanager does not target or collect data from individuals under 18 years of age."
                    },
                    {
                        num: 8,
                        title: "Location Permission Disclosure",
                        subtitle: "(Google Play Requirement)",
                        items: [
                            "Location is used only during attendance punch if employer enables GPS-based attendance",
                            "No live or background tracking",
                            "Location data is never shared with third parties"
                        ]
                    },
                    {
                        num: 9,
                        title: "Camera Permission Disclosure",
                        subtitle: "(App Store Requirement)",
                        content: "Camera access is used only for:",
                        items: [
                            "Profile photo capture",
                            "Document uploads for KYC or employer-required files"
                        ],
                        footer: "Images are stored securely and not used for any other purpose"
                    },
                    {
                        num: 10,
                        title: "OTP & Authentication",
                        items: [
                            "OTPs are used solely for authentication",
                            "OTPs are not stored after verification"
                        ]
                    },
                    {
                        num: 11,
                        title: "Data Breach Notification",
                        content: "In the event of a data breach, promanager will:",
                        items: [
                            "Immediately isolate affected systems",
                            "Assess impact",
                            "Notify the Subscriber without undue delay"
                        ]
                    },
                    {
                        num: 12,
                        title: "Cookies & Website Analytics",
                        items: [
                            "Cookies may be used for authentication, analytics, and website functionality",
                            "No tracking for advertising purposes"
                        ]
                    },
                    {
                        num: 13,
                        title: "Changes to This Policy",
                        content: "We may update this policy to reflect:",
                        items: [
                            "Service improvements",
                            "Legal or regulatory requirements"
                        ],
                        footer: "Changes will be posted on our website and in-app. Continued use constitutes acceptance of updated terms."
                    },
                    {
                        num: 14,
                        title: "Governing Law",
                        content: "This Privacy Policy is governed by the laws of India."
                    }
                ].map((section, index) => (
                    <motion.div
                        key={section.num}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-8 shadow-lg backdrop-blur-sm">
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                                {section.num}. {section.title}
                                {section.subtitle && (
                                    <span className="text-lg font-normal text-[var(--color-text-secondary)] ml-2">
                                        {section.subtitle}
                                    </span>
                                )}
                            </h2>
                            
                            {section.content && (
                                <p className="text-[var(--color-text-secondary)] mb-3">{section.content}</p>
                            )}
                            
                            {section.items && (
                                <ul className="space-y-2 mb-3">
                                    {section.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start gap-3">
                                            <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                            <span className="text-[var(--color-text-secondary)]">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            {section.footer && (
                                <p className="text-[var(--color-text-secondary)] mt-3">{section.footer}</p>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mb-8"
                >
                    <div className="bg-gradient-to-br from-[var(--color-primary-darker)] to-[var(--color-primary-darkest)] border border-[var(--color-primary-darker)] rounded-2xl p-8 shadow-xl text-[var(--color-text-white)]">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-3">
                                    15. Contact
                                </h2>
                                <p className="mb-4 opacity-90">
                                    For privacy-related inquiries or requests:
                                </p>
                                <div className="space-y-2">
                                    <p className="font-medium">
                                        Email: <a href="mailto:harshitkapadia563@gmail.com" className="underline hover:opacity-80 transition-opacity">harshitkapadia563@gmail.com</a>
                                    </p>
                                    <p className="opacity-90">
                                        Attention: Privacy Officer – promanager
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mt-12 text-sm text-[var(--color-text-secondary)]"
                >
                    <p>Last updated: December 2025</p>
                    <p className="mt-2">© 2025 promanager. All rights reserved.</p>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;