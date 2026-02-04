"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type MonthData = {
  mes: string;
  entradas: number;
  gastos: number;
};

const chartConfig = {
  entradas: {
    label: "Entradas",
    color: "#22c55e",
  },
  gastos: {
    label: "Gastos",
    color: "#ef4444",
  },
} satisfies ChartConfig;

export function IncomeExpensesLineChart({ data }: { data: MonthData[] }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (data.length === 0) {
    return (
      <p className="text-foreground/50 text-center py-8">
        Nenhum dado disponível.
      </p>
    );
  }

  return (
    <div className="w-full">
      <ChartContainer
        config={chartConfig}
        className={isMobile ? "h-[250px] min-w-[700px]" : "w-full h-[300px]"}
      >
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: isMobile ? 10 : 10,
            left: isMobile ? 10 : 10,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="mes"
            stroke="hsl(var(--foreground))"
            fontSize={isMobile ? 11 : 12}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? "end" : "middle"}
            height={isMobile ? 50 : 30}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            fontSize={isMobile ? 10 : 12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              isMobile ? `${(value / 1000).toFixed(0)}k` : `R$ ${(value / 1000).toFixed(0)}k`
            }
            width={isMobile ? 45 : 60}
          />
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
          <ChartLegend
            content={<ChartLegendContent />}
            wrapperStyle={{
              fontSize: isMobile ? '12px' : '14px',
              paddingTop: isMobile ? '10px' : '0px'
            }}
          />
          <Line
            type="monotone"
            dataKey="entradas"
            stroke={chartConfig.entradas.color}
            strokeWidth={isMobile ? 2 : 2}
            dot={{ fill: chartConfig.entradas.color, r: isMobile ? 3 : 4 }}
            activeDot={{ r: isMobile ? 5 : 6 }}
          />
          <Line
            type="monotone"
            dataKey="gastos"
            stroke={chartConfig.gastos.color}
            strokeWidth={isMobile ? 2 : 2}
            dot={{ fill: chartConfig.gastos.color, r: isMobile ? 3 : 4 }}
            activeDot={{ r: isMobile ? 5 : 6 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
