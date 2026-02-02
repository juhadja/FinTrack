"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ArrowRight, TrendingDown, Wallet, CreditCard, Calendar, CalendarRange } from "lucide-react";
import { ExpensesByCategoryChart } from "@/components/expenses-by-category-chart";
import { ExpensesByPaymentMethodChart } from "@/components/expenses-by-payment-method-chart";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";

type ChartPeriod = "month" | "all";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("Usuário");
  const [sobrenome, setSobrenome] = useState("");
  const [totalMes, setTotalMes] = useState(0);
  const [totalGastosMes, setTotalGastosMes] = useState(0);
  const [saldoMes, setSaldoMes] = useState(0);
  const [chartData, setChartData] = useState<{ categoria: string; total: number }[]>([]);
  const [paymentMethodChartData, setPaymentMethodChartData] = useState<{ formaPagamento: string; total: number }[]>([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("month");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setNome(user.user_metadata?.nome || "Usuário");
      setSobrenome(user.user_metadata?.sobrenome || "");
    };

    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      // Buscar total de entradas do mês atual
      const { data: entradasMes } = await supabase
        .from("entradas")
        .select("valor")
        .gte("data", firstDayOfMonth)
        .lte("data", lastDayOfMonth);

      const totalEntradasMes = entradasMes?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0;
      setTotalMes(totalEntradasMes);

      // Buscar total de gastos do mês atual
      const { data: gastosMes } = await supabase
        .from("gastos")
        .select("valor")
        .gte("data", firstDayOfMonth)
        .lte("data", lastDayOfMonth);

      const totalGastos = gastosMes?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0;
      setTotalGastosMes(totalGastos);
      setSaldoMes(totalEntradasMes - totalGastos);

      // Buscar gastos por categoria (baseado no período selecionado)
      let gastosPorCategoriaQuery = supabase
        .from("gastos")
        .select("valor, categorias_gastos(nome)");

      if (chartPeriod === "month") {
        gastosPorCategoriaQuery = gastosPorCategoriaQuery
          .gte("data", firstDayOfMonth)
          .lte("data", lastDayOfMonth);
      }

      const { data: gastosPorCategoria } = await gastosPorCategoriaQuery;

      const categoriasMap = new Map<string, number>();
      gastosPorCategoria?.forEach((g) => {
        const nome = (g.categorias_gastos as unknown as { nome: string })?.nome || "Sem categoria";
        categoriasMap.set(nome, (categoriasMap.get(nome) || 0) + Number(g.valor));
      });
      const categoryData = Array.from(categoriasMap, ([categoria, total]) => ({ categoria, total }));
      setChartData(categoryData);

      // Buscar gastos por forma de pagamento (baseado no período selecionado)
      let gastosPorFormaPagamentoQuery = supabase
        .from("gastos")
        .select("valor, formas_pagamento(nome)");

      if (chartPeriod === "month") {
        gastosPorFormaPagamentoQuery = gastosPorFormaPagamentoQuery
          .gte("data", firstDayOfMonth)
          .lte("data", lastDayOfMonth);
      }

      const { data: gastosPorFormaPagamento } = await gastosPorFormaPagamentoQuery;

      const formasPagamentoMap = new Map<string, number>();
      gastosPorFormaPagamento?.forEach((g) => {
        const nome = (g.formas_pagamento as unknown as { nome: string })?.nome || "Sem forma de pagamento";
        formasPagamentoMap.set(nome, (formasPagamentoMap.get(nome) || 0) + Number(g.valor));
      });
      const paymentData = Array.from(formasPagamentoMap, ([formaPagamento, total]) => ({ formaPagamento, total }));
      setPaymentMethodChartData(paymentData);
    };

    fetchData();
  }, [supabase, chartPeriod]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={nome} userLastName={sobrenome} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="space-y-8">
          {/* Card Saldo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
            <Card className="border-primary/30 bg-primary/10 col-span-2">
              <CardHeader>
                <CardDescription className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
                  <Wallet className="text-foreground" size={14} />
                  Saldo
                </CardDescription>
                <CardTitle>
                  <p className={`text-2xl sm:text-3xl lg:text-4xl font-semibold ${saldoMes >= 0 ? "text-primary" : "text-red-500"}`}>
                    {saldoMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </CardTitle>
                <CardAction className="flex flex-col gap-2 items-end">
                  <Badge variant="outline" className="border-primary text-xs">
                    <p className="text-primary">
                      +{totalMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </Badge>
                  <Badge variant="outline" className="border-red-500 text-xs">
                    <p className="text-red-500">
                      -{totalGastosMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
                <div className="text-foreground/70 flex gap-2">Saldo atual do mês</div>
              </CardFooter>
            </Card>
            <Link href="/home/entradas" className="col-span-2 md:col-span-1">
              <Card className="border-primary bg-background/50 hover:ring-2 hover:ring-primary cursor-pointer h-full">
                <CardHeader>
                  <CardDescription className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
                    <DollarSign className="text-primary" size={16} />
                    Entradas do Mês
                  </CardDescription>
                  <CardTitle>
                    <div className="flex items-center justify-between">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                        {totalMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-between text-xs sm:text-sm">
                  <p>Gerenciar Entradas</p>
                  <ArrowRight className="text-primary" size={18} />
                </CardFooter>
              </Card>
            </Link>
            <Link href="/home/gastos" className="col-span-2 md:col-span-1">
              <Card className="border-primary bg-background/50 hover:ring-2 hover:ring-primary cursor-pointer h-full">
                <CardHeader>
                  <CardDescription className="text-foreground flex items-center gap-2 text-xs sm:text-sm">
                    <TrendingDown className="text-red-500" size={16} />
                    Gastos do Mês
                  </CardDescription>
                  <CardTitle>
                    <div className="flex items-center justify-between">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-500">
                        {totalGastosMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-between text-xs sm:text-sm">
                  <p>Gerenciar Gastos</p>
                  <ArrowRight className="text-red-500" size={18} />
                </CardFooter>
              </Card>
            </Link>
          </div>

          {/* Toggle de Período e Gráficos de Gastos */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl text-foreground font-semibold">Distribuição de Gastos</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant={chartPeriod === "month" ? "default" : "outline"}
                  onClick={() => setChartPeriod("month")}
                  className={`flex-1 sm:flex-none ${chartPeriod === "month" ? "bg-primary text-background" : "border-primary text-primary hover:bg-primary hover:text-background"}`}
                  size="sm"
                >
                  <Calendar size={14} className="mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Mês Atual</span>
                </Button>
                <Button
                  variant={chartPeriod === "all" ? "default" : "outline"}
                  onClick={() => setChartPeriod("all")}
                  className={`flex-1 sm:flex-none ${chartPeriod === "all" ? "bg-primary text-background" : "border-primary text-primary hover:bg-primary hover:text-background"}`}
                  size="sm"
                >
                  <CalendarRange size={14} className="mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Todo Período</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Gráfico de Gastos por Categoria */}
              <Card className="border-primary bg-background/50 hover:bg-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500" size={16} />
                    Gastos por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ExpensesByCategoryChart data={chartData} />
                </CardContent>
              </Card>

              {/* Gráfico de Gastos por Forma de Pagamento */}
              <Card className="border-primary bg-background/50 hover:bg-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base lg:text-lg text-foreground flex items-center gap-2">
                    <CreditCard className="text-red-500" size={16} />
                    Gastos por Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ExpensesByPaymentMethodChart data={paymentMethodChartData} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
