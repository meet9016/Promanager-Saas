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
        .matches(/^[A-Za-z0-9\s\-&.,']+$/, "Only business characters (letters, numbers, spaces, and - & . , ') are allowed")
        .required("Company Name is required"),

    email: yup
        .string()
        .trim()
        .matches(
            /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i,
            "Enter valid email address"
        )
        .required("Email is required"),

    mobile: yup
        .string()
        .trim()
        .matches(/^[6-9]\d{9}$/, "Mobile number must be a valid 10-digit number")
        .required("Mobile number is required"),

    whatsapp: yup
        .string()
        .trim()
        .matches(/^[6-9]\d{9}$/, "WhatsApp number must be a valid 10-digit number")
        .required("WhatsApp number is required"),

    address: yup
        .string()
        .trim()
        .min(10, "Address must be at least 10 characters")
        .max(300, "Address must be maximum 300 characters")
        .matches(/^[a-zA-Z0-9\s\-,./()#]+$/, "Only letters, numbers, spaces, and special characters -,./()# are allowed")
        .required("Address is required"),
});