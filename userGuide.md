# Comprehensive User Guide: Attendance Management System

Welcome to the **Attendance Management System**, a comprehensive web application designed to streamline employee attendance tracking, payroll management, leave applications, and reporting. This guide provides step-by-step instructions on how to navigate and utilize the system effectively.

---

## 📑 Table of Contents
1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [User Roles & Access](#3-user-roles--access)
4. [Dashboard Overview](#4-dashboard-overview)
5. [Core Modules](#5-core-modules)
    - [Employee Management](#employee-management)
    - [Attendance & Shift Management](#attendance--shift-management)
    - [Leave Management](#leave-management)
    - [Payroll & Loans](#payroll--loans)
6. [Reports & Exports](#6-reports--exports)
7. [System Administration](#7-system-administration)
8. [Troubleshooting & Support](#8-troubleshooting--support)

---

## 1. Introduction

The Attendance Management System provides an intuitive interface for managing all aspects of employee administrative tasks. Designed with a modern UI (powered by React, Tailwind CSS, and Material-UI), it supports real-time attendance tracking, automatic payroll calculations, comprehensive reporting, and role-based access control.

---

## 2. Getting Started

### 🔐 Logging In
1. Navigate to the system URL provided by your administrator.
2. Enter your **Username** and **Password** on the secure login screen.
3. Click **Login**. Upon successful authentication, a secure JWT session is established, and you are redirected to the Dashboard.

*Note: If your organizational subscription is expired or limited, you may see a Subscription Warning or Expired page.*

---

## 3. User Roles & Access

The system enforces **Role-Based Access Control (RBAC)** to ensure users only access what they need.

- **Administrator:** Full system access. Can manage users, roles, permissions, system settings, and subscription statuses.
- **HR Manager:** Manages employee records, approves/rejects leaves, processes payroll, and accesses all HR reports.
- **Department Manager:** Manages their specific team's attendance, approves team leaves, and views team-specific reports.
- **Employee:** Can view personal attendance and leave records, submit leave requests, and view self-service dashboards.

---

## 4. Dashboard Overview

After logging in, you will land on the interactive Dashboard. Depending on your role, the dashboard provides a high-level view of:
- **Today's Attendance Summary:** Quick metrics on who is present, absent, or on leave.
- **Pending Tasks:** Notifications for pending leave approvals or payroll finalizations.
- **Payroll & Trends:** Visual charts (powered by Recharts) showing salary trends and payroll overviews.
- **Quick Actions:** Shortcuts to "Check-In", "Check-Out", or "Apply for Leave".

---

## 5. Core Modules

### 👥 Employee Management
*Manage your organization's hierarchy and workforce.*

- **Onboarding New Employees:** Navigate to `Employees > Add Employee`. Fill in personal details, assign a unique Employee ID, designation, department, and branch. You'll also set up basic salary and default shift timings here.
- **Organization Structure:** Use the sub-menus under `Employees` to manage master data:
  - **Company & Branches:** Setup multi-branch organizational structures.
  - **Departments & Designations:** Categorize job roles and functional teams.
- **Employee Profiles:** Search and filter the employee directory. Click any profile to view or edit their history, allowances, and deductions.

### ⏰ Attendance & Shift Management
*Track live attendance and manage work schedules.*

- **Daily Check-in/out:** Employees can check in and out through the Dashboard or the Daily Attendance page. Time is captured in real-time.
- **Monitoring Attendance:** HR and Managers can go to `Attendance > Daily Attendance` to monitor live punch-ins, late arrivals, and absences.
- **Shift Management:** 
  - Go to `Shift Management > Create Shift` to define start/end times and rules.
  - Use `Assign Shift` or `Shift Reallocation` to schedule employees accordingly.

### 🏖️ Leave Management
*Seamless digitalization of leave applications and approvals.*

- **Applying for Leave (Self-Service):** 
  1. Go to `Leaves & Holidays > Leave Application`.
  2. Select the Leave Type, Start/End dates, and provide a valid reason.
  3. Submit the request. It will be routed to the respective manager.
- **Approving Leaves:** Managers can review pending requests under `Leave Requests`. They can approve or reject them with mandatory comments.
- **Holidays:** Administrators can define public and company holidays under the `Holiday` module, automatically integrating them with payroll and attendance logic.

### 💰 Payroll & Loans
*Automated and compliant payroll generation.*

- **Processing Monthly Payroll:**
  1. Go to `Payroll > Monthly Payroll`.
  2. Select the target Month and Year.
  3. The system automatically fetches attendance, leaves, base salary, fixed allowances, and deductions to compute the net salary.
- **Finalization:** Navigate to `Payroll > Finalize Payroll` to review the calculations. Once approved, the payroll is locked for that month.
- **Loans & Advances:** 
  - Manage salary advances under `Loan > Add Loan/Advance`.
  - Automatically deduct EMI or advance repayments during the monthly payroll generation process.

---

## 6. Reports & Exports

The system offers extensive reporting with easy exports to **Excel (.xlsx)** and **PDF** formats. Navigate to the `Reports` section to access:

- **Daily Report & Detail Daily Report:** Daily snapshots of attendance, late arrivals, and punch logs.
- **Monthly Report & Muster Preview:** Monthly aggregations and traditional muster roll views.
- **Date Range Report:** Custom reporting across any preferred time range.
- **Geo-location Report:** View attendance punch locations for field staff.
- **Salary Report:** Detailed breakdowns of monthly payroll distribution by branch or department.
- **Employee Directory Report:** Complete workforce data export for HR records.

*Pro-tip: Use the built-in search and filter menus on report pages before exporting to get exactly the data you need.*

---

## 7. System Administration

Administrators have access to global system configurations:
- **System Settings:** Configure default timing, company policies, and dashboard preferences out of `Settings`.
- **User & Role Management:** Go to `Users` to create application login credentials. Define granular permissions for custom roles under `Roles`.
- **Subscription Management:** Keep track of the software license status directly from the interface.

---

## 8. Troubleshooting & Support

**Common Issues:**
- **Forgot Password / Cannot Login:** Reach out to your Administrator or HR. Ensure you have the correct URL.
- **Missing Attendance Records:** Ensure you clicked "Check-Out" properly. If internet connectivity drops, report the exact time to your manager for manual adjustment.
- **Unauthorized Access Page:** You do not have the required RBAC permissions to view the page. Contact Admin to elevate your privileges.
- **Cannot Download Reports:** Check if your browser's pop-up blocker is preventing the download of PDF/Excel files.

**Contact Information:**
For any technical issues or feature requests, contact your internal IT Support or HR Department.

---
*Powered by Promanager Attendance Systems.*
