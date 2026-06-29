"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCurrency } from "@/lib/ledger-store";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/constants";
import type { CategorySlice, MonthlyPoint } from "@/lib/selectors";
import { BarChart3 } from "lucide-react";

function ChartCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Add records to see this chart come to life."
            className="border-0 py-10"
          />
        ) : (
          <div className="h-64 w-full text-muted-foreground">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function useTooltipFormatter() {
  const currency = useCurrency();
  return (value: number | string) => formatCurrency(Number(value), currency);
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--card-foreground)",
  fontSize: 12,
  boxShadow: "var(--shadow-card)",
};

const axisProps = {
  stroke: "currentColor",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export function MonthlyExpensesChart({ data }: { data: MonthlyPoint[] }) {
  const currency = useCurrency();
  const fmt = useTooltipFormatter();
  const empty = data.every((d) => d.expense === 0);
  return (
    <ChartCard title="Monthly Expenses" empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis
            {...axisProps}
            tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={tooltipStyle}
            formatter={(v) => [fmt(v as number), "Expense"]}
          />
          <Bar dataKey="expense" fill={CATEGORY_COLORS.Bills} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MonthlyCollectionsChart({ data }: { data: MonthlyPoint[] }) {
  const currency = useCurrency();
  const fmt = useTooltipFormatter();
  const empty = data.every((d) => d.received === 0);
  return (
    <ChartCard title="Monthly Collections" empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis
            {...axisProps}
            tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={tooltipStyle}
            formatter={(v) => [fmt(v as number), "Received"]}
          />
          <Bar dataKey="received" fill="#22c55e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function IncomeVsExpenseChart({ data }: { data: MonthlyPoint[] }) {
  const currency = useCurrency();
  const fmt = useTooltipFormatter();
  const empty = data.every((d) => d.received === 0 && d.expense === 0);
  return (
    <ChartCard title="Income vs Expense" empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis
            {...axisProps}
            tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={tooltipStyle}
            formatter={(v, n) => [fmt(v as number), n === "received" ? "Income" : "Expense"]}
          />
          <Legend
            formatter={(v) => (v === "received" ? "Income" : "Expense")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="received" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#f97316" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CashFlowChart({ data }: { data: MonthlyPoint[] }) {
  const currency = useCurrency();
  const fmt = useTooltipFormatter();
  const empty = data.every((d) => d.net === 0);
  return (
    <ChartCard title="Monthly Cash Flow" empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="cashflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis
            {...axisProps}
            tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [fmt(v as number), "Net flow"]}
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#cashflow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CategoryPieChart({ data }: { data: CategorySlice[] }) {
  const fmt = useTooltipFormatter();
  const empty = data.length === 0;
  return (
    <ChartCard title="Expenses by Category" empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            stroke="var(--card)"
          >
            {data.map((slice) => (
              <Cell key={slice.category} fill={CATEGORY_COLORS[slice.category]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v, n) => [fmt(v as number), n as string]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
