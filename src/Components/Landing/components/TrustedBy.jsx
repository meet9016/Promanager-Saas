import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Company logos array - Replace with actual logo URLs
const COMPANY_LOGOS = [
  { name: "Google", logo: "https://insuraa.in/assets/website/imgs/11.png" },
  { name: "Microsoft", logo: "https://insuraa.in/assets/website/imgs/2.png" },
  { name: "Amazon", logo: "https://insuraa.in/assets/website/imgs/3.png" },
  { name: "Apple", logo: "https://insuraa.in/assets/website/imgs/4.png" },
  { name: "Meta", logo: "https://insuraa.in/assets/website/imgs/5.png" },
  { name: "Netflix", logo: "https://insuraa.in/assets/website/imgs/6.png" },
  { name: "Tesla", logo: "https://insuraa.in/assets/website/imgs/7.png" },
  { name: "Spotify", logo: "https://insuraa.in/assets/website/imgs/8.png" },
  { name: "Adobe", logo: "https://insuraa.in/assets/website/imgs/9.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/10.png" },
  { name: "Intel", logo: "hhttps://insuraa.in/assets/website/imgs/19.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/12.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/14.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/16.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/17.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/18.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/19.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/20.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/21.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/22.png" },
  { name: "Intel", logo: "https://insuraa.in/assets/website/imgs/24.png" },
];

const TrustedBy = () => {
  return (
    <section className="py-12 lg:py-6 bg-white ">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Side - Text (20% width on large screens) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/5 text-center lg:text-left flex-shrink-0"
          >
            <div className="space-y-2">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-[#6C4CF1] to-[#4B2EDB] bg-clip-text text-transparent"
              >
                100+
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-base lg:text-lg font-semibold text-[var(--color-text-primary)]"
              >
                Businesses Trust Us
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-sm text-[var(--color-text-secondary)]"
              >
                From small startups to large enterprises
              </motion.p>
            </div>
          </motion.div>

          {/* Right Side - Scrolling Logos (80% width on large screens) */}
          <div className="w-full lg:w-4/5 overflow-hidden relative">
            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Scrolling Container */}
            <div className="flex">
              {/* First Set of Logos */}
              <motion.div
                className="flex gap-8 lg:gap-12 items-center"
                animate={{
                  x: [0, -1920],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 30,
                    ease: "linear",
                  },
                }}
              >
                {COMPANY_LOGOS.map((company, index) => (
                  <div
                    key={`logo-1-${index}`}
                    className="flex-shrink-0 w-40 h-32 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-4 border border-[var(--color-border-primary)]"
                  >
                    <img
                      src={company.logo}
                      loading="lazy"
                      alt={company.name}
                      className="max-w-full max-h-full object-contain  transition-all duration-300 "
                    />
                  </div>
                ))}
              </motion.div>

              {/* Duplicate Set for Seamless Loop */}
              <motion.div
                className="flex gap-8 lg:gap-12 items-center ml-8 lg:ml-12"
                animate={{
                  x: [0, -1920],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 30,
                    ease: "linear",
                  },
                }}
              >
                {COMPANY_LOGOS.map((company, index) => (
                  <div
                    key={`logo-2-${index}`}
                    className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-4 border border-[var(--color-border-primary)]"
                  >
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="max-w-full max-h-full object-contain  transition-all duration-300"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
