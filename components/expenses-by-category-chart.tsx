"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#14b8a6",
];

type CategoryData = {
  categoria: string;
  total: number;
};

export function ExpensesByCategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <p className="text-foreground/50 text-center py-8">
        Nenhum gasto registrado este mês.
      </p>
    );
  }

  const chartConfig = data.reduce<ChartConfig>((acc, item, index) => {
    acc[item.categoria] = {
      label: item.categoria,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {});

  const chartData = data.map((item, index) => ({
    name: item.categoria,
    value: item.total,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto max-h-[300px]">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                Number(value).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              }
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
