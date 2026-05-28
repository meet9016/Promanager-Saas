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
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg border border-[var(--color-border-secondary)] p-8 hover:shadow-xl transition-all duration-300">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Payroll Overview</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">Monthly salary and compensation details</p>
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
              <div className="flex bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-xl p-1">
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
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Total Payroll</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">₹{dashboardData?.totals?.total_salary || 0}</p>
              </div>
              <div className="p-3 bg-[var(--color-primary-lightest)] rounded-full">
                <IndianRupee className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Overtime</p>
                <p className="text-2xl font-bold text-[var(--color-success)]">₹{dashboardData?.totals?.overtime_salary || 0}</p>
              </div>
              <div className="p-3 bg-[var(--color-success-light)] rounded-full">
                <Clock className="w-6 h-6 text-[var(--color-success)]" />
              </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Bonuses</p>
                <p className="text-2xl font-bold text-[var(--color-warning)]">₹{dashboardData?.totals?.week_of_salary || 0}</p>
              </div>
              <div className="p-3 bg-[var(--color-warning-light)] rounded-full">
                <Award className="w-6 h-6 text-[var(--color-warning)]" />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className={`${viewType === 'both' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch' : ''}`}>
            {/* Employee Payroll Table */}
            {(viewType === 'table' || viewType === 'both') && (
              <div className={viewType === 'table' ? 'w-full' : ''}>
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-sm border border-[var(--color-border-secondary)] overflow-hidden h-full flex flex-col">
                  <div className="p-6 border-b border-[var(--color-border-secondary)]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--color-primary-lightest)] rounded-full">
                        <Users className="w-5 h-5 text-[var(--color-primary)]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Employee Payroll</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto flex-1 flex flex-col">
                    <table className="min-w-full flex-1 text-sm text-left">
                      <thead className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border-secondary)]">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">
                            Employee
                          </th>
                          <th className="px-6 py-4 font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">
                            Base Salary
                          </th>
                          <th className="px-6 py-4 font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">
                            Overtime
                          </th>
                          <th className="px-6 py-4 font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)] align-middle">
                        {dashboardData?.payroll_details?.length > 0 ? (
                          <>
                            {dashboardData.payroll_details.slice(0, 5).map((employee) => (
                              <tr
                                key={employee.employee_salary_id}
                                className="hover:bg-[var(--color-bg-hover)] transition-colors duration-200"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center text-white font-semibold text-sm">
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
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-semibold text-[var(--color-text-primary)]">
                                    ₹{employee.final_salary}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-semibold text-[var(--color-success)]">
                                    ₹{employee.overtime_salary}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${employee.payment_status === "2"
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
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-sm border border-[var(--color-border-secondary)] overflow-hidden h-full flex flex-col">
                  <div className="p-6 border-b border-[var(--color-border-secondary)]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--color-primary-lightest)] rounded-full">
                        <BarChart className="w-5 h-5 text-[var(--color-primary)]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Monthly Breakdown
                      </h3>
                    </div>
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