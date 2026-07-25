import React, { useState } from 'react';
import AttendanceReport from './DashboardComponents/AttendanceReport';
import PayrollSummary from './DashboardComponents/PayrollSummary';
import SalaryTrend from './DashboardComponents/SalaryTrend';
import { DashboardProvider } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';

import { useSelector } from 'react-redux';

const DashboardContent = () => {
  const permissions = useSelector(state => state.permissions) || {};

  return (
    <div className="h-[calc(100vh-64px)] p-6 lg:p-8 bg-[var(--color-bg-primary)] flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col min-h-0">
        <AttendanceReport
          salaryTrendComponent={<SalaryTrend />}
          payrollSummaryComponent={<PayrollSummary />}
        />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const [selectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  return (
    <DashboardProvider user={user} date={selectedDate}>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default Dashboard;
