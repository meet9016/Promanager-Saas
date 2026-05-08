import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const payrollImg = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop";
const attendanceImg = "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop";
const employeeImg = "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop";
const analyticsImg = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop";
const secureImg = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop";


// Utility function to merge classnames
const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
};

// Accordion Item Component
const AccordionItem = ({ className, children, value, isOpen, onToggle, ...props }) => (
    <div className={cn("border-b border-gray-200", className)} {...props}>
        {React.Children.map(children, child =>
            React.cloneElement(child, { value, isOpen, onToggle })
        )}
    </div>
);

// Accordion Trigger Component
const AccordionTrigger = ({ className, children, value, isOpen, onToggle, onClick, ...props }) => (
    <div className="flex">
        <button
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline text-left",
                className,
            )}
            onClick={(e) => {
                onToggle(value);
                if (onClick) onClick(e);
            }}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            {children}
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    </div>
);

// Accordion Content Component - Fixed version
const AccordionContent = ({ className, children, isOpen, ...props }) => (
    <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
        data-state={isOpen ? "open" : "closed"}
        {...props}
    >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
);

// Main Accordion Component
const Accordion = ({ type = "single", className, defaultValue, children, ...props }) => {
    const [openItems, setOpenItems] = useState(() => {
        if (defaultValue) {
            return type === "single" ? [defaultValue] : Array.isArray(defaultValue) ? defaultValue : [defaultValue];
        }
        return [];
    });

    const handleToggle = (value) => {
        if (type === "single") {
            setOpenItems(prev => prev.includes(value) ? [] : [value]);
        } else {
            setOpenItems(prev =>
                prev.includes(value)
                    ? prev.filter(item => item !== value)
                    : [...prev, value]
            );
        }
    };

    return (
        <div className={cn("w-full", className)} {...props}>
            {React.Children.map(children, child =>
                React.cloneElement(child, {
                    isOpen: openItems.includes(child.props.value),
                    onToggle: handleToggle
                })
            )}
        </div>
    );
};

// promanager Features
const promanagerFeatures = [
    {
        id: 1,
        title: "Automated Payroll",
        image: payrollImg,
        description:
            "Save time with automated salary calculations, tax deductions, and compliance checks. promanager ensures error-free payroll every month.",
    },
    {
        id: 2,
        title: "Smart Attendance Tracking",
        image: attendanceImg,
        description:
            "Track employee attendance, shifts, and leave in real time. Our intuitive system reduces manual errors and boosts accuracy.",
    },
    {
        id: 3,
        title: "Employee Self-Service",
        image: employeeImg,
        description:
            "Empower employees with easy access to payslips, leave requests, and personal information — all in one secure portal.",
    },
    {
        id: 4,
        title: "Insights & Analytics",
        image: analyticsImg,
        description:
            "Get powerful insights into workforce performance, payroll costs, and productivity trends with customizable reports.",
    },
    {
        id: 5,
        title: "Scalable & Secure",
        image: secureImg,
        description:
            "promanager grows with your business. Our cloud-based system keeps your data safe with enterprise-grade security.",
    },
];

const AccordionDemo = ({ features = promanagerFeatures }) => {
    const [activeTabId, setActiveTabId] = useState(1);
    const [activeImage, setActiveImage] = useState(features[0].image);

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                {/* Section Heading */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                        Why Choose<span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] bg-clip-text text-transparent"> promanager?</span>
                    </h2>
                    <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
                        Discover how promanager simplifies payroll and workforce management with powerful, easy-to-use features.
                    </p>
                </div>

                <div className="mb-12 flex w-full items-start justify-between gap-12">
                    <div className="w-full md:w-1/2">
                        <Accordion type="single" className="w-full" defaultValue="item-1">
                            {features.map((tab) => (
                                <AccordionItem key={tab.id} value={`item-${tab.id}`}>
                                    <AccordionTrigger
                                        onClick={() => {
                                            setActiveImage(tab.image);
                                            setActiveTabId(tab.id);
                                        }}
                                        className="cursor-pointer py-5 hover:no-underline transition"
                                    >
                                        <h6
                                            className={`text-xl font-semibold ${tab.id === activeTabId ? "text-[var(--color-primary-dark)]" : "text-[var(--color-text-secondary)]"
                                                }`}
                                        >
                                            {tab.title}
                                        </h6>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="mt-3 text-[var(--color-text-muted)]">
                                            {tab.description}
                                        </p>
                                        <div className="mt-4 md:hidden">
                                            <img
                                                src={tab.image}
                                                alt={tab.title}
                                                className="h-full max-h-80 w-full rounded-md object-cover"
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    <div className="relative m-auto hidden w-1/2 overflow-hidden rounded-xl bg-[var(--color-bg-secondary)] md:block">
                        <img
                            src={activeImage}
                            alt="Feature preview"
                            className="aspect-[4/3] rounded-md object-cover w-full transition-all duration-300"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AccordionDemo;