import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Server, Key, Eye, Database, CloudCog, AlertTriangle, CheckCircle, RefreshCw, Users, Bell } from 'lucide-react';

const SecurityPolicy = () => {
    const sections = [
        {
            num: 1,
            title: "Purpose & Scope",
            icon: Shield,
            content: "This Security Policy applies to:",
            items: [
                "promanager Web Application",
                "promanager Mobile App (Android/iOS)",
                "Backend APIs, Database Systems, and VPS Infrastructure",
                "All internal administrative panels and support tools"
            ],
            footer: "This policy governs data protection, system security, network controls, and access management across all components of promanager."
        },
        {
            num: 2,
            title: "Infrastructure Security",
            icon: Server,
            subsections: [
                {
                    subtitle: "2.1 Hosting Environment",
                    content: "promanager operates on a secure cloud architecture consisting of:",
                    items: [
                        "VPS Server",
                        "SQL Database",
                        "MongoDB Atlas",
                        "Render/AWS-like cloud hosting (India region only)"
                    ],
                    footer: "No customer data is stored locally on employee devices beyond app sandboxing."
                },
                {
                    subtitle: "2.2 Data Location",
                    items: [
                        "All production data is stored exclusively in India-region datacenters."
                    ]
                }
            ]
        },
        {
            num: 3,
            title: "Data Protection & Encryption",
            icon: Lock,
            subsections: [
                {
                    subtitle: "3.1 Encryption In Transit",
                    content: "All data transmitted between client devices and promanager servers is encrypted using:",
                    items: ["TLS 1.2 / TLS 1.3"]
                },
                {
                    subtitle: "3.2 Encryption At Rest",
                    content: "Sensitive data at rest is protected using:",
                    items: ["Cloud-managed AES-256 encryption"]
                },
                {
                    subtitle: "3.3 Sensitive Data Handling",
                    content: "promanager stores only the data required for HRMS and payroll workflows, including:",
                    items: [
                        "Employee details",
                        "Attendance logs",
                        "Salary, tax, and bank information",
                        "Biometric attendance imports (optional)"
                    ],
                    footer: "No unnecessary data is collected or retained."
                }
            ]
        },
        {
            num: 4,
            title: "Access Control & Internal Security",
            icon: Key,
            subsections: [
                {
                    subtitle: "4.1 Restricted Production Access",
                    items: [
                        "promanager enforces strict separation between development and production.",
                        "Developers do not have direct access to the production database.",
                        "Access to SQL/MongoDB production systems is restricted to a small group of senior backend administrators.",
                        "Access is only permitted through a controlled, role-based gateway."
                    ]
                },
                {
                    subtitle: "4.2 Internal Admin Console Security",
                    content: "All production access is performed via a secure internal console with:",
                    items: [
                        "Role-based permission levels",
                        "Mandatory authentication",
                        "Full audit logging",
                        "Access timeouts",
                        "Masking of sensitive employee information",
                        "Rate-limited operations"
                    ]
                },
                {
                    subtitle: "4.3 Support Access Controls",
                    content: "Support staff cannot access customer accounts unless:",
                    items: [
                        "The customer explicitly grants temporary access",
                        "Access is time-bound and auto-expiring",
                        "All actions are logged"
                    ]
                }
            ]
        },
        {
            num: 5,
            title: "Network & Application Security",
            icon: Shield,
            subsections: [
                {
                    subtitle: "5.1 Firewall & Network Protections",
                    content: "promanager infrastructure includes:",
                    items: [
                        "Web Application Firewall",
                        "Strict firewall rules",
                        "DDoS mitigation",
                        "IP throttling",
                        "Rate limiting",
                        "Private internal networks"
                    ]
                },
                {
                    subtitle: "5.2 Secure Software Development",
                    content: "promanager follows:",
                    items: [
                        "OWASP security guidelines",
                        "Secure coding practices",
                        "Mandatory code reviews",
                        "Internal vulnerability scanning during development"
                    ]
                },
                {
                    subtitle: "5.3 Third-Party Services",
                    content: "promanager uses secure, industry-standard third-party services including:",
                    items: [
                        "MSG91 (SMS delivery)",
                        "Razorpay (payments)",
                        "AWS SES (transactional email)",
                        "Google Maps (location validation)",
                        "Firebase Cloud Messaging (push notifications)"
                    ],
                    footer: "All third-party providers follow strong security compliance standards."
                }
            ]
        },
        {
            num: 6,
            title: "Monitoring, Backups & Availability",
            icon: Eye,
            subsections: [
                {
                    subtitle: "6.1 Uptime & Reliability",
                    items: ["promanager maintains a 99.5% Uptime SLA."],
                    highlight: true
                },
                {
                    subtitle: "6.2 Backups",
                    content: "Daily backups are maintained with:",
                    items: [
                        "30-day backup retention",
                        "Multiple restore points"
                    ]
                },
                {
                    subtitle: "6.3 Logging & Monitoring",
                    content: "Systems are monitored 24×7 for:",
                    items: [
                        "Unauthorized access",
                        "Performance degradation",
                        "System anomalies",
                        "Security-related events"
                    ]
                }
            ]
        },
        {
            num: 7,
            title: "Incident Response & Reporting",
            icon: AlertTriangle,
            content: "promanager maintains an internal Incident Response Plan that includes:",
            items: [
                "Immediate containment of affected systems",
                "Root cause assessment",
                "Security patching and remediation",
                "Customer notification where legally required",
                "Preventive measures to avoid recurrence"
            ],
            footer: "Incidents are handled according to Indian IT Act and GDPR principles (where applicable).",
            highlight: true
        },
        {
            num: 8,
            title: "Data Retention & Deletion",
            icon: Database,
            items: [
                "Customer data is retained only for the duration of the subscription.",
                "Upon termination, customer data is securely deleted from active systems.",
                "Backups containing customer data automatically expire after 30 days.",
                "promanager does not retain customer data beyond required operational timelines."
            ]
        },
        {
            num: 9,
            title: "Customer Responsibilities",
            icon: Users,
            content: "To maintain security, customers must:",
            items: [
                "Use strong passwords",
                "Protect account credentials",
                "Authorize only trusted personnel",
                "Follow their internal HR and compliance standards"
            ]
        },
        {
            num: 10,
            title: "Updates to This Security Policy",
            icon: RefreshCw,
            content: "promanager may update this Security Policy to reflect:",
            items: [
                "Legal requirements",
                "Infrastructure changes",
                "New security practices"
            ],
            footer: "All changes will be posted on our website with an updated \"Last Updated\" date."
        }
    ];

    const securityFeatures = [
        {
            icon: Lock,
            title: "End-to-End Encryption",
            description: "TLS 1.3 & AES-256 protection"
        },
        {
            icon: Key,
            title: "Access Control",
            description: "Role-based permissions & audit logs"
        },
        {
            icon: Shield,
            title: "DDoS Protection",
            description: "Enterprise-grade firewall"
        },
        {
            icon: Database,
            title: "Secure Backups",
            description: "Daily backups with 30-day retention"
        },
        {
            icon: Eye,
            title: "24/7 Monitoring",
            description: "Real-time threat detection"
        },
        {
            icon: CheckCircle,
            title: "99.5% Uptime SLA",
            description: "Reliable & always available"
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
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, type: "spring", stiffness: 150 }}
                        className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[var(--color-primary-darker)] to-[var(--color-primary-darkest)] rounded-full mb-6 shadow-2xl relative"
                    >
                        <Shield className="w-12 h-12 text-[var(--color-text-white)]" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-4 border-dashed border-[var(--color-primary-lighter)] rounded-full"
                        />
                    </motion.div>

                    <h1 className="text-4xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-4">
                        🛡️ <span className="bg-gradient-to-r from-[var(--color-primary-darker)] to-[var(--color-primary-darkest)] bg-clip-text text-transparent">Security Policy</span>
                    </h1>

                    <p className="text-lg text-[var(--color-text-secondary)] mb-6">
                        Last Updated: December 2025
                    </p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-base text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed"
                    >
                        promanager is committed to ensuring the confidentiality, integrity, and availability of employee and payroll information entrusted to our platform. This Security Policy describes how promanager protects customer data through administrative, technical, and physical security controls.
                    </motion.p>
                </motion.div>

                {/* Security Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
                >
                    {securityFeatures.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl p-8 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-primary-lightest)] rounded-lg flex items-center justify-center">
                                        <IconComponent className="w-6 h-6 text-[var(--color-primary-darker)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
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
                            <div className={`bg-[var(--color-bg-card)] border ${section.highlight ? 'border-[var(--color-primary-darker)] border-2 shadow-2xl' : 'border-[var(--color-border-primary)]'} rounded-2xl p-8 shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow`}>
                                <div className="flex items-start gap-4 mb-6">
                                    <div className={`flex-shrink-0 w-12 h-12 ${section.highlight ? 'bg-gradient-to-br from-[var(--color-primary-darker)] to-[var(--color-primary-darkest)]' : 'bg-[var(--color-primary-lightest)]'} rounded-lg flex items-center justify-center shadow-md`}>
                                        <IconComponent className={`w-6 h-6 ${section.highlight ? 'text-[var(--color-text-white)]' : 'text-[var(--color-primary-darker)]'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                                            {section.num}. {section.title}
                                        </h2>
                                    </div>
                                </div>

                                {section.subsections ? (
                                    <div className="space-y-6 ml-16">
                                        {section.subsections.map((subsection, subIndex) => (
                                            <div key={subIndex} className={subsection.highlight ? 'bg-[var(--color-primary-lightest)] bg-opacity-30 rounded-lg p-4' : ''}>
                                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                                                    {subsection.subtitle}
                                                </h3>
                                                {subsection.content && (
                                                    <p className="text-[var(--color-text-secondary)] mb-3">{subsection.content}</p>
                                                )}
                                                <ul className="space-y-2">
                                                    {subsection.items.map((item, itemIndex) => (
                                                        <li key={itemIndex} className="flex items-start gap-3">
                                                            <span className="text-[var(--color-primary-darker)] mt-1.5">•</span>
                                                            <span className="text-[var(--color-text-secondary)]">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {subsection.footer && (
                                                    <p className="text-[var(--color-text-secondary)] mt-3 font-medium">{subsection.footer}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="ml-16 space-y-4">
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
                                        {section.footer && (
                                            <p className={`text-[var(--color-text-secondary)] mt-4 ${section.highlight ? 'font-semibold' : ''}`}>
                                                {section.footer}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Security Commitment Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-[var(--color-primary-darker)] to-[var(--color-primary-darkest)] border border-[var(--color-primary-darker)] rounded-2xl p-8 shadow-2xl text-[var(--color-text-white)] mb-8"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-3">Our Security Commitment</h3>
                            <p className="text-white text-opacity-90 leading-relaxed">
                                At promanager, security is not an afterthought—it's built into every layer of our platform. We continuously monitor, update, and improve our security measures to protect your sensitive payroll and employee data. Your trust is our top priority, and we work tirelessly to maintain it through transparent security practices and proactive threat management.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Report Security Issue */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-2xl p-8 shadow-lg backdrop-blur-sm"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <Bell className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                                Report a Security Issue
                            </h3>
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                If you discover a security vulnerability or have concerns about our security practices, please contact us immediately:
                            </p>
                            <div className="space-y-2">
                                <p className="text-[var(--color-text-primary)] font-medium">
                                    Email: <a href="mailto:harshitkapadia563@gmail.com" className="text-[var(--color-primary-darker)] hover:underline">harshitkapadia563@gmail.com</a>
                                </p>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    We take all security reports seriously and will respond within 48 hours.
                                </p>
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
                    <p>Last Updated: December 2025</p>
                    <p className="mt-2">© 2025 promanager. All rights reserved.</p>
                    <p className="mt-4 max-w-2xl mx-auto">
                        This Security Policy is subject to change. Continued use of promanager constitutes acceptance of any updates.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default SecurityPolicy;