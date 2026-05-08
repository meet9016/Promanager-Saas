## Attendance Frontend Documentation

### 1. Project Overview
This is a **React + Vite** frontend for an Attendance Management System. It provides modern, responsive interfaces for:

- **Employee & organization management** – Companies, branches, departments, designations, and employees.
- **Attendance tracking** – Daily and monthly views, muster previews, and geo-location reports.
- **Payroll & finance** – Monthly salary, allowances, deductions, and loan/advance management.
- **Leave & shift management** – Holidays, leave applications/status, shift creation, assignment, and reallocation.
- **Reporting & dashboards** – Interactive dashboards for attendance and payroll insights, plus detailed exportable reports.
- **Security & access control** – Role-based permissions, protected routes, and subscription-aware access.

The UI is built with React, Tailwind CSS, and MUI, and uses React Router, Redux Toolkit, and custom hooks for state and data flows.

### 2. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd FRONTEND
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or as specified in the terminal).

### 3. Project Structure
```text
FRONTEND/
├── public/                  # Public static assets (logo, login image, sitemap, robots, etc.)
├── src/
│   ├── api/                 # Axios instance and feature-specific API modules
│   ├── assets/              # Shared assets (e.g. logo)
│   ├── Components/          # Reusable and feature components
│   │   ├── Dashboard/       # High-level dashboard container
│   │   ├── DashboardComponents/   # Attendance & payroll charts and summary widgets
│   │   ├── Landing/         # Marketing / product landing page and sections
│   │   ├── Subscription/    # Subscription guard, warning modal, and expired page
│   │   ├── ui/              # Reusable dialogs, modals, toasts, pagination, etc.
│   │   └── ...              # Other shared components (Navbar, Sidebar, Loader, Error pages)
│   ├── context/             # React Contexts (Auth, Dashboard, Theme)
│   ├── hooks/               # Custom React hooks for data fetching and logic reuse
│   ├── pages/               # Route-level pages grouped by feature (Attendance, Employee, Leave, Payroll, Report, Settings, ShiftManagement, Users)
│   ├── redux/               # Redux store, slices, and utilities (permissions, session storage)
│   ├── style/               # Custom CSS utilities
│   ├── utils/               # Utility functions (export helpers, shared helpers)
│   ├── App.jsx              # Root application component and router layout
│   └── main.jsx             # Application entry point
├── my-docs/                 # Additional documentation site (Docusaurus-style structure)
├── data.json                # Seed/config data used by the app (if applicable)
├── package.json             # Project metadata, dependencies, and scripts
├── vite.config.js           # Vite configuration (React plugin, build options)
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── vercel.json              # Vercel deployment configuration
├── WorkflowREADME.md        # Notes about project workflows and processes
└── ...
```

### 4. Scripts & Usage
- **`npm run dev`** – Start the development server.
- **`npm run build`** – Build the app for production.
- **`npm run preview`** – Preview the production build locally.
- **`npm run lint`** – Lint the codebase using ESLint.

### 5. Key Features
- **Employee & organization management**: Manage companies, branches, departments, designations, and employees.
- **Attendance management**: Daily and monthly attendance views, and detailed daily/muster reports.
- **Payroll management**: Monthly payroll processing, salary summaries, and payroll finalization.
- **Allowances & deductions**: Configure earning and deduction components used in payroll.
- **Leave management**: Holidays, leave application, and leave status tracking.
- **Loan & advance management**: Create and manage loan/advance records for employees.
- **Reports & analytics**:
  - Daily, monthly, and date-range reports
  - Employee directory reports
  - Geo-location / punch location reports
  - Monthly muster preview and monthly salary reports
- **Dashboards**: Visual summaries of attendance, payroll, and trends using charts.
- **Shift management**: Create shifts, assign them to employees, and reallocate when needed.
- **User, role & permissions management**: Users, roles, and fine-grained permission control.
- **Subscription management**: Guards, warnings, and an expired-subscription experience.
- **Export capabilities**: Export key reports to Excel/PDF for further analysis or sharing.

### 6. Authentication, Authorization & Subscription
- **AuthContext** (`src/context/AuthContext.jsx`): Manages authentication state (user, tokens, login/logout).
- **ProtectedRoute** (`src/Components/ProtectedRoute.jsx`): Restricts route access to authenticated users.
- **permissionsSlice** (`src/redux/permissionsSlice.js`): Stores and checks role-based permissions.
- **sessionStorageUtils** (`src/redux/sessionStorageUtils.js`): Helps persist and restore critical session data.
- **Subscription components** (`src/Components/Subscription/`):
  - `SubscriptionGuard.jsx` – Wraps routes/components and blocks access on invalid subscription.
  - `SubscriptionWarningModal.jsx` – Warns when a subscription is near expiry or limited.
  - `SubscriptionExpiredPage.jsx` – Dedicated page for expired subscriptions.

### 7. State Management
- **Redux Toolkit**:
  - Store setup in `src/redux/store.js`.
  - Slices (e.g., `permissionsSlice`) manage core app-wide state such as permissions.
- **React Context**:
  - `AuthContext.jsx` for authentication.
  - `DashboardContext.jsx` for dashboard data and filters.
  - `Themecontext.jsx` & `Themetoggle.jsx` for theme preferences (e.g., light/dark handling).

Use Redux for global, cross-cutting state and Context for scoped concerns like auth, dashboard, and theme.

### 8. API Integration
- **Axios instance** in `src/api/axiosInstance.js`:
  - Central configuration for base URL, interceptors (auth headers, error handling, etc.).
- **Feature API modules** (e.g. `src/api/user.js`):
  - Grouped by domain (users, employees, attendance, etc.) to keep API logic organized and reusable.

### 9. Custom Hooks
Custom hooks are located in `src/hooks/` and encapsulate data fetching, transformation, and related UI logic:

- **`useAllowances.js`** – Manage allowance records and related operations.
- **`useBranches.js`** – Fetch and manage branch data.
- **`useCompanies.js`** – Fetch and manage company data.
- **`useDeductions.js`** – Manage deductions and deduction types.
- **`useDepartments.js`** – Fetch and manage departments.
- **`useDesignations.js`** – Fetch and manage designations.
- **`useUserId.js`** – Helper for accessing the current user ID in a consistent way.

These hooks centralize API calls and common logic, making components simpler and easier to maintain.

### 10. Component & Page Overview
- **Core layout & navigation**
  - `Navbar.jsx`, `Sidebar.jsx` – Main layout and navigation.
  - `ProtectedRoute.jsx`, `Unauthorized.jsx`, `Error404Page.jsx` – Routing helpers and error pages.
- **Dashboard**
  - `Dashboard.jsx` – Main dashboard container.
  - `DashboardComponents/` – Charts and summary tiles (`AttendanceReport.jsx`, `PayrollSummary.jsx`, `SalaryTrend.jsx`, etc.).
- **Landing**
  - `LandingPage.jsx` and `LandingNavbar.jsx` – Public-facing marketing / product overview.
  - Sections in `Landing/components/` – Hero, features, stats, services, testimonials, CTA, contact, etc.
- **Feature pages (in `src/pages/`)**
  - `Attendance/` – `DailyAttendance.jsx`, `MonthlyAttendance.jsx`.
  - `Employee/` – Employee CRUD plus allowance, deduction, company, branch, department, and designation screens.
  - `Leave/` – `Holiday.jsx`, `LeaveApplication.jsx`, `LeaveStatus.jsx`.
  - `Loan/` – `LoanAdvance.jsx`, `AddLoanAdvance.jsx`.
  - `Payroll/` – `MonthlyPayroll.jsx`, `FinalizePayroll.jsx`.
  - `Report/` – All report pages (daily, monthly, date range, employee directory, geolocation, salary, muster, etc.).
  - `ShiftManagement/` – Shift creation, assignment, and reallocation.
  - `Users/` – User and role management (`Usermanagement.jsx`, `AddUser.jsx`, `Role.jsx`, `AddRole.jsx`).
  - `Setting/` – `SettingsPage.jsx` for application-level settings.
- **UI utilities**
  - `Loader/LoadingSpinner.jsx`, `ui/Toast.jsx`, `ui/ConfirmDialog.jsx`, `ui/LoanDetailsModal.jsx`, `Pagination.jsx` and similar.

### 11. Styling
- **Tailwind CSS**:
  - Configured via `tailwind.config.js` and `postcss.config.js`.
  - Utility-first styling for layout, spacing, colors, and responsive behavior.
- **Custom CSS**:
  - Additional global styles and overrides in `src/App.css`, `src/index.css`, and `src/style/`.
- **MUI (Material UI)**:
  - Used for advanced UI components and consistent design (inputs, dialogs, date pickers, etc.).

### 12. Export & Reporting Utilities
- Located under `src/utils/exportUtils/`.
- Organised by report type, for example:
  - `DailyReport/`
  - `DateRangeReport/`
  - `DetailDailyReport/`
  - `EmployeeReport/`
  - `GeolocationReport/`
  - `MonthlyMuster/`
  - `MonthlyReport/`
  - `salary/`
- These helpers use libraries like `exceljs`, `xlsx`, `file-saver`, `jspdf`, and `jspdf-autotable` to export data to **Excel** and **PDF**.

### 13. Documentation Site (`my-docs/`)
- The `my-docs/` directory contains a separate documentation site (Docusaurus-like structure) with:
  - `docs/` and `blog/` content.
  - `src/` for the documentation site components and theme.
  - `static/` for doc-specific static assets.
- Use this folder to host more detailed guides, tutorials, and release notes if needed.

### 14. Deployment
- **Build the app:**
  ```bash
  npm run build
  ```
- **Deploy** the generated `dist/` folder to your preferred static hosting provider (e.g., Vercel, Netlify, static hosting on a server).
- **Vercel**:
  - Deployment configuration is defined in `vercel.json`.
  - Vite is supported natively; you can hook into build/preview scripts in your deployment settings.

### 15. Contributing
1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Make your changes and commit them with clear messages.
4. Push to your fork and open a pull request against the main repository.

### 16. License
Specify your license here (e.g., MIT, Apache 2.0, etc.).

### 17. Contact
For questions, feedback, or support, contact the project maintainer or open an issue in the repository.
