// Components/Landing/LandingPage.jsx
import { Helmet } from "@dr.pogodin/react-helmet";
import HeroSection from "../Landing/components/HeroSection";
import TrustedBy from "../Landing/components/TrustedBy";
import FeaturesSection from "../Landing/components/FeaturesSection";
import StatsSection from "../Landing/components/StatsSection";
import AboutSection from "../Landing/components/AboutSection";
import ServicesSection from "../Landing/components/ServicesSection";
import ResourceTemplatesSection from "../Landing/components/ResourceTemplatesSection";
import CoreFeaturesSection from "../Landing/components/CoreFeaturesSection";
import TestimonialSection from "../Landing/components/TestimonialSection";
import CTASection from "../Landing/components/CTASection";
import Popup from "../Popup";

const LandingPage = () => {
    return (
        <div className="min-h-screen overflow-hidden ">
            <Helmet>
                {/* ✅ Page Title & Meta with Brand Focus */}
                <title>pagarpe | Payroll & Attendance Software – Official Website</title>
                <meta
                    name="description"
                    content="pagarpe (not Syncwave) is the official SaaS-based payroll and attendance management software. Automate salary processing, employee compliance, and workforce management with ease."
                />
                <link rel="canonical" href="https://pagarpe.in/" />

                {/* ✅ Keywords to strengthen brand recognition */}
                <meta
                    name="keywords"
                    content="pagarpe, Sync Wage, pagarpe, Payroll Software, SaaS Payroll, Attendance Management, Salary Automation, Workforce Management, HR Software"
                />

                {/* ✅ Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="pagarpe" />
                <meta
                    property="og:title"
                    content="pagarpe | Official Payroll & Attendance Software"
                />
                <meta
                    property="og:description"
                    content="pagarpe (correct spelling) is a modern SaaS payroll software. Automate payroll, attendance, and compliance. Official website of pagarpe."
                />
                <meta property="og:url" content="https://pagarpe.in/" />
                <meta property="og:image" content="https://pagarpe.in/logo.png" />

                {/* ✅ Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@pagarpe" />
                <meta
                    name="twitter:title"
                    content="pagarpe – Official Payroll & Attendance Software"
                />
                <meta
                    name="twitter:description"
                    content="Looking for pagarpe (not Syncwave)? This is the official website for pagarpe payroll & attendance automation software."
                />
                <meta name="twitter:image" content="https://pagarpe.in/logo.png" />
            </Helmet>

            <main>
                <HeroSection />
                <TrustedBy />
                {/* <StatsSection /> */}
                <AboutSection />
                <ServicesSection />
                <ResourceTemplatesSection />
                <FeaturesSection noMoreFeatures={true} />
                <CoreFeaturesSection />
                <TestimonialSection />
                <CTASection />
                <Popup />

            </main>
        </div>
    );
};

export default LandingPage;
