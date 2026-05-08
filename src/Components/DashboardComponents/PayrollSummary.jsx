import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, Users, TrendingUp, IndianRupee, Clock, Award, Eye } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useDashboardData } from '../../context/DashboardContext';
import dayjs from 'dayjs';

const PayrollSummary = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [viewType, setViewType] = useState('both'); // 'both', 'chart', 'table'
  const { dashboardData, setYearMonth } = useDashboardData();

  const handleMonthChange = (date) => {
    setSelectedMonth(date);
    const currentYearMonth = dayjs(date).format('YYYY-MM');
    setYearMonth(currentYearMonth);
  };

  return (
    <>
      <div className="max-w-8xl mx-auto">
        {/* Main Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Payroll Overview</h1>
                <p className="text-sm text-gray-500">Monthly salary and compensation details</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Month Selector */}
              <div className="flex items-center space-x-2 z-50">
                <Calendar className="w-5 h-5 text-gray-700" />
                <DatePicker
                  selected={selectedMonth}
                  onChange={handleMonthChange}
                  dateFormat="MM-yyyy"
                  showMonthYearPicker
                  className="month-picker-input"
                  placeholderText="MM-YYYY"
                  maxDate={new Date()}
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setViewType('both')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold ${viewType === 'both'
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Both
                </button>
                <button
                  onClick={() => setViewType('chart')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold ${viewType === 'chart'
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setViewType('table')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold ${viewType === 'table'
                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-xl border border-primary-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Total Payroll</p>
                  <p className="text-3xl font-bold text-primary-700">₹{dashboardData?.totals?.total_salary || 0}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Overtime</p>
                  <p className="text-3xl font-bold text-green-700">₹{dashboardData?.totals?.overtime_salary || 0}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-xl border border-amber-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Bonuses</p>
                  <p className="text-3xl font-bold text-amber-700">₹{dashboardData?.totals?.week_of_salary || 0}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className={`${viewType === 'both' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch' : ''}`}>
            {/* Employee Payroll Table */}
            {(viewType === 'table' || viewType === 'both') && (
              <div className={viewType === 'table' ? 'w-full' : ''}>
                <div className="bg-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden h-full flex flex-col">
                  <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] p-5">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-white" />
                      <h3 className="text-xl font-bold text-white">Employee Payroll</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto flex-1 flex flex-col">
                    <table className="min-w-full flex-1 text-xs"> {/* reduced text size */}
                      <thead className="bg-[var(--color-bg-hover)]">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Base Salary
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Overtime
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)] align-top">
                        {dashboardData?.payroll_details?.length > 0 ? (
                          <>
                            {dashboardData.payroll_details.slice(0, 5).map((employee) => (
                              <tr
                                key={employee.employee_salary_id}
                                className="hover:bg-[var(--color-bg-hover)] transition-colors duration-200"
                              >
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary)] flex items-center justify-center text-white font-semibold shadow-md text-xs">
                                      {employee.full_name
                                        ? employee.full_name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .substring(0, 2)
                                          .toUpperCase()
                                        : employee.employee_code}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                                        {employee.full_name}
                                      </p>
                                      <p className="text-xs text-[var(--color-text-secondary)]">
                                        {employee.department_name}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className="font-semibold text-[var(--color-text-primary)]">
                                    ₹{employee.final_salary}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className="font-semibold text-[var(--color-success)]">
                                    ₹{employee.overtime_salary}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full shadow-sm ${employee.payment_status === "2"
                                        ? "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)] border-opacity-20"
                                        : "bg-[var(--color-warning-light)] text-[var(--color-warning)] border border-[var(--color-warning)] border-opacity-20"
                                      }`}
                                  >
                                    {employee.payment_status === "2" ? "Paid" : "Pending"}
                                  </span>
                                </td>
                              </tr>
                            ))}

                            {/* Add empty rows if less than 5 records */}
                            {Array.from({
                              length: 5 - dashboardData.payroll_details.slice(0, 5).length,
                            }).map((_, index) => (
                              <tr key={`empty-${index}`}>
                                <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-muted)] text-xs">
                                  —
                                </td>
                              </tr>
                            ))}
                          </>
                        ) : (
                          <>
                            <tr>
                              <td
                                colSpan={4}
                                className="text-center py-6 text-[var(--color-text-secondary)]"
                              >
                                <div className="flex flex-col items-center gap-2 text-xs">
                                  <Users className="w-8 h-8 text-[var(--color-text-muted)]" />
                                  <p>No payroll data available</p>
                                </div>
                              </td>
                            </tr>

                            {/* Always show 4 more empty rows */}
                            {Array.from({ length: 4 }).map((_, index) => (
                              <tr key={`empty-no-data-${index}`}>
                                <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-muted)] text-xs">
                                  —
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>

                  </div>
                </div>
              </div>
            )}

            {/* Chart Section */}
            {(viewType === 'chart' || viewType === 'both') && (
              <div className={viewType === 'chart' ? 'w-full' : ''}>
                <div className="bg-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden h-full flex flex-col">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-5 border-b border-gray-300">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <BarChart className="w-6 h-6 text-gray-700" />
                      Monthly Breakdown
                    </h3>
                  </div>

                  <div className="p-8 flex-1">
                    {dashboardData?.monthly_chart?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
                        <BarChart className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
                        <p className="text-lg font-medium">No chart data available</p>
                        <p className="text-sm">Data will appear here when payroll information is loaded</p>
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dashboardData?.monthly_chart || []}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-divider)" opacity={0.3} />
                            <XAxis
                              dataKey="month_name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }}
                              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border-secondary)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                                color: 'var(--color-text-primary)'
                              }}
                              formatter={(value, name) => [`₹${value}`, name]}
                            />
                            <Bar
                              dataKey="total_salary"
                              stackId="a"
                              fill="var(--color-primary)"
                              name="Base Salary"
                              radius={[0, 0, 0, 0]}
                            />
                            <Bar
                              dataKey="overtime_salary"
                              stackId="a"
                              fill="var(--color-success)"
                              name="Overtime"
                              radius={[0, 0, 0, 0]}
                            />
                            <Bar
                              dataKey="week_of_salary"
                              stackId="a"
                              fill="var(--color-warning)"
                              name="Bonuses"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default PayrollSummary;