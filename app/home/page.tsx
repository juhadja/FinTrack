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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { DollarSign, ArrowRight, TrendingDown, Wallet, CreditCard, CalendarRange, Calendar } from "lucide-react";
import { ExpensesByCategoryChart } from "@/components/expenses-by-category-chart";
import { ExpensesByPaymentMethodChart } from "@/components/expenses-by-payment-method-chart";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ChartPeriod = "all" | string; // "all" ou "yyyy-MM" para meses específicos

export default function HomePage() {
  const router = useRouter();

  const [nome, setNome] = useState("Usuário");
  const [sobrenome, setSobrenome] = useState("");
  const [totalMes, setTotalMes] = useState(0);
  const [totalGastosMes, setTotalGastosMes] = useState(0);
  const [saldoMes, setSaldoMes] = useState(0);
  const [chartData, setChartData] = useState<{ categoria: string; total: number }[]>([]);
  const [paymentMethodChartData, setPaymentMethodChartData] = useState<{ formaPagamento: string; total: number }[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(() => {
    if (typeof window === 'undefined') return "all";
    return format(new Date(), "yyyy-MM");
  });
  const [loading, setLoading] = useState(true);
  const [proximasParcelas, setProximasParcelas] = useState<Record<string, Array<{
    id: string;
    valor: number;
    descricao: string;
    numero_parcela_atual: number;
    numero_parcelas: number;
    categoria: string;
  }>>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setNome(user.user_metadata?.nome || "Usuário");
      setSobrenome(user.user_metadata?.sobrenome || "");
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      // Buscar total de entradas do mês atual (para os cards fixos)
      const { data: entradasMes } = await supabase
        .from("entradas")
        .select("valor")
        .gte("data", firstDayOfMonth)
        .lte("data", lastDayOfMonth);

      const totalEntradasMes = entradasMes?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0;
      setTotalMes(totalEntradasMes);

      // Buscar total de gastos do mês atual (para os cards fixos)
      const { data: gastosMes } = await supabase
        .from("gastos")
        .select("valor")
        .gte("data", firstDayOfMonth)
        .lte("data", lastDayOfMonth);

      const totalGastos = gastosMes?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0;
      setTotalGastosMes(totalGastos);
      setSaldoMes(totalEntradasMes - totalGastos);

      // Buscar todos os meses disponíveis
      const { data: todosGastos } = await supabase
        .from("gastos")
        .select("data")
        .order("data", { ascending: false });

      const mesesSet = new Set<string>();
      todosGastos?.forEach((gasto) => {
        const mesAno = format(new Date(gasto.data + "T00:00:00"), "yyyy-MM");
        mesesSet.add(mesAno);
      });
      const mesesArray = Array.from(mesesSet).sort();
      setMesesDisponiveis(mesesArray);

      // Determinar o período para os gráficos
      let firstDayPeriod = "";
      let lastDayPeriod = "";

      if (chartPeriod !== "all") {
        // Filtrar por mês específico
        const [ano, mes] = chartPeriod.split("-");
        const anoNum = parseInt(ano);
        const mesNum = parseInt(mes) - 1;
        firstDayPeriod = new Date(anoNum, mesNum, 1).toISOString().split("T")[0];
        lastDayPeriod = new Date(anoNum, mesNum + 1, 0).toISOString().split("T")[0];
      }

      // Buscar gastos por categoria (baseado no período selecionado)
      let gastosPorCategoriaQuery = supabase
        .from("gastos")
        .select("valor, categorias_gastos(nome)");

      if (chartPeriod !== "all") {
        gastosPorCategoriaQuery = gastosPorCategoriaQuery
          .gte("data", firstDayPeriod)
          .lte("data", lastDayPeriod);
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

      if (chartPeriod !== "all") {
        gastosPorFormaPagamentoQuery = gastosPorFormaPagamentoQuery
          .gte("data", firstDayPeriod)
          .lte("data", lastDayPeriod);
      }

      const { data: gastosPorFormaPagamento } = await gastosPorFormaPagamentoQuery;

      const formasPagamentoMap = new Map<string, number>();
      gastosPorFormaPagamento?.forEach((g) => {
        const nome = (g.formas_pagamento as unknown as { nome: string })?.nome || "Sem forma de pagamento";
        formasPagamentoMap.set(nome, (formasPagamentoMap.get(nome) || 0) + Number(g.valor));
      });
      const paymentData = Array.from(formasPagamentoMap, ([formaPagamento, total]) => ({ formaPagamento, total }));
      setPaymentMethodChartData(paymentData);

      // Buscar próximas parcelas (gastos parcelados com data futura)
      const hoje = new Date().toISOString().split("T")[0];
      const { data: parcelasFuturas } = await supabase
        .from("gastos")
        .select("id, valor, descricao, data, numero_parcela_atual, numero_parcelas, categorias_gastos(nome)")
        .eq("eh_parcelado", true)
        .gte("data", hoje)
        .order("data", { ascending: true });

      // Agrupar parcelas por mês
      const parcelasPorMes: Record<string, Array<{
        id: string;
        valor: number;
        descricao: string;
        numero_parcela_atual: number;
        numero_parcelas: number;
        categoria: string;
      }>> = {};

      parcelasFuturas?.forEach((parcela) => {
        const mesAno = format(new Date(parcela.data + "T00:00:00"), "yyyy-MM");
        if (!parcelasPorMes[mesAno]) {
          parcelasPorMes[mesAno] = [];
        }
        parcelasPorMes[mesAno].push({
          id: parcela.id,
          valor: parcela.valor,
          descricao: parcela.descricao || "Sem descrição",
          numero_parcela_atual: parcela.numero_parcela_atual || 1,
          numero_parcelas: parcela.numero_parcelas || 1,
          categoria: (parcela.categorias_gastos as unknown as { nome: string })?.nome || "Sem categoria",
        });
      });

      setProximasParcelas(parcelasPorMes);

      setLoading(false);
    };

    fetchData();
  }, [chartPeriod]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={nome} userLastName={sobrenome} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="space-y-8">
          {/* Card Saldo */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
              <Card className="border-primary/30 bg-primary/10 col-span-2">
                <CardHeader>
                  <CardDescription className="text-xs sm:text-sm mb-2">
                    <Skeleton className="h-4 w-16" />
                  </CardDescription>
                  <CardTitle className="mb-4">
                    <Skeleton className="h-9 sm:h-11 lg:h-14 w-32 sm:w-40" />
                  </CardTitle>
                  <CardAction className="flex flex-col gap-2 items-end">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-xs sm:text-sm">
                  <Skeleton className="h-4 w-36" />
                </CardFooter>
              </Card>
              <Card className="border-primary bg-background/50 col-span-2 md:col-span-1 h-full">
                <CardHeader>
                  <CardDescription className="text-xs sm:text-sm mb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardDescription>
                  <CardTitle className="mb-4">
                    <Skeleton className="h-7 sm:h-8 lg:h-10 w-28 sm:w-32" />
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-between text-xs sm:text-sm">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4" />
                </CardFooter>
              </Card>
              <Card className="border-primary bg-background/50 col-span-2 md:col-span-1 h-full">
                <CardHeader>
                  <CardDescription className="text-xs sm:text-sm mb-2">
                    <Skeleton className="h-4 w-28" />
                  </CardDescription>
                  <CardTitle className="mb-4">
                    <Skeleton className="h-7 sm:h-8 lg:h-10 w-28 sm:w-32" />
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-between text-xs sm:text-sm">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-4" />
                </CardFooter>
              </Card>
            </div>
          ) : (
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
          )}

          {/* Toggle de Período e Gráficos de Gastos */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl text-foreground font-semibold">Distribuição de Gastos</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select
                  value={chartPeriod === "all" ? "" : chartPeriod}
                  onValueChange={(value) => setChartPeriod(value)}
                >
                  <SelectTrigger className="flex-1 sm:w-50 bg-background border-primary/30 text-foreground focus:border-primary cursor-pointer">
                    <SelectValue placeholder="Selecione um mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-primary/30">
                    {mesesDisponiveis.map((mesAno) => {
                      const [ano, mes] = mesAno.split("-");
                      const data = new Date(parseInt(ano), parseInt(mes) - 1);
                      const nomeMes = format(data, "MMMM 'de' yyyy", { locale: ptBR });
                      const nomeFormatado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
                      return (
                        <SelectItem key={mesAno} value={mesAno} className="cursor-pointer text-primary">
                          {nomeFormatado}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant={chartPeriod === "all" ? "default" : "outline"}
                  onClick={() => setChartPeriod("all")}
                  className={`shrink-0 ${chartPeriod === "all" ? "bg-primary text-background" : "border-primary text-primary hover:bg-primary hover:text-background"}`}
                  size="sm"
                >
                  <CalendarRange size={14} className="mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Todo Período</span>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-primary bg-background/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base lg:text-lg">
                      <Skeleton className="h-5 sm:h-6 w-48" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="h-75 w-full rounded-lg" />
                  </CardContent>
                </Card>
                <Card className="border-primary bg-background/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-base lg:text-lg">
                      <Skeleton className="h-5 sm:h-6 w-56" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="h-75 w-full rounded-lg" />
                  </CardContent>
                </Card>
              </div>
            ) : (
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
            )}
          </div>

          {/* Seção de Próximas Parcelas */}
          {Object.keys(proximasParcelas).length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl text-foreground font-semibold flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                Próximas Parcelas
              </h3>

              {loading || !mounted ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border border-primary/20 bg-background/50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Accordion type="multiple" className="w-full space-y-2">
                  {Object.entries(proximasParcelas)
                    .sort(([mesA], [mesB]) => mesA.localeCompare(mesB))
                    .map(([mesAno, parcelas]) => {
                      const [ano, mes] = mesAno.split("-");
                      const data = new Date(parseInt(ano), parseInt(mes) - 1);
                      const nomeMes = format(data, "MMMM 'de' yyyy", { locale: ptBR });
                      const nomeFormatado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
                      const totalMes = parcelas.reduce((acc, p) => acc + p.valor, 0);

                      return (
                        <AccordionItem
                          key={mesAno}
                          value={mesAno}
                          className="border border-primary bg-background rounded-lg px-4 "
                        >
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="text-base sm:text-lg text-foreground font-semibold">
                                {nomeFormatado}
                              </span>
                              <Badge variant="outline" className="border-red-500 text-red-500">
                                {totalMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-3 pt-2">
                              {parcelas.map((parcela) => (
                                <div
                                  key={parcela.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-primary/20  bg-primary/5 transition-colors"
                                >
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground text-sm sm:text-base">
                                      {parcela.descricao}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                        {parcela.categoria}
                                      </Badge>
                                      <span className="text-xs text-foreground/60">
                                        Parcela {parcela.numero_parcela_atual}/{parcela.numero_parcelas}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-red-500 text-sm sm:text-base">
                                      {parcela.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                </Accordion>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
