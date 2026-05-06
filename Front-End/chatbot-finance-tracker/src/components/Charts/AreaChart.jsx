import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Format số tiền VND ngắn gọn cho trục Y và tooltip.
 * VD: 1500000 → "1.5M", 25000 → "25K"
 */
function formatVND(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

/**
 * Format số tiền VND đầy đủ cho tooltip.
 * VD: 1500000 → "1,500,000 ₫"
 */
function formatFullVND(value) {
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
}

/**
 * Chuyển đổi daily data object → mảng cho Recharts.
 * Hỗ trợ gộp chung Income và Expense.
 */
function transformDailyData(expenseData, incomeData) {
  if (!expenseData && !incomeData) return [];

  const allDates = new Set([...Object.keys(expenseData || {}), ...Object.keys(incomeData || {})]);
  const sortedDates = Array.from(allDates).sort();

  return sortedDates.map(dateStr => {
    const date = new Date(dateStr);
    const label = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      name: label,
      expenses: expenseData?.[dateStr] || 0,
      incomes: incomeData?.[dateStr] || 0
    };
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-lowest px-4 py-3 rounded-xl shadow-lg border border-outline-variant/20">
        <p className="text-xs font-bold text-on-surface mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className={`text-sm font-black ${entry.dataKey === 'expenses' ? 'text-error' : 'text-primary'} mb-1`}>
            {entry.dataKey === 'expenses' ? 'Chi: ' : 'Thu: '}
            {formatFullVND(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AreaChart = ({ expenseData, incomeData }) => {
  const chartData = transformDailyData(expenseData, incomeData);

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full mt-4 flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">Chưa có dữ liệu giao dịch trong khoảng thời gian này.</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RechartsAreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorIncomes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#005ab6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#005ab6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c1c6d5" strokeOpacity={0.2} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#727785', fontSize: 10, fontWeight: 700 }} 
            dy={10}
          />
          <YAxis 
            hide 
            domain={['dataMin - 1000', 'dataMax + 1000']} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            stroke="#ba1a1a" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpenses)" 
            animationDuration={800}
          />
          <Area 
            type="monotone" 
            dataKey="incomes" 
            stroke="#005ab6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorIncomes)" 
            animationDuration={800}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaChart;
