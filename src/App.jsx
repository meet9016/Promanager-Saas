import React, { Suspense, lazy, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
import ProtectedRoute from "./Components/ProtectedRoute";
import SubscriptionGuard from "./Components/Subscription/SubscriptionGuard";
import { ThemeProvider } from "./context/Themecontext";
import Unauthorized from "./Components/Unauthorized";
const Error404Page = lazy(() => import("./Components/Error404Page"));

// Landing Page Components (for better performance, keep these non-lazy)
import LandingPage from "./Components/Landing/LandingPage";
import LandingNavbar from "./Components/Landing/LandingNavbar";
import LoadingSpinner from "./Components/Loader/LoadingSpinner";
import Footer from "./Components/Landing/components/Footer";

// Landing Page Components
import AboutPage from "./Components/Landing/pages/AboutPage";
import ServicesPage from "./Components/Landing/pages/ServicePage";
import EmployeeManagement from "./Components/Landing/pages/EmployeeManagement";
import PayrollBenefits from "./Components/Landing/pages/PayrollBenefits";
import FeaturesPage from "./Components/Landing/components/FeaturesSection";
import ContactPage from "./Components/Landing/components/ContactPage";
import PricingPage from "./Components/Landing/pages/PricingPage";

// Legal Pages
import SecurityPolicy from "./Components/Landing/pages/SecurityPolicy";
import TermsOfService from "./Components/Landing/pages/TermsOfService";
import PrivacyPolicy from "./Components/Landing/pages/PrivacyPolicy";
import ComingSoon from "./Components/Landing/pages/ComingSoon";

// Lazy Loaded Employee Management Pages
const Employee = lazy(() => import("./pages/Employee/Employee"));
const EmployeeDetail = lazy(() => import("./pages/Employee/EmployeeDetail"));
const AddEmployee = lazy(() => import("./pages/Employee/AddEmployee"));
const DepartmentsPage = lazy(() => import("./pages/Employee/Departments"));
const BranchesPage = lazy(() => import("./pages/Employee/Branches"));
const DesignationPage = lazy(() => import("./pages/Employee/Designations"));
const DeductionPage = lazy(() => import("./pages/Employee/Deduction"));
const AllowancePage = lazy(() => import("./pages/Employee/Allowance"));
const CompanyPage = lazy(() => import("./pages/Employee/Company"));
const IncrementPage = lazy(() => import("./pages/Employee/Increment"));

// Lazy Loaded User Management Pages
const Role = lazy(() => import("./pages/Users/Role"));
const AddRole = lazy(() => import("./pages/Users/AddRole"));
const Usermanagement = lazy(() => import("./pages/Users/Usermanagement"));
const AddUser = lazy(() => import("./pages/Users/AddUser"));

// Lazy Loaded Shift Management Pages
const ShiftManagement = lazy(
  () => import("./pages/ShiftManagement/ShiftManagement"),
);
const CreateShift = lazy(() => import("./pages/ShiftManagement/CreateShift"));
const AssignShift = lazy(() => import("./pages/ShiftManagement/AssignShift"));

// Lazy Loaded Leave Management Pages
const LeaveApplication = lazy(() => import("./pages/Leave/LeaveApplication"));
const LeaveStatusPage = lazy(() => import("./pages/Leave/LeaveStatus"));
const Holiday = lazy(() => import("./pages/Leave/Holiday"));

// Lazy Loaded Loan Management Pages
const LoanAdvance = lazy(() => import("./pages/Loan/LoanAdvance"));
const AddLoanAdvance = lazy(() => import("./pages/Loan/AddLoanAdvance"));

// Lazy Loaded Payroll Management Pages
const MonthlyPayroll = lazy(() => import("./pages/Payroll/MonthlyPayroll"));
const FinalizePayroll = lazy(() => import("./pages/Payroll/FinalizePayroll"));

// Lazy Loaded Report Pages
const AllReports = lazy(() => import("./pages/Report/AllReports"));
const DailyReport = lazy(() => import("./pages/Report/DailyReport"));
const DetailedDailyReport = lazy(
  () => import("./pages/Report/DetailedDailyReport"),
);
const AttendanceExceptionReport = lazy(
  () => import("./pages/Report/AttendanceExceptionReport"),
);
const MonthlyExceptionReport = lazy(
  () => import("./pages/Report/Monthlyexceptionreport"),
);

const MonthlyReport = lazy(() => import("./pages/Report/MothlyReport"));
const MonthlyMusterPreview = lazy(
  () => import("./pages/Report/MonthlyMusterPreview"),
);
const DateRangeReport = lazy(() => import("./pages/Report/DateRangeReport"));
const EmployeeDirectoryReport = lazy(
  () => import("./pages/Report/EmployeeDirectoryReport"),
);
const MonthlySalaryReport = lazy(
  () => import("./pages/Report/MonthlySalaryReport"),
);
const PayMonthlySalaryReport = lazy(
  () => import("./pages/Report/PayMonthlySalaryReport"),
);
const SalaryGenerationStatusReport = lazy(
  () => import("./pages/Report/SalaryGenerationStatusReport"),
);

// Settings (combines Configuration + Plans & Pricing)
const SettingsPage = lazy(() => import("./pages/Setting/SettingsPage"));

import { useNavigate } from "react-router-dom";
import DailyAttendance from "./pages/Attendance/DailyAttendance";
import MonthlyAttendance from "./pages/Attendance/MonthlyAttendance";
import GeolocationReport from "./pages/Report/GeolocationReport";
import ShiftReallocation from "./pages/ShiftManagement/ShiftReallocation";
import PrivacyPolicyPage from "./Components/Landing/components/PrivacyPolicy";
import TermsAndConditionsPage from "./Components/Landing/components/TermsPage";
import PaymentPage from "./Components/Landing/pages/PaymentPage";
import { FaWhatsapp } from "react-icons/fa";
import SubscriptionExpiredPage from "./Components/Subscription/SubscriptionExpiredPage";
import Renew from "./Components/Landing/pages/Renew";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated =
    useSelector((state) => state.auth?.isAuthenticated) || false;
  const permissions = useSelector((state) => state.permissions) || {};

  const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  };

  // Detect 
  // if user is on mobile or tablet
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(
    window.innerWidth <= 768,
  );

  // Route categorization for better performance
  const isLandingRoute = [
    "/",
    "/about",
    "/features",
    "/contact",
    "/pricing",
    "/payment",
    "/renew",
    "/employee-management",
    "/payroll-benefits",
    "/security-policy",
    "/terms",
    "/terms-of-service",
    "/privacy-policy",
    "/coming-soon",
  ].includes(location.pathname);

  const isLoginRoute = location.pathname === "/login";
  const isErrorRoute = ["/unauthorized", "/404", "/expired"].includes(location.pathname);
  const isPublicRoute = isLandingRoute || isLoginRoute || isErrorRoute;
  const shouldHideNavigation = isPublicRoute;


  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  // Redirect to Daily Attendance for mobile/tablet users after login
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to daily attendance instead of dashboard
      navigate("/dashboard");

      setIsCollapsed(false);
    }
  }, [isAuthenticated, navigate]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Optimized window resize handler with debouncing
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth <= 768;
        const mobileOrTablet = window.innerWidth <= 768;

        setIsMobile(mobile);
        setIsMobileOrTablet(mobileOrTablet);

        // Auto-collapse on mobile, expand on desktop if previously expanded
        if (mobile && !isCollapsed) {
          setIsCollapsed(true);
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [isCollapsed]);

  // Calculate main content style with smooth transitions
  const getMainContentStyle = () => {
    if (shouldHideNavigation) return { minHeight: "100vh" };

    return {
      marginLeft: isCollapsed ? (isMobile ? "0" : "80px") : "256px",
      paddingTop: "64px",
      minHeight: "calc(100vh - 64px)",
      transition: "margin-left 0.3s ease-in-out",
    };
  };

  // Permission-based route wrapper
  const PermissionRoute = ({
    children,
    permission,
    fallback = <Navigate to="/unauthorized" replace />,
  }) => {
    return permissions[permission] ? (
      <ProtectedRoute>{children}</ProtectedRoute>
    ) : (
      fallback
    );
  };

  // Simplified wrapper component for landing pages
  const LandingPageWrapper = ({ children }) => (
    <div className="min-h-screen bg-background">{children}</div>
  );

  return (
    <ThemeProvider>
      <ScrollToTop />

      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        {/* Landing Page Navbar - Show on all landing routes */}
        {isLandingRoute && <LandingNavbar />}

        {/* Application Navbar */}
        {!shouldHideNavigation && (
          <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        )}

        {/* Sidebar for authenticated routes - Pass isMobileOrTablet prop */}
        {!shouldHideNavigation && (
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOrTablet={isMobileOrTablet}
          />
        )}


        {isPublicRoute && !isLoginRoute ? (
          <a
            href="https://wa.me/919274889008?text=Hello%2C%20I%20have%20visited%20your%20website%20and%20am%20interested%20in%20a%20demo%20of%20Promanager%20%F0%9F%98%80.%20Please%20share%20the%20details.%20Thank%20you!"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[9999] group"
          >
            <div className="bg-[#009745] hover:bg-[#1ebe5d] text-white p-3 rounded-full shadow-md shadow-black/20 transition-all duration-300 flex items-center justify-center">
              <FaWhatsapp className="w-8 h-8" />
            </div>
          </a>
        ) : null}

        <main
          className="transition-all duration-300 overflow-y-auto"
          style={getMainContentStyle()}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Landing Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsAndConditionsPage />} />
              <Route
                path="/about"
                element={
                  <LandingPageWrapper>
                    <AboutPage />
                  </LandingPageWrapper>
                }
              />
              {/* <Route
                  path="/services"
                  element={
                    <LandingPageWrapper>
                      <ServicesPage />
                    </LandingPageWrapper>
                  }
                /> */}
              <Route
                path="/employee-management"
                element={
                  <LandingPageWrapper>
                    <EmployeeManagement />
                  </LandingPageWrapper>
                }
              />
              <Route
                path="/payroll-benefits"
                element={
                  <LandingPageWrapper>
                    <PayrollBenefits />
                  </LandingPageWrapper>
                }
              />
              <Route
                path="/features"
                element={
                  <LandingPageWrapper>
                    <FeaturesPage />
                  </LandingPageWrapper>
                }
              />
              <Route
                path="/pricing"
                element={
                  <LandingPageWrapper>
                    <PricingPage />
                  </LandingPageWrapper>
                }
              />
              <Route
                path="/payment"
                element={
                  <LandingPageWrapper>
                    <PaymentPage />
                  </LandingPageWrapper>
                }
              />
              <Route
                path="/renew"
                element={
                  <LandingPageWrapper>
                    <Renew />
                  </LandingPageWrapper>
                }
              />

              <Route
                path="/contact"
                element={
                  <LandingPageWrapper>
                    <ContactPage />
                  </LandingPageWrapper>
                }
              />

              {/* Legal Pages Routes */}
              <Route
                path="/security-policy"
                element={
                  <LandingPageWrapper>
                    <SecurityPolicy />
                  </LandingPageWrapper>
                }
              />
              <Route
                path="/terms-of-service"
                element={
                  <LandingPageWrapper>
                    <TermsOfService />
                  </LandingPageWrapper>
                }
              />
              <Route
                path="/privacy-policy"
                element={
                  <LandingPageWrapper>
                    <PrivacyPolicy />
                  </LandingPageWrapper>
                }
              />

              <Route
                path="/coming-soon"
                element={
                  <LandingPageWrapper>
                    <ComingSoon />
                  </LandingPageWrapper>
                }
              />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Dashboard Route - Only for Desktop */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>

                    <Dashboard />

                  </ProtectedRoute>
                }
              />

              {/* Attendance Routes - Available for all devices */}
              <Route
                path="/attendance/daily"
                element={
                  <ProtectedRoute>
                    <DailyAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/monthly"
                element={
                  <ProtectedRoute>
                    <MonthlyAttendance />
                  </ProtectedRoute>
                }
              />

              {/* Desktop Only Routes - Redirect mobile/tablet users to attendance */}
              <Route
                path="/role"
                element={

                  <PermissionRoute permission="user_roles_view">
                    <Role />
                  </PermissionRoute>

                }
              />

              <Route
                path="/add-role"
                element={

                  <PermissionRoute
                    permission={
                      permissions["user_roles_create"] ||
                        permissions["user_roles_edit"]
                        ? "user_roles_create"
                        : null}
                  >
                    <AddRole />
                  </PermissionRoute>

                }
              />

              <Route
                path="/usermanage"
                element={

                  <PermissionRoute permission="user_view">
                    <Usermanagement />
                  </PermissionRoute>

                }
              />

              <Route
                path="/add-user"
                element={

                  <PermissionRoute permission="user_create">
                    <AddUser />
                  </PermissionRoute>

                }
              />

              {/* Employee Management Routes - Desktop Only */}
              <Route
                path="/employee"
                element={

                  <PermissionRoute permission="employee_view">
                    <Employee />
                  </PermissionRoute>

                }
              />

              <Route
                path="/add-employee"
                element={

                  <PermissionRoute permission="employee_create">
                    <AddEmployee />
                  </PermissionRoute>

                }
              />

              <Route
                path="/employee/details/:employee_id"
                element={

                  <PermissionRoute permission="employee_view">
                    <EmployeeDetail />
                  </PermissionRoute>

                }
              />

              {/* Organizational Structure Routes - Desktop Only */}
              <Route
                path="/departments"
                element={

                  <PermissionRoute permission="department_view">
                    <DepartmentsPage />
                  </PermissionRoute>

                }
              />

              <Route
                path="/branches"
                element={

                  <PermissionRoute permission="branch_view">
                    <BranchesPage />
                  </PermissionRoute>

                }
              />

              <Route
                path="/designation"
                element={

                  <PermissionRoute permission="designation_view">
                    <DesignationPage />
                  </PermissionRoute>

                }
              />

              <Route
                path="/deductions"
                element={

                  <PermissionRoute permission="deduction_view">
                    <DeductionPage />
                  </PermissionRoute>

                }
              />

              <Route
                path="/allowances"
                element={

                  <PermissionRoute permission="allowance_view">
                    <AllowancePage />
                  </PermissionRoute>

                }
              />

              <Route
                path="/companies"
                element={

                  <PermissionRoute permission="company_view">
                    <CompanyPage />
                  </PermissionRoute>

                }
              />

              <Route
                path="/increment"
                element={
                  isMobileOrTablet ? (
                    <Navigate to="/increment" replace />
                  ) : (
                    <PermissionRoute permission="employee_create">
                      <IncrementPage />
                    </PermissionRoute>
                  )
                }
              />

              {/* Shift Management Routes - Desktop Only */}
              <Route
                path="/shift-management"
                element={

                  <PermissionRoute permission="shift_view">
                    <ShiftManagement />
                  </PermissionRoute>

                }
              />

              <Route
                path="/add-shift"
                element={


                  <PermissionRoute permission="shift_create">
                    <CreateShift />
                  </PermissionRoute>

                }
              />

              <Route
                path="/assign-shift"
                element={

                  <PermissionRoute permission="shift_assign">
                    <AssignShift />
                  </PermissionRoute>

                }
              />

              <Route
                path="/shift-reallocation"
                element={
                  <PermissionRoute permission="shift_assign">
                    <ShiftReallocation />
                  </PermissionRoute>}
              />

              {/* Leave Management Routes - Desktop Only */}
              <Route
                path="/leaveapplication"
                element={

                  <PermissionRoute permission="leave_create">
                    <LeaveApplication />
                  </PermissionRoute>

                }
              />

              <Route
                path="/leavestatusPage"
                element={

                  <PermissionRoute permission="leave_view">
                    <LeaveStatusPage />
                  </PermissionRoute>

                }
              />

              <Route
                path="/holiday"
                element={

                  <ProtectedRoute>
                    <Holiday />
                  </ProtectedRoute>

                }
              />

              {/* Loan Management Routes - Desktop Only */}
              <Route
                path="/loans"
                element={

                  <PermissionRoute permission="loan_view">
                    <LoanAdvance />
                  </PermissionRoute>

                }
              />

              <Route
                path="/add-loan-advance"
                element={

                  <PermissionRoute permission="loan_create">
                    <AddLoanAdvance />
                  </PermissionRoute>

                }
              />

              {/* Payroll Management Routes - Desktop Only */}
              <Route
                path="/monthly-payroll"
                element={

                  <PermissionRoute
                    permission={
                      permissions["salary_view"] ||
                        permissions["salary_create"]
                        ? "salary_view"
                        : null
                    }
                  >
                    <MonthlyPayroll />
                  </PermissionRoute>

                }
              />

              <Route
                path="/finalize-payroll"
                element={

                  <PermissionRoute
                    permission={
                      permissions["salary_create"] ||
                        permissions["add_salary_payment"]
                        ? "salary_create"
                        : null
                    }
                  >
                    <FinalizePayroll />
                  </PermissionRoute>

                }
              />

              {/* Reports Routes - Desktop Only */}
              <Route
                path="/reports"
                element={
                  <PermissionRoute
                    permission={
                      permissions["employee_directory"] ||
                        permissions["daily_attendance"] ||
                        permissions["monthly_attendance"] ||
                        permissions["monthly_salary"] ||
                        permissions["custom_range"]
                        ? "employee_directory"
                        : null
                    }
                  >
                    <AllReports />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/employee-directory"
                element={
                  <PermissionRoute permission="employee_directory">
                    <EmployeeDirectoryReport />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/daily-attendance"
                element={
                  <PermissionRoute permission="daily_attendance">
                    <DailyReport />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/attendance-exception"
                element={
                  <ProtectedRoute>
                    <AttendanceExceptionReport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports/monthly-exception"
                element={
                  <ProtectedRoute>
                    <MonthlyExceptionReport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports/daily-attendance-detailed"
                element={
                  <PermissionRoute permission="daily_attendance">
                    <DetailedDailyReport />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/monthly-attendance"
                element={
                  <PermissionRoute permission="monthly_attendance">
                    <MonthlyReport />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/monthly-attendance-muster"
                element={
                  <PermissionRoute permission="monthly_attendance">
                    <MonthlyMusterPreview />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/daterangereport"
                element={
                  <PermissionRoute permission="custom_range">
                    <DateRangeReport />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/monthly-salary"
                element={
                  <PermissionRoute permission="monthly_salary">
                    <MonthlySalaryReport />
                  </PermissionRoute>
                }
              />

              <Route
                path="/reports/pay-monthly-salary"
                element={
                  <ProtectedRoute>
                    <PayMonthlySalaryReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/salary-generation-status"
                element={
                  <ProtectedRoute>
                    <SalaryGenerationStatusReport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports/geolocation-report"
                element={
                  <PermissionRoute permission="daily_attendance">
                    <GeolocationReport />
                  </PermissionRoute>
                }
              />

              <Route
                path="/settings"
                element={

                  <ProtectedRoute>
                    <SettingsPage
                      canEditConfiguration={
                        !!permissions.configuration_edit
                      }
                    />
                  </ProtectedRoute>

                }
              />

              {/* 404 Error Page - Catch all unmatched routes */}
              <Route path="/404" element={<Error404Page />} />
              <Route
                path="/expired"
                element={<ProtectedRoute>
                  <SubscriptionExpiredPage />
                </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* Footer for Landing Pages - Show only on landing routes */}
        {isLandingRoute && <Footer />}
      </div>

    </ThemeProvider>
  );
};

export default App;
