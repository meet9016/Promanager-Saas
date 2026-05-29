import * as yup from "yup";

export const agreementSchema = yup.object().shape({
    full_name: yup
        .string()
        .trim()
        .min(3, "Full Name must be at least 3 characters")
        .max(50, "Full Name must be maximum 50 characters")
        .matches(/^[A-Za-z\s]+$/, "Only letters are allowed")
        .required("Full Name is required"),

    company_name: yup
        .string()
        .trim()
        .min(2, "Company Name must be at least 2 characters")
        .max(100, "Company Name must be maximum 100 characters")
        .required("Company Name is required"),

    email: yup
        .string()
        .trim()
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Enter valid email address"
        )
        .required("Email is required"),

    mobile: yup
        .string()
        .trim()
        .matches(/^[0-9]+$/, "Only numbers are allowed")
        // .min(10, "Mobile number must be at least 10 digits")
        .max(10, "Mobile number must be maximum 15 digits")
        .required("Mobile number is required"),

    gst_number: yup
        .string()
        .trim()
        .matches(
            /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/,
            "Enter valid GST number"
        )
        .nullable(),

    whatsapp: yup
        .string()
        .trim()
        .matches(/^[0-9]+$/, "Only numbers are allowed")
        // .min(10, "WhatsApp number must be at least 10 digits")
        .max(10, "WhatsApp number must be maximum 15 digits")
        .required("WhatsApp number is required"),

    address: yup
        .string()
        .trim()
        .min(10, "Address must be at least 10 characters")
        .max(300, "Address must be maximum 300 characters")
        .required("Address is required"),
});