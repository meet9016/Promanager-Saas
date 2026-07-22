// SalaryTrend.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardData } from '../../context/DashboardContext';
import NoDataFound from '../comman/NoDataFound';

const SalaryTrend = () => {
  const { dashboardData } = useDashboardData();
  // API: dashboardData.monthly_chart, keys: month_name, total_salary (string)

  // Prepare chart data: convert salary to number
  const data = (dashboardData?.monthly_chart || []).map((d) => ({
    ...d,
    total_salary: Number(d.total_salary || 0),
  }));

  // Calculate stats
  const getStats = () => {
    if (!data || data.length === 0) {
      return { highest: 0, average: 0, growth: 0 };
    }
    const salaries = data.map(d => d.total_salary);
    const highest = Math.max(...salaries);
    const average = salaries.length > 0 ? Math.round(salaries.reduce((acc, s) => acc + s, 0) / salaries.length) : 0;
    const first = salaries.find(s => s > 0) || 0;
    const last = salaries.slice().reverse().find(s => s > 0) || 0;
    const growth = first > 0
      ? (((last - first) / first) * 100)
      : 0;
    return { highest, average, growth };
  };

  const { highest, average, growth } = getStats();

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-secondary)] rounded-2xl shadow-lg border border-[var(--color-border-secondary)] p-8 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Salary Trend</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Monthly salary analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] px-3 py-2 rounded-full border border-[var(--color-border-secondary)]">
          <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full shadow-sm"></div>
          <span className="font-medium">Average</span>
        </div>
      </div>

      {data && data.length > 0 && data.some(d => d.total_salary > 0) ? (
        <>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-divider)" opacity={0.3} />
                <XAxis
                  dataKey="month_name"
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={value => [`₹${(value / 1000).toFixed(1)}K`, 'Total Salary']}
                  labelFormatter={label => label}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border-secondary)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_salary"
                  stroke="var(--color-primary)"
                  strokeWidth={4}
                  dot={{ r: 6, fill: 'var(--color-primary)', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{
                    r: 8,
                    fill: 'var(--color-primary-dark)',
                    strokeWidth: 4,
                    stroke: '#fff',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--color-border-secondary)]">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-200">
              <p className="text-sm font-semibold text-gray-600 mb-2">Highest</p>
              <p className="text-xl font-bold text-green-700">
                ₹{highest.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 hover:shadow-lg transition-all duration-200">
              <p className="text-sm font-semibold text-gray-600 mb-2">Average</p>
              <p className="text-xl font-bold text-primary-700">
                ₹{average.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br rounded-xl border hover:shadow-lg transition-all duration-200"
              style={{
                borderColor: growth >= 0 ? '#10b981' : '#ef4444',
                backgroundColor: growth >= 0 ? '#d1fae5' : '#fee2e2'
              }}>
              <p className="text-sm font-semibold text-gray-600 mb-2">Growth</p>
              <p className="text-xl font-bold"
                style={{ color: growth >= 0 ? '#047857' : '#dc2626' }}>
                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
              </p>
            </div>
          </div>
        </>
      ) : (
        // Empty state
        <div className="flex items-center justify-center h-64">
          <NoDataFound
            title="No salary data available"
            subtitle="Data will appear here once salary trends are recorded"
            className="!py-2"
          />
        </div>
      )}
    </div>
  );
};

export default SalaryTrend;
