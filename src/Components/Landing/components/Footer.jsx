import React from "react";
import { Instagram, Facebook, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import Logo from "../../../assets/transparent-logo.png";
import { Link } from "react-router-dom";
import { useSoftwareConfig } from "../../../context/SoftwareConfigContext";

const Footer = () => {
  const { config } = useSoftwareConfig();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/promanager.payroll.software/", label: "Instagram" },
    { icon: Facebook, href: "https://www.facebook.com/promanager.payroll.software/", label: "Facebook" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Youtube, href: "https://www.youtube.com/@promanagerpayrollsoftware", label: "Youtube" },
  ];

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Features", path: "/feature" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact" },
  ];

  const resourceLinks = [
    { name: "Privacy Policy", path: "/privacy-policy" },
    { name: "Terms & Conditions", path: "/terms" }
  ];

  const defaultBankDetails = [
    { label: "Bank Name", value: "INDUSIND BANK LTD" },
    { label: "A/c Name", value: "SHOPNO" },
    { label: "Account No", value: "258866779008" },
    { label: "Type", value: "CURRENT ACCOUNT" },
    { label: "IFSC", value: "INDB0001409" }
  ];

  let bankDetailsToDisplay = defaultBankDetails;

  if (config?.bankDetails) {
    let bd = config.bankDetails;
    if (typeof bd === 'string') {
      try { bd = JSON.parse(bd); } catch (e) { }
    }

    if (bd && typeof bd === 'object' && !Array.isArray(bd)) {
      // Convert API object format to array for rendering
      bankDetailsToDisplay = [
        { label: "Bank Name", value: bd.bank_name || "" },
        { label: "A/c Name", value: bd.account_name || "" },
        { label: "Account No", value: bd.account_no || "" },
        { label: "Type", value: bd.type || "" },
        { label: "IFSC", value: bd.ifsc || "" }
      ].filter(item => item.value !== "");
    } else if (Array.isArray(bd) && bd.length > 0) {
      bankDetailsToDisplay = bd;
    }
  }

  return (
    <>
      <footer className="bg-[#0b0b0b] text-gray-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

            {/* Col 1: Company Info & Address */}
            <div className="space-y-4 text-left">
              <Link to="/" className="inline-block mb-2">
                <img
                  src={Logo}
                  alt="ProManager Logo"
                  className="h-14 w-auto object-contain hover:opacity-90 transition-opacity"
                />
              </Link>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {config?.address || "Shreenathji Bungalow, 6, Peddar Rd, near Raghuvir Shoppers, Mota Varachha, Surat, Gujarat 394101"}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${config?.email}`} className="text-sm text-gray-400 hover:text-white transition-colors break-all">
                    {config?.email}
                  </a>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <a href={`tel:${config?.mobile_number}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {config?.mobile_number}
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="text-left">
              <h3 className="text-white font-semibold text-md mb-4">Quick Links</h3>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Resources & GST */}
            <div className="text-left">
              <h3 className="text-white font-semibold text-md mb-4">Resources</h3>
              <ul className="space-y-2.5 mb-5">
                {resourceLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-800/80 pt-4">
                <h4 className="text-white font-medium text-xs mb-1">GST Number:</h4>
                <p className="text-sm text-gray-400 font-mono">{config?.gstNumber || "24BAGPV9685P2ZG"}</p>
              </div>
            </div>

            {/* Col 4: Bank Details */}
            <div className="text-left">
              <h3 className="text-white font-semibold text-md mb-4">Bank Details</h3>
              <ul className="space-y-2">
                {bankDetailsToDisplay.map((detail, index) => (
                  <li key={index} className="text-sm">
                    <span className="text-gray-300 font-medium">{detail.label}:</span>{" "}
                    <span className="text-gray-400 break-words">{detail.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Thin Horizontal Line Divider */}
          <div className="border-t border-gray-800/80 my-8"></div>

          {/* Bottom Row Inside Dark Section: App Buttons Left, Social Icons Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* App Store Buttons - Left */}
            <div className="flex items-center gap-3">
              <a
                href={config?.playstoreLink || "https://play.google.com/store/apps/details?id=com.shopno.promanager"}
                className="transition-transform hover:scale-105 duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Download on Google Play"
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </a>
              <a
                href={config?.appstoreLink || "https://play.google.com/store/apps/details?id=com.shopno.promanager"}
                className="transition-transform hover:scale-105 duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="Download on App Store"
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </a>
            </div>

            {/* Social Icons - Right */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-gray-300 hover:text-white hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-300"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Copyright Bar Outside Footer on White Background */}
      <div className="bg-white border-t border-gray-200 py-2.5 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-gray-800 font-medium tracking-wide">
            Copyright © {currentYear}{" "}
            <strong className="text-[var(--color-primary-dark)] font-bold">ProManager</strong>. All rights reserved.{" "}
            <span className="text-gray-400 mx-1">•</span>{" "}
            <a
              href="https://digitalkstechno.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary-dark)] font-bold hover:underline transition-colors"
            >
              A product of Digitalks Techno LLP.
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Footer;