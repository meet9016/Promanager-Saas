function PrivacyPolicyPage() {
  const Dot = () => (
    <span className="inline-block w-2 h-2 mt-2 rounded-full bg-gray-600 flex-shrink-0"></span>
  );
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#6c4cf1] text-white py-20">
  
  {/* Dots Background */}
  <div className="absolute inset-0 opacity-20 pointer-events-none">
    <div className="w-full h-full bg-[radial-gradient(circle,_white_1.5px,_transparent_1.5px)] bg-[size:24px_24px]" />
  </div>

  <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
      
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
        Privacy & Policy
      </h1>

      <p className="text-lg md:text-xl text-white/80">
        Your privacy matters to us. Learn how we collect, use, and protect your
        information while delivering secure and reliable services.
      </p>

    </div>
  </div>

  {/* Bottom Fade */}
  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#6c4cf1] to-transparent"></div>
</section>

      {/* Content Section */}
      <section className=" bg-white">
        <div className="container mx-auto ">
          <div className="rounded-2xl p-8 md:p-10 lg:p-12 space-y-8">
            {/* Information We Collect */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Information We Collect
              </h2>
              <p className="text-gray-600">
                When you use Promanager, we may collect the following types of
                information:
              </p>
              <ul className="space-y-3 list-none">
                <li className="flex items-start gap-3">
                  {Dot()}
                  <div>
                    <span className="font-semibold text-gray-700">
                      Business Information:
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      Company name, GST details, PAN, official email, and
                      contact numbers.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <div>
                    <span className="font-semibold text-gray-700">
                      Employee Information:
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      Name, phone number, email, attendance records, salary
                      details, and payroll data.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <div>
                    <span className="font-semibold text-gray-700">
                      Device & Usage Data:
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      IP address, browser type, device information, and log
                      data.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <div>
                    <span className="font-semibold text-gray-700">
                      Biometric/Attendance Data (if applicable):
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      Data captured from biometric devices or face recognition
                      for attendance purposes.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Location Data */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Location Data
              </h2>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-700">
                  Purpose:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-3">
                    {Dot()}
                    <span>
                      To verify your location during face-based attendance
                      punch-in and punch-out.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    {Dot()}
                    <span>
                      To ensure accurate attendance records for your employer or
                      organization.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    {Dot()}
                    <span>
                      To prevent fraudulent or incorrect check-ins from outside
                      designated areas.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    {Dot()}
                    <span>
                      To compare your current location with geofenced points
                      that your organization's administrator has set in the
                      system. These geofence points represent authorized office
                      locations or job sites where attendance is allowed.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-700">
                  Sharing:
                </h3>
                <p className="text-gray-600">
                  Location data is transmitted securely to our servers together
                  with your attendance event. We do not sell, rent, or share
                  your location data with third parties for advertising,
                  marketing, or profiling. It is used solely for
                  attendance-related functionality and is not stored longer than
                  necessary.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-700">
                  User Control:
                </h3>
                <p className="text-gray-600">
                  You can manage or revoke location access anytime from your
                  device's settings. Without location access, certain attendance
                  features (like location-based punch-in) may not work
                  correctly.
                </p>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                How We Use Your Information
              </h2>
              <p className="text-gray-600">We use your information to:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Provide and improve attendance & payroll services",
                  "Process salaries, deductions, and compliance reports",
                  "Ensure secure authentication and employee verification",
                  "Send important updates, notifications, and alerts",
                  "Respond to customer support queries",
                  "Comply with legal, tax, and regulatory requirements",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {Dot()}
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Data Security */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Data Security
              </h2>
              <p className="text-gray-600">
                We adopt strict security measures to safeguard your data,
                including:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    Encrypted data storage and secure transmission.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    Limited access to sensitive payroll & employee records.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    Regular monitoring to prevent unauthorized access, misuse,
                    or loss of data.
                  </span>
                </li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Data Sharing & Disclosure
              </h2>
              <p className="text-gray-600">
                We{" "}
                <span className="font-semibold text-gray-900">
                  do not sell, rent, or trade your data
                </span>{" "}
                to third parties.
                <br />
                We may share data only in the following cases:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">With your consent.</span>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    With trusted service providers who help us operate Promanager
                    (under strict confidentiality agreements).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-primary-600 flex-shrink-0"></span>
                  <span className="text-gray-600">
                    To comply with government regulations, tax laws, or legal
                    requests.
                  </span>
                </li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Data Retention
              </h2>
              <p className="text-gray-600">
                We retain your data as long as your account is active or as
                required by law. Once you discontinue services, we delete or
                anonymize your data securely, unless retention is legally
                required.
              </p>
            </div>

            {/* Your Rights */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Your Rights
              </h2>
              <p className="text-gray-600">
                As a Promanager user, you have the right to:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    Access your stored data.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    Request corrections to inaccurate or incomplete information.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    Request deletion of your data (subject to legal
                    requirements).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {Dot()}
                  <span className="text-gray-600">
                    Opt-out of marketing communications.
                  </span>
                </li>
              </ul>
            </div>

            {/* Third-Party Integrations */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Third-Party Integrations
              </h2>
              <p className="text-gray-600">
                If you use third-party integrations (e.g., biometric devices,
                UPI payments, or accounting software), their privacy policies
                will also apply. We encourage you to review their policies.
              </p>
            </div>

            {/* Cookies & Tracking */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Cookies & Tracking
              </h2>
              <p className="text-gray-600">
                Our website and app may use cookies and similar technologies to
                improve user experience, track usage, and deliver personalized
                content. You may disable cookies in your browser, but some
                features may not work properly.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Children's Privacy
              </h2>
              <p className="text-gray-600">
                Promanager services are not designed for individuals under the
                age of 18. We do not knowingly collect personal data from
                minors.
              </p>
            </div>

            {/* Changes to Privacy Policy */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Changes to Privacy Policy
              </h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. Any updates
                will be posted on our website/app with the revised effective
                date.
              </p>
            </div>

            {/* Account & Data Deletion */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 pb-3">
                Account & Data Deletion
              </h2>
              <p className="text-gray-600">
                Users have the right to request deletion of their Promanager
                account and all associated personal data at any time.
              </p>
              <p className="text-gray-600">
                To request account and data deletion, please email us from your
                registered email address at:
              </p>
              <div className="p-4 rounded-lg">
                <p className="font-semibold text-primary-700 flex items-center gap-2">
                  <span className="text-xl">📧</span>
                  contact@promanager.in
                </p>
              </div>
              <p className="text-gray-600">
                Please mention "Account Deletion Request" in the subject line.
              </p>
              <p className="text-gray-600">
                Once we receive the request, we will verify your identity and
                permanently delete your account and associated data from our
                systems within 7–15 working days, unless data retention is
                required by law.
              </p>
              <p className="text-gray-600">
                Some information (such as statutory payroll or tax records) may
                be retained only if legally required and will not be used for
                any other purpose.
              </p>
            </div>

            {/* Contact Us */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Contact Us
              </h2>
              <p className="text-gray-600">
                If you have any questions or concerns about this Privacy Policy,
                please contact us at:
              </p>
              <div className="bg-gray-50 p-8 rounded-lg space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Email:</span>{" "}
                  contact@promanager.in
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Phone:</span> +91 92747 89008
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Address:</span> Shreenathji
                  Bungalow, 6, Peddar Rd, near Raghuvir <br />
                  Shoppers, Mota Varachha, Surat, Gujarat 394101
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
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

export default PrivacyPolicyPage;
