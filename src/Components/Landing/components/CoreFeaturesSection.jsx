import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const BRAND = "#691BC6";
const BRAND_SOFT = "#F4ECFB";
const BRAND_DARK = "#4A0F8F";

const coreFeatures = [
  {
    title: "Automated Payroll Processing",
    description:
      "Eliminate manual errors with precise salary, deduction, and compliance calculations.",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
    benefits: ["Zero calculation errors", "Tax compliance ready", "Instant processing"],
  },
  {
    title: "Digital Payslip Distribution",
    description:
      "Deliver payslips instantly and securely to employees with one-click access.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
    benefits: ["Instant delivery", "Secure access", "Mobile friendly"],
  },
  {
    title: "Leave & Attendance Integration",
    description:
      "Seamlessly sync attendance and leave data for accurate payroll every cycle.",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80",
    benefits: ["Real-time sync", "Accurate tracking", "Auto calculations"],
  },
];

const CoreFeaturesSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#FAFAFB] py-12 lg:py-20">
      {/* Subtle decorative accents */}
      <div
        className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: BRAND }}
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-20 h-96 w-96 rounded-full opacity-10 blur-3xl"
        style={{ background: BRAND }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #691BC6 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              borderColor: `${BRAND}33`,
              background: BRAND_SOFT,
              color: BRAND,
            }}
          >
           
            Core Features
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-5xl"
          >
            Smart Payroll. Zero Hassle.
            <br />
            <span
              className="bg-clip-text text-transparent bg-[var(--color-primary-dark)]"
           
            >
              Maximum Accuracy.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg"
          >
            Explore the powerful features of ProManager designed to automate payroll,
            ensure compliance, and give employees a seamless experience.
          </motion.p>
        </div>

        {/* Features — single horizontal row */}
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {coreFeatures.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: index * 0.12 }}
              whileHover={{ y: -8 }}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_4px_24px_-8px_rgba(105,27,198,0.08)] transition-all duration-500 hover:border-transparent hover:shadow-[0_24px_60px_-15px_rgba(105,27,198,0.35)]"
            >
              {/* Top accent bar */}
              <div
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                style={{
                  background: `linear-gradient(90deg, ${BRAND}, ${BRAND_DARK})`,
                }}
              />

              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <motion.img
                  loading="lazy"
                  src={feature.image}
                  alt={feature.title}
                  className="h-full w-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.6 }}
                />
                <div
                  className="absolute inset-0"

                />
                {/* Number badge */}
                <div
                  className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-bold shadow-lg"
                  style={{ color: BRAND }}
                >
                  0{index + 1}
                </div>
                {/* Sparkle */}
                <div
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md"
                >
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-4 p-6 lg:p-7">
                <h3 className="text-xl font-bold leading-tight text-slate-900 lg:text-2xl">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>

                <ul className="mt-1 space-y-2">
                  {feature.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <span
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: BRAND_SOFT }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: BRAND }} />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* <div className="mt-auto pt-4">
                  <Link
                    to="/login"
                    className="group/btn inline-flex w-full items-center justify-between gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                      boxShadow: `0 8px 20px -8px ${BRAND}aa`,
                    }}
                  >
                    Learn More
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:rotate-45" />
                  </Link>
                </div> */}
              </div>
            </motion.article>
          ))}
        </div>

        {/* Bottom Stat */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <div
            className="inline-flex items-center gap-4 rounded-full border bg-white px-6 py-3 shadow-sm md:px-8 md:py-4"
            style={{ borderColor: `${BRAND}33` }}
          >
            <span
              className="bg-clip-text text-3xl font-black text-transparent md:text-4xl"
              style={{
                backgroundImage: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
              }}
            >
              0
            </span>
            <span className="text-sm font-medium text-slate-700 md:text-base">
              Payroll Errors in Last 12 Months
            </span>
          </div>
        </motion.div> */}
      </div>
    </section>
  );
};

export default CoreFeaturesSection;
