import React, { useState } from 'react';
import AttendanceReport from './DashboardComponents/AttendanceReport';
import PayrollSummary from './DashboardComponents/PayrollSummary';
import SalaryTrend from './DashboardComponents/SalaryTrend';
import { DashboardProvider } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';

const DashboardContent = () => {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <AttendanceReport />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SalaryTrend />
          <PayrollSummary />
        </div>
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
