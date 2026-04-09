"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SeriesConfig {
  dataKey: string;
  label: string;
  color: string;
}

interface TrendChartProps {
  title: string;
  data: Record<string, unknown>[];
  series: SeriesConfig[];
  yDomain?: [number | "auto", number | "auto"];
}

function ChartTooltipContent({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
  series: SeriesConfig[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-card px-3 py-2 ring-1 ring-border shadow-lg">
      <p className="text-fluid-xs text-muted-foreground mb-1.5">{label}</p>
      {payload.map((entry) => {
        const config = series.find((s) => s.dataKey === entry.dataKey);
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: config?.color }}
            />
            <span className="text-fluid-xs text-muted-foreground">
              {config?.label}:
            </span>
            <span className="font-data text-fluid-xs text-foreground">
              {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TrendChart({ title, data, series, yDomain }: TrendChartProps) {
  return (
    <Card className="border-0 bg-surface-1">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-fluid-sm font-normal tracking-wide uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <defs>
                {series.map((s) => (
                  <linearGradient
                    key={s.dataKey}
                    id={`grad-${s.dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6B7280", fontSize: 11 }}
                domain={yDomain ?? ["auto", "auto"]}
                width={36}
              />
              <RechartsTooltip
                content={
                  <ChartTooltipContent series={series} />
                }
                cursor={{ stroke: "#E5E8EB", strokeWidth: 1 }}
              />
              {series.map((s) => (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  stroke={s.color}
                  strokeWidth={1.5}
                  fill={`url(#grad-${s.dataKey})`}
                  dot={false}
                  activeDot={{
                    r: 3,
                    fill: s.color,
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center gap-4">
          {series.map((s) => (
            <div key={s.dataKey} className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-fluid-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
