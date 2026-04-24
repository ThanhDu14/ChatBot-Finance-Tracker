import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T2', expenses: 4000 },
  { name: 'T3', expenses: 3000 },
  { name: 'T4', expenses: 2000 },
  { name: 'T5', expenses: 2780 },
  { name: 'T6', expenses: 1890 },
  { name: 'T7', expenses: 2390 },
  { name: 'CN', expenses: 3490 },
];

const AreaChart = () => {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
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
          <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#191c1e' }}
            itemStyle={{ color: '#005ab6', fontWeight: 'bold' }}
            formatter={(value) => [`$${value}`, 'Chi tiêu']}
          />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            stroke="#005ab6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpenses)" 
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaChart;
