import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, dataKey = 'value', color = '#6366f1', width = 80, height = 24 }) {
  if (!data || data.length < 2) return null;
  return (
    <div style={{ width, height }} className="inline-block" aria-hidden="true"
         title={`Trend: ${data[0]?.value ?? '?'} \u2192 ${data[data.length - 1]?.value ?? '?'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
