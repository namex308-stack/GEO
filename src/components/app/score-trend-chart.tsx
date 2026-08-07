"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/lib/i18n";

export type ScoreTrendPoint = {
  label: string;
  score: number;
  date: string;
};

/** Isolated recharts chart — dynamically imported to keep dashboard chunk smaller. */
export function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  const t = useT();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={28}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          width={36}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card-hover)",
          }}
          formatter={(value: number) => [value, t("dashboard.storeScore")]}
          labelFormatter={(label, payload) => {
            const raw = payload?.[0]?.payload?.date as string | undefined;
            if (!raw) return String(label);
            try {
              return new Date(raw).toLocaleString("ar", {
                dateStyle: "medium",
                timeStyle: "short",
              });
            } catch {
              return String(label);
            }
          }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          fill="url(#scoreFill)"
          activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
