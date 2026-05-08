function TermsAndConditionsPage() {
    // Reusable dot component for list items (matching PrivacyPolicyPage style)
    const Dot = () => (
        <span className="inline-block w-2 h-2 mt-2 rounded-full bg-gray-600 flex-shrink-0"></span>
    );

    return (
        <div className="bg-gray-50">
            {/* Hero Section - matching PrivacyPolicyPage structure, using Terms content */}
            <section className="relative overflow-hidden bg-[#6c4cf1] text-white py-20">

                {/* Full Background Dots */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="w-full h-full bg-[radial-gradient(circle,_white_1.5px,_transparent_1.5px)] bg-[size:24px_24px]" />
                </div>

                <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="flex flex-col items-center text-center max-w-3xl mx-auto">

                        {/* Heading */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Terms & Condition
                        </h1>

                        {/* Description */}
                        <p className="text-lg md:text-xl text-white/80">
                            Please read our terms and conditions carefully before using our platform.
                            These terms govern your access and usage of our services.
                        </p>

                    </div>

                </div>

                {/* Bottom Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#6c4cf1] to-transparent"></div>
            </section>

            {/* Content Section - matching PrivacyPolicyPage layout, with Terms content */}
            <section className="bg-white py-12 md:py-16">
                <div className="container mx-auto  px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl p-8 md:p-10 lg:p-12 space-y-8">
                        {/* Effective Date - styled as a paragraph but with emphasis */}
                        <div className="text-gray-600 text-lg">
                            <p>
                                <strong>Effective Date:</strong> 1st August 2025
                            </p>
                        </div>

                        {/* Welcome paragraph */}
                        <p className="text-gray-600">
                            Welcome to Promanager (“Company”, “We”, “Our”, or “Us”). By accessing or using our Attendance & Payroll Software, Mobile App, or Website (collectively, “Services”), you agree to these Terms & Conditions. Please read them carefully.
                        </p>

                        {/* Section 1: Acceptance of Terms */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-gray-600">
                                By using Promanager, you agree to comply with these Terms & Conditions, our Privacy Policy, and any applicable laws. If you do not agree, please discontinue using our services.
                            </p>
                        </div>

                        {/* Section 2: Eligibility */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                2. Eligibility
                            </h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You must be at least 18 years old to use Promanager.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You must provide accurate business and employee details during registration.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You are responsible for maintaining the confidentiality of your account credentials.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 3: Services Provided */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                3. Services Provided
                            </h2>
                            <p className="text-gray-600">Promanager offers:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Attendance management (biometric, RFID, mobile app, or web-based).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Payroll processing, salary slips, and statutory compliance (PF, ESI, TDS, etc.).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Employee management (leave, shift, overtime, deductions, etc.).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Reports and analytics for HR and business decision-making.</span>
                                </li>
                            </ul>
                            <p className="text-gray-600 mt-2">
                                We may update or add new features from time to time to improve our services.
                            </p>
                        </div>

                        {/* Section 4: User Responsibilities */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                4. User Responsibilities
                            </h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You will use the software only for lawful business purposes.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You are responsible for the accuracy of employee and business data entered.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You will not misuse, copy, resell, or tamper with the system.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You will maintain proper internet connectivity and devices for smooth usage.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 5: Subscription, Payment & Refund */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                5. Subscription, Payment & Refund
                            </h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Promanager is offered on a subscription basis (yearly).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Fees are based on the plan chosen and the number of employees.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Payments once made are non-refundable.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">The company reserves the right to change pricing plans with prior notice.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 6: Data & Privacy */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                6. Data & Privacy
                            </h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Your data remains your property.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">We collect, process, and secure data as per our Privacy Policy.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You grant Promanager permission to use data solely for providing services, compliance, and technical improvements.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 7: Third-Party Integrations */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                7. Third-Party Integrations
                            </h2>
                            <p className="text-gray-600">
                                Promanager may integrate with third-party tools (biometric devices, payment gateways, accounting software, etc.). We are not responsible for their performance or data handling.
                            </p>
                        </div>

                        {/* Section 8: Limitation of Liability */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                8. Limitation of Liability
                            </h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Promanager strives to provide accurate and uninterrupted service but does not guarantee 100% uptime.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">We are not responsible for losses arising from incorrect data input, misuse, or third-party device failures.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Our liability is limited to the subscription amount paid by you.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 9: Termination */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                9. Termination
                            </h2>
                            <p className="text-gray-600">We reserve the right to suspend or terminate your account if:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You violate these Terms & Conditions.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">You misuse or attempt to hack/manipulate the system.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Dot />
                                    <span className="text-gray-600">Subscription fees remain unpaid beyond the due date.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 10: Intellectual Property */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                10. Intellectual Property
                            </h2>
                            <p className="text-gray-600">
                                All rights, logos, software designs, and trademarks of Promanager belong to us. You may not copy, modify, distribute, or resell our platform without written permission.
                            </p>
                        </div>

                        {/* Section 11: Support & Communication */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                11. Support & Communication
                            </h2>
                            <p className="text-gray-600">
                                For support, you may contact us via:
                            </p>
                            <div className="bg-gray-50 p-8 rounded-lg space-y-3">
                                <p className="text-gray-700 flex items-center gap-3">
                                    <span className="text-xl" role="img" aria-label="phone">📞</span>
                                    <span><strong>Support Number:</strong> +91-84600-49161</span>
                                </p>
                                <p className="text-gray-700 flex items-center gap-3">
                                    <span className="text-xl" role="img" aria-label="email">📧</span>
                                    <span><strong>Email:</strong> support@promanager.in</span>
                                </p>
                                <p className="text-gray-600 mt-2">
                                    Our support team will assist you with onboarding, troubleshooting, and technical queries.
                                </p>
                            </div>
                        </div>

                        {/* Section 12: Governing Law */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                12. Governing Law
                            </h2>
                            <p className="text-gray-600">
                                These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the courts in Surat, Gujarat.
                            </p>
                        </div>

                        {/* Section 13: Changes to Terms */}
                        <div className="space-y-4">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                                13. Changes to Terms
                            </h2>
                            <p className="text-gray-600">
                                We may update these Terms & Conditions at any time. Updated terms will be posted on our website/app, and continued usage will mean acceptance of the revised terms.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Animation styles (copied from PrivacyPolicyPage to maintain consistency) */}
            <style >{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}

export default TermsAndConditionsPage;