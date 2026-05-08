import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Shield, Users, CreditCard, Database, Lock, Ban, Settings, Scale, Mail, Phone } from 'lucide-react';

const TermsOfService = () => {
    const sections = [
        {
            num: 1,
            title: "ACCEPTANCE OF TERMS",
            icon: FileText,
            content: "By accessing or using promanager (\"Service\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree, you must not use the Service."
        },
        {
            num: 2,
            title: "ELIGIBILITY",
            icon: Users,
            items: [
                "You must be at least 18 years old to use the Service.",
                "You must have the authority to enter into agreements on behalf of the organization you represent.",
                "The Service is intended for business use only (B2B and B2C organizations)."
            ]
        },
        {
            num: 3,
            title: "DEFINITIONS",
            icon: FileText,
            definitions: [
                { term: "Service", desc: "promanager payroll, attendance, and HRMS features (web + mobile)." },
                { term: "We, Us, Our", desc: "promanager and its owner/affiliates." },
                { term: "You, User, Client, Organization", desc: "The individual or entity using the Service." },
                { term: "Third Parties", desc: "Vendors, APIs, payment gateways, hosting providers, SMS/email vendors, etc." }
            ]
        },
        {
            num: 4,
            title: "DESCRIPTION OF SERVICE",
            icon: Settings,
            content: "promanager provides features including but not limited to:",
            items: [
                "Employee management",
                "Attendance tracking (bulk, daily, and biometric-compatible)",
                "Leave management",
                "Payroll processing (monthly, hourly, and finalized pay)",
                "Reporting and analytics",
                "Role-based access control",
                "Admin dashboard",
                "Email/SMS notifications (if enabled)"
            ],
            footer: "Features may be added, modified, or removed as part of regular updates."
        },
        {
            num: 5,
            title: "USER RESPONSIBILITIES",
            icon: Shield,
            content: "You agree to:",
            items: [
                "Provide accurate information.",
                "Maintain confidentiality of login credentials.",
                "Comply with applicable laws, including labour and data protection laws.",
                "Use promanager only for lawful business purposes."
            ]
        },
        {
            num: 6,
            title: "PROHIBITED ACTIVITIES",
            icon: Ban,
            content: "You must NOT:",
            items: [
                "Reverse-engineer, decompile, or attempt to extract source code.",
                "Access the system using unauthorized tools, bots, crawlers, or scrapers.",
                "Attempt to bypass security or authentication mechanisms.",
                "Upload harmful code (malware, worms, viruses).",
                "Interfere with system performance or abuse server resources.",
                "Use the Service for fraudulent payroll or falsified attendance data.",
                "Share your account with unauthorized users."
            ],
            footer: "Violation may result in immediate termination without refund.",
            highlight: true
        },
        {
            num: 7,
            title: "ACCOUNT & ACCESS",
            icon: Lock,
            content: "You are responsible for:",
            items: [
                "Safeguarding your credentials",
                "All activities under your account",
                "Informing us immediately if unauthorized access occurs"
            ],
            footer: "We may suspend accounts to protect security and data integrity."
        },
        {
            num: 8,
            title: "FEES, BILLING & PAYMENT",
            icon: CreditCard,
            items: [
                "Subscription fees depend on the plan selected.",
                "All payments are final and non-refundable.",
                "Non-payment may result in suspension or termination of access.",
                "Prices may change. You will be notified in advance for renewals."
            ]
        },
        {
            num: 9,
            title: "NO REFUNDS",
            icon: AlertTriangle,
            content: "All services, including subscriptions, usage fees, or add-ons, are non-refundable under all circumstances, including:",
            items: [
                "Cancellation of service",
                "Failure to use the product",
                "Data loss caused by user error",
                "Account suspension due to misuse"
            ],
            highlight: true
        },
        {
            num: 10,
            title: "DATA COLLECTION & PRIVACY",
            icon: Database,
            content: "We collect and process data in accordance with our Privacy Policy. We may collect:",
            items: [
                "Employee records",
                "Attendance logs",
                "Payroll information",
                "Device and usage data",
                "Email/SMS communications",
                "IP and access metadata",
                "Uploaded documents (ID proofs, photos, letters)"
            ],
            footer: "You must obtain appropriate consent from your employees before uploading their data."
        },
        {
            num: 11,
            title: "DATA STORAGE & SECURITY",
            icon: Lock,
            content: "We use standard industry practices such as:",
            items: [
                "Encrypted databases",
                "Secure access tokens",
                "Role-based authorization",
                "Regular backups",
                "Cloud hosting with reputable vendors"
            ],
            footer: "However, no system is 100% secure, and we cannot guarantee absolute protection against breaches."
        }
    ];

    const additionalSections = [
        {
            num: 12,
            title: "THIRD-PARTY SERVICES",
            content: "promanager may use:",
            items: [
                "Cloud hosting providers",
                "Email APIs (e.g., SMTP services)",
                "SMS gateways",
                "Payment processors",
                "Third-party authentication (optional)"
            ],
            footer: "We are not responsible for downtime, issues, or data handling by these providers."
        },
        {
            num: 13,
            title: "SERVICE AVAILABILITY (SLA)",
            content: "We aim for high uptime and performance but do not guarantee uninterrupted availability due to:",
            items: [
                "Scheduled maintenance",
                "Server outages",
                "Third-party service failures",
                "Internet issues on your side",
                "Force majeure events"
            ]
        },
        {
            num: 14,
            title: "MODIFICATIONS TO THE SERVICE",
            content: "We may:",
            items: [
                "Update features",
                "Add new modules",
                "Remove outdated or insecure functionalities",
                "Change pricing or plan structure",
                "Modify UI/UX",
                "Introduce new APIs"
            ],
            footer: "You agree that these changes may happen without prior notice unless required by law."
        },
        {
            num: 15,
            title: "SUSPENSION & TERMINATION",
            content: "We may suspend or terminate your account if:",
            items: [
                "You violate these Terms",
                "There is fraudulent, illegal, or abusive activity",
                "You fail to pay subscription fees",
                "Your usage threatens system stability or security"
            ],
            additional: {
                subtitle: "Upon termination:",
                items: [
                    "Access to the system will be disabled",
                    "Stored data may be deleted after a retention period",
                    "No refunds will be issued"
                ]
            }
        },
        {
            num: 16,
            title: "CONFIDENTIALITY",
            content: "Both parties agree to protect:",
            items: [
                "Payroll data",
                "Employee details",
                "Internal policies",
                "Business documents",
                "Credentials and access tokens",
                "Communication logs"
            ],
            footer: "We will never sell your confidential information."
        },
        {
            num: 17,
            title: "INTELLECTUAL PROPERTY",
            content: "All rights to:",
            items: [
                "Software code",
                "UI/UX",
                "Databases",
                "APIs",
                "Documents",
                "Branding",
                "Logos",
                "System workflows"
            ],
            footer: "are owned exclusively by promanager. No license beyond service usage is granted."
        },
        {
            num: 18,
            title: "LIMITATION OF LIABILITY",
            content: "To the maximum extent permitted by law:",
            items: [
                "promanager is not responsible for business losses, revenue loss, reputation damage, or legal penalties caused by misuse, incorrect payroll, or user errors.",
                "promanager is not liable for indirect, incidental, or consequential damages.",
                "Our total liability will not exceed the amount you paid in the last 30 days."
            ],
            highlight: true
        },
        {
            num: 19,
            title: "INDEMNIFICATION",
            content: "You agree to indemnify and hold promanager harmless from claims, damages, or losses arising from:",
            items: [
                "Your misuse of the Service",
                "Violation of laws",
                "Incorrect payroll calculations due to wrong data entry",
                "Employee disputes",
                "Uploading unauthorized or illegal data",
                "Breach of these Terms"
            ]
        },
        {
            num: 20,
            title: "FORCE MAJEURE",
            content: "We are not liable for delays or failures due to events beyond our control, including:",
            items: [
                "Natural disasters",
                "Government actions",
                "Internet outages",
                "Third-party failures",
                "Server-side downtime not caused by negligence",
                "War, strikes, riots, or emergencies"
            ]
        },
        {
            num: 21,
            title: "CHANGES TO TERMS",
            items: [
                "We may update these Terms at any time.",
                "Continuing to use the Service after changes means you accept the revised Terms."
            ]
        },
        {
            num: 22,
            title: "GOVERNING LAW",
            items: [
                "These Terms are governed by the laws of India.",
                "Any disputes shall be resolved exclusively in the courts of Gujarat, India."
            ]
        }
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
                        <Scale className="w-10 h-10 text-[var(--color-text-white)]" />
                    </motion.div>

                    <h1 className="text-4xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-4">
                        📜 <span className="bg-[var(--color-primary-darker)] bg-clip-text text-transparent">Terms of Service</span>
                    </h1>

                    <p className="text-lg text-[var(--color-text-secondary)] mb-2">
                        Effective Date: December 2025
                    </p>
                    <p className="text-base text-[var(--color-text-secondary)]">
                        Last Updated: December 2025
                    </p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-6 space-y-2"
                    >
                        <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                            Product: promanager – An Ultimate Payroll Software
                        </p>
                    </motion.div>
                </motion.div>

                {/* Main Sections */}
                {sections.map((section, index) => {
                    const IconComponent = section.icon;
                    return (
                        <motion.div
                            key={section.num}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            className="mb-8"
                        >
                            <div className={`bg-[var(--color-bg-card)] border ${section.highlight ? 'border-[var(--color-primary-darker)] border-2' : 'border-[var(--color-border-primary)]'} rounded-2xl p-8 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow`}>
                                <div className="flex items-start gap-4 mb-6">
                                    <div className={`flex-shrink-0 w-12 h-12 ${section.highlight ? 'bg-[var(--color-primary-darker)]' : 'bg-[var(--color-primary-lightest)]'} rounded-lg flex items-center justify-center`}>
                                        <IconComponent className={`w-6 h-6 ${section.highlight ? 'text-[var(--color-text-white)]' : 'text-[var(--color-primary-darker)]'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                                            {section.num}. {section.title}
                                        </h2>
                                    </div>
                                </div>

                                <div className="ml-16 space-y-4">
                                    {section.content && (
                                        <p className="text-[var(--color-text-secondary)] leading-relaxed">{section.content}</p>
                                    )}

                                    {section.definitions && (
                                        <div className="space-y-3">
                                            {section.definitions.map((def, defIndex) => (
                                                <div key={defIndex} className="flex items-start gap-3">
                                                    <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                    <div>
                                                        <span className="font-semibold text-[var(--color-text-primary)]">"{def.term}"</span>
                                                        <span className="text-[var(--color-text-secondary)] ml-2">– {def.desc}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.items && (
                                        <ul className="space-y-2">
                                            {section.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start gap-3">
                                                    <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                    <span className="text-[var(--color-text-secondary)]">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {section.footer && (
                                        <p className={`text-[var(--color-text-secondary)] mt-4 ${section.highlight ? 'font-semibold' : ''}`}>
                                            {section.footer}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Additional Sections */}
                {additionalSections.map((section, index) => (
                    <motion.div
                        key={section.num}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <div className={`bg-[var(--color-bg-card)] border ${section.highlight ? 'border-[var(--color-primary-darker)] border-2' : 'border-[var(--color-border-primary)]'} rounded-2xl p-8 shadow-lg backdrop-blur-sm`}>
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
                                {section.num}. {section.title}
                            </h2>

                            <div className="space-y-4">
                                {section.content && (
                                    <p className="text-[var(--color-text-secondary)]">{section.content}</p>
                                )}

                                {section.items && (
                                    <ul className="space-y-2">
                                        {section.items.map((item, itemIndex) => (
                                            <li key={itemIndex} className="flex items-start gap-3">
                                                <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                <span className="text-[var(--color-text-secondary)]">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {section.additional && (
                                    <div className="mt-4 pl-4 border-l-2 border-[var(--color-primary-lighter)]">
                                        <p className="font-semibold text-[var(--color-text-primary)] mb-2">
                                            {section.additional.subtitle}
                                        </p>
                                        <ul className="space-y-2">
                                            {section.additional.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start gap-3">
                                                    <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                    <span className="text-[var(--color-text-secondary)]">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {section.footer && (
                                    <p className="text-[var(--color-text-secondary)] mt-4">{section.footer}</p>
                                )}
                            </div>
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
                        <div className="flex items-start gap-4 mb-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-3">
                                    23. CONTACT
                                </h2>
                                <p className="mb-4 opacity-90">
                                    For questions or concerns regarding these Terms:
                                </p>
                            </div>
                        </div>

                        <div className="ml-16 space-y-3">
                    
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                <span>Email: <a href="mailto:harshitkapadia563@gmail.com" className="underline hover:opacity-80 transition-opacity">harshitkapadia563@gmail.com</a></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-5 h-5" />
                                <span>Phone: <a href="tel:9909929293" className="underline hover:opacity-80 transition-opacity">9909929293</a></span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Important Notice */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-[var(--color-bg-secondary-30)] border border-[var(--color-border-primary)] rounded-xl p-8 text-center backdrop-blur-sm"
                >
                    <AlertTriangle className="w-8 h-8 text-[var(--color-primary-darker)] mx-auto mb-3" />
                    <p className="text-[var(--color-text-primary)] font-semibold mb-2">
                        Important Notice
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        By continuing to use promanager, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                    </p>
                </motion.div>

                {/* Footer Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mt-12 text-sm text-[var(--color-text-secondary)]"
                >
                    <p>Effective Date: December 2025</p>
                    <p className="mt-2">© 2025 promanager. All rights reserved.</p>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsOfService;