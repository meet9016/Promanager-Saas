"use client";
import React from "react";
import { motion } from "framer-motion";

// TestimonialsColumn component
const TestimonialsColumn = (props) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={i}>
                  <div>{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      loading="lazy"
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5">{name}</div>
                      <div className="leading-5 opacity-60 tracking-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

// Testimonials data
const testimonials = [
  {
    text: "This ERP revolutionized our operations, streamlining finance and inventory. The cloud-based platform keeps us productive, even remotely.",
    image: "https://sbconsultants.in/wp-content/uploads/2024/04/swapniljain849.jpg",
    name: "Aarav Mehta",
    role: "Operations Manager",
  },
  {
    text: "Implementing this ERP was smooth and quick. The customizable, user-friendly interface made team training effortless.",
    image: "https://www.aroraconsultancy.in/Img/t1.jpg",
    name: "Priya Sharma",
    role: "IT Manager",
  },
  {
    text: "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction.",
    image: "https://www.amity.edu/gurugram/microbackoffice/Uploads/TestimonialImage/98testi_RajivBasavaalumni.jpg",
    name: "Rohan Patel",
    role: "Customer Support Lead",
  },
  {
    text: "This ERP's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface.",
    image: "https://img.magnific.com/premium-photo/young-indian-man-smiling-working-computer-busy-office_641010-62677.jpg?semt=ais_test_b&w=740&q=80",
    name: "Yash Trivedi",
    role: "CEO",
  },
  {
    text: "Its robust features and quick support have transformed our workflow, making us significantly more efficient.",
    image: "https://www.cecyours.org/testimonials/sneha-shah.webp",
    name: "Kavya Sharma",
    role: "Project Manager",
  },
  {
    text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.",
    image: "https://media.licdn.com/dms/image/sync/v2/D4D27AQHkKD_-RP_Olw/articleshare-shrink_800/B4DZ.J_ztmIYAY-/0/1784726634903?e=2147483647&v=beta&t=FmY4HxfoJJI7C9Ncpl7KcByCNr-Fvo0il0RBZr9mb9o",
    name: "Ananya Desai",
    role: "Business Analyst",
  },
  {
    text: "Our business functions improved with a user-friendly design and positive customer feedback.",
    image: "https://dolphinsecurity.in/wp-content/uploads/2023/04/Testimonial-Pic3.jpg",
    name: "Kunal Verma",
    role: "Marketing Director",
  },
  {
    text: "They delivered a solution that exceeded expectations, understanding our needs and enhancing our operations.",
    image: "https://a2zitsolutions.in/wp-content/uploads/2024/11/Piyush_Bhargava.jpg",
    name: "Vikram Joshi",
    role: "Sales Manager",
  },
  {
    text: "Using this ERP, our online presence and conversions significantly improved, boosting business performance.",
    image: "https://media.istockphoto.com/id/1135381120/photo/portrait-of-a-young-woman-outdoors-smiling.jpg?s=612x612&w=0&k=20&c=T5dukPD1r-o0BFqeqlIap7xzw07icucetwKaEC2Ms5M=",
    name: "Khushi Patel",
    role: "E-commerce Manager",
  },
];

// Split testimonials into columns
const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

// Main Testimonials component
const TestimonialSection = () => {
  return (
    <section className="bg-white pt-0 lg:py-20 relative">
      <div className="absolute z-10 hidden sm:block    right-0 w-[400px] h-[500px] rounded-full
    bg-[#6c4cf1]
    blur-[90px]
    opacity-20
  "/>
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          {/* Title with Curved Line */}
          <div className="relative mb-8">
            <h3 className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
              Testimonials
            </h3>

            {/* Curved Line SVG */}
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
              className="absolute top-10 left-1/2 -translate-x-1/2 w-44 h-4"
              viewBox="0 0 180 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M2 10C40 2, 80 2, 120 10C145 16, 165 10, 178 10"
                stroke="url(#gradient-testimonials)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient-testimonials" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6C4CF1" />
                  <stop offset="100%" stopColor="#4B2EDB" />
                </linearGradient>
              </defs>
            </motion.svg>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
            What Our{" "}
            <span className="bg-[var(--color-primary-dark)] bg-clip-text text-transparent">
              Users Say
            </span>
          </h2>
          <p className="text-center text-lg text-[var(--color-text-secondary)]">
            See what our customers have to say about us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;