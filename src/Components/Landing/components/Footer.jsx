import React from "react";
import { Instagram, Facebook, Linkedin, Youtube,Mail, Phone, MapPin } from "lucide-react";
import Logo from "../../../assets/transparent-logo.png";
import { Link } from "react-router-dom";

const Footer = () => {
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

  const bankDetails = [
    { label: "Bank Name", value: "INDUSIND BANK LTD" },
    { label: "A/c Name", value: "SHOPNO" },
    { label: "Account No", value: "258866779008" },
    { label: "Type", value: "CURRENT ACCOUNT" },
    { label: "IFSC", value: "INDB0001409" }
  ];

  return (
    <footer className="bg-[#0b0b0b] text-gray-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Company Info & Address */}
          <div className="space-y-6 text-left">
            <Link to="/" className="inline-block">
              <img
                src={Logo}
                alt="ProManager Logo"
                className="h-12 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </Link>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-400 leading-relaxed">
                  Shreenathji Bungalow, 6, Peddar Rd, near Raghuvir Shoppers, 
                  Mota Varachha, Surat, Gujarat 394101
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-gray-400 flex-shrink-0" />
                <a href="mailto:contact@promanager.in" className="text-sm text-gray-400 hover:text-white transition-colors break-all">
                  contact@promanager.in
                </a>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone size={18} className="text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex flex-col space-y-1">
                
                  <a href="tel:+919274889008" className="text-sm text-gray-400 hover:text-white transition-colors">
                    +91 92748 89008
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left">
            <h3 className="text-white font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
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

          {/* Resources & GST */}
          <div className="text-left">
            <h3 className="text-white font-semibold text-lg mb-6">Resources</h3>
            <ul className="space-y-3 mb-6">
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
            
            <div className="border-t border-gray-800 pt-6">
              <h4 className="text-white font-medium mb-2">GST Number:</h4>
              <p className="text-sm text-gray-400">24BAGPV9685P2ZG</p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="text-left">
            <h3 className="text-white font-semibold text-lg mb-6">Bank Details</h3>
            <ul className="space-y-3">
              {bankDetails.map((detail, index) => (
                <li key={index} className="text-sm">
                  <span className="text-gray-300">{detail.label}:</span>{" "}
                  <span className="text-gray-400 break-words">{detail.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-10"></div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* App Store Buttons - Side by side on all screens */}
          <div className="flex flex-row items-center justify-center lg:justify-start gap-3 w-full lg:w-auto">
            <a 
              href="https://play.google.com/store/apps/details?id=com.shopno.promanager" 
              className="transition-transform hover:scale-105 duration-200 flex-1 sm:flex-none max-w-[140px] sm:max-w-none"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Download on Google Play"
                className="h-10 sm:h-12 w-full object-contain"
              />
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=com.shopno.promanager" 
              className="transition-transform hover:scale-105 duration-200 flex-1 sm:flex-none max-w-[140px] sm:max-w-none"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Download on App Store"
                className="h-10 sm:h-12 w-full object-contain"
              />
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              >
                <social.icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-10 pt-6">
          <p className="text-center text-sm text-gray-500">
            Copyright © {currentYear} <span className="text-gray-400">ProManager</span>. <a href="https://shopnoecommerce.com/" target="_blank">All rights reserved. Develop by Shopno Ecommerce PVT. LTD. </a> 
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;