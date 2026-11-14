"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisTick, chart, tooltipStyle } from "@/lib/chartTheme";

type Row = { x: string; y: number; label?: string; note?: string };

type Props = {
  data: Row[];
  color?: string;
  unit: string; // e.g. "films"
  height?: number;
  minTickGap?: number;
};

/** One-series bar chart with hover tooltips. Rows: x = axis label, y = value, label = tooltip title. */
export function SimpleBarChart({ data, color = chart.accent, unit, height = 240, minTickGap = 8 }: Props) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={chart.grid} />
          <XAxis dataKey="x" tick={axisTick} tickLine={false} axisLine={false} minTickGap={minTickGap} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <Tooltip
            {...tooltipStyle}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            labelFormatter={(_, p) => p?.[0]?.payload?.label ?? p?.[0]?.payload?.x}
            formatter={(v, _n, item) => [`${v} ${unit}${item?.payload?.note ? ` · ${item.payload.note}` : ""}`, ""]}
            separator=""
          />
          <Bar dataKey="y" fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
