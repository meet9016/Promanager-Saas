import * as yup from "yup";

export const agreementSchema = yup.object().shape({
    full_name: yup.string().required("Full Name is required"),
    company_name: yup.string().required("Company Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    mobile: yup
        .string()
        .matches(/^[0-9]{10,15}$/, "Mobile must be 10-15 digits")
        .required("Mobile number is required"),
    gst_number: yup.string().optional(),
    whatsapp: yup
        .string()
        .matches(/^[0-9]{10,15}$/, "WhatsApp must be 10-15 digits")
        .required("WhatsApp number is required"),
    address: yup.string().required("Address is required"),
});
