import React, { useMemo } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Utensils, Car, ShoppingBag, Gamepad2, HeartPulse, GraduationCap, Zap, MoreHorizontal } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'An uong', label: 'Ăn uống', icon: Utensils, color: '#005ab6' },
  { key: 'Di chuyen', label: 'Di chuyển', icon: Car, color: '#006780' },
  { key: 'Mua sam', label: 'Mua sắm', icon: ShoppingBag, color: '#934700' },
  { key: 'Giai tri', label: 'Giải trí', icon: Gamepad2, color: '#7c5800' },
  { key: 'Y te', label: 'Y tế', icon: HeartPulse, color: '#ba1a1a' },
  { key: 'Giao duc', label: 'Giáo dục', icon: GraduationCap, color: '#4a6741' },
  { key: 'Tien ich', label: 'Tiện ích', icon: Zap, color: '#6b5778' },
  { key: 'Khac', label: 'Khác', icon: MoreHorizontal, color: '#727785' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function formatVND(amount) {
  if (amount == null) return '0 ₫';
  return `${Number(amount).toLocaleString('vi-VN')} ₫`;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { label, value, percent, fill } = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-outline-variant/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <span className="text-sm font-bold text-on-surface">{label}</span>
      </div>
      <p className="text-xs text-on-surface-variant">
        {formatVND(value)} — <strong>{percent}%</strong>
      </p>
    </div>
  );
};

// ─── PieChart Component ──────────────────────────────────────────────────────

/**
 * @param {{ categories: Object, loading: boolean }} props
 * categories: { "An uong": 1500000, "Di chuyen": 300000, ... }
 */
const CategoryPieChart = ({ categories = {}, loading = false }) => {
  const chartData = useMemo(() => {
    const entries = Object.entries(categories).filter(([, v]) => v > 0);
    if (entries.length === 0) return [];

    const total = entries.reduce((sum, [, v]) => sum + v, 0);

    return entries
      .map(([key, value]) => {
        const cat = CATEGORY_MAP[key] || CATEGORY_MAP['Khac'];
        return {
          name: key,
          label: cat.label,
          value,
          fill: cat.color,
          percent: Math.round((value / total) * 100),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [categories]);

  const totalSpending = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <MoreHorizontal className="w-10 h-10 text-outline mb-2" />
        <p className="text-sm text-on-surface-variant font-medium">Chưa có dữ liệu danh mục</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Chart */}
      <div className="w-full h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </RechartsPieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-on-surface-variant font-medium">Tổng</p>
          <p className="text-lg font-black text-on-surface">{formatVND(totalSpending)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {chartData.map((entry) => {
          const cat = CATEGORY_MAP[entry.name] || CATEGORY_MAP['Khac'];
          const Icon = cat.icon;
          return (
            <div key={entry.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                <Icon className="w-4 h-4 text-on-surface-variant" />
                <span className="text-sm font-medium text-on-surface">{entry.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-on-surface">{formatVND(entry.value)}</span>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded min-w-[36px] text-center">
                  {entry.percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPieChart;
