import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { DollarSign, ArrowRight, TrendingDown, Wallet, Car } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ExpensesByCategoryChart } from "@/components/expenses-by-category-chart";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nome = user.user_metadata?.nome || "Usuário";
  const sobrenome = user.user_metadata?.sobrenome || "";

  // Buscar total de entradas do mês atual
  const now = new Date();
  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const lastDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).toISOString();

  const { data: entradasMes } = await supabase
    .from("entradas")
    .select("valor")
    .gte("data", firstDayOfMonth.split("T")[0])
    .lte("data", lastDayOfMonth.split("T")[0]);

  const totalMes =
    entradasMes?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0;

  // Buscar total de gastos do mês atual
  const { data: gastosMes } = await supabase
    .from("gastos")
    .select("valor")
    .gte("data", firstDayOfMonth.split("T")[0])
    .lte("data", lastDayOfMonth.split("T")[0]);

  const totalGastosMes =
    gastosMes?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0;
  const saldoMes = totalMes - totalGastosMes;

  // Buscar gastos por categoria do mês atual
  const { data: gastosPorCategoria } = await supabase
    .from("gastos")
    .select("valor, categorias_gastos(nome)")
    .gte("data", firstDayOfMonth.split("T")[0])
    .lte("data", lastDayOfMonth.split("T")[0]);

  const categoriasMap = new Map<string, number>();
  gastosPorCategoria?.forEach((g) => {
    const nome =
      (g.categorias_gastos as unknown as { nome: string })?.nome ||
      "Sem categoria";
    categoriasMap.set(nome, (categoriasMap.get(nome) || 0) + Number(g.valor));
  });
  const chartData = Array.from(categoriasMap, ([categoria, total]) => ({
    categoria,
    total,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center p-4 border-b border-primary/30 justify-between px-10">
        <div className="flex gap-2 items-center xl:hidden ">
          <SidebarTrigger size='lg'/>
          <h1 className="text-2xl font-bold text-primary">FinTrack</h1>
        </div>
        <h1 className="text-2xl font-bold text-primary hidden xl:block">FinTrack</h1>
        <div className="hidden md:flex gap-2 items-center">
          <p>Bem vindo,</p>
          <Badge className="bg-foreground/20 text-foreground text-sm font-normal">
            <p className="mx-1">
              {nome} {sobrenome}
            </p>
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Card */}
          {/* <Card className="border-none bg-background ">
            <CardHeader className="justify-center">
              <CardTitle className="text-5xl text-foreground ">
                Bem-vindo,
                <strong className="text-primary">
                  {" "}
                  {nome} {sobrenome}
                </strong>
                !
              </CardTitle>
            </CardHeader>
            <CardContent className="mx-auto">
              <p className="text-foreground/70 text-lg">
                Gerencie suas finanças de forma simples e prática.
              </p>
            </CardContent>
          </Card> */}

          {/* Card Saldo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
          <Card className="border-primary/30 bg-primary/10 col-span-2">
            <CardHeader>
              <CardDescription className=" text-foreground flex items-center gap-4 ">
                <Wallet className="text-foreground" size={16} />
                Saldo
              </CardDescription>
              <CardTitle>
                <p
                  className={`text-4xl font-semibold ${saldoMes >= 0 ? "text-primary" : "text-red-500"}`}
                >
                  {saldoMes.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </CardTitle>
              <CardAction className="flex flex-col gap-3 items-end">
                <Badge variant="outline" className="border-primary">
                  <p className="text-primary">
                    {" "}
                    +
                    {totalMes.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </Badge>
                <Badge variant="outline" className="border-red-500">
                  <p className="text-red-500">
                    {" "}
                    -
                    {totalGastosMes.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="text-foreground/70 flex gap-2">
                Saldo atual do mês
              </div>
            </CardFooter>
          </Card>
          <Link href="/home/entradas" className="col-span-2 md:col-span-1">
              <Card className="border-primary bg-background/50 hover:ring-2 hover:ring-primary cursor-pointer">
                <CardHeader>
                  <CardDescription className="text-foreground flex items-center gap-2">
                    <DollarSign className="text-primary" size={20} />
                    Entradas do Mês
                  </CardDescription>
                  <CardTitle>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-primary">
                      {totalMes.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </CardTitle>
                </CardHeader>
                    <CardFooter className="flex justify-between">
                      <p>Gerenciar Entradas</p>
                      <ArrowRight className="text-primary" size={20} />
                    </CardFooter> 
              </Card>
            </Link>
            <Link href="/home/gastos" className="col-span-2 md:col-span-1">
              <Card className="border-primary bg-background/50 hover:ring-2 hover:ring-primary cursor-pointer">
                <CardHeader>
                  <CardDescription className="text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500" size={20} />
                    Gastos do Mês
                  </CardDescription>
                  <CardTitle>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-red-500">
                      {totalGastosMes.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-between">
                      <p>Gerenciar Gastos</p>
                      <ArrowRight className="text-red-500" size={20} />
                    </CardFooter> 
              </Card>
            </Link>
          </div>

          {/* Gráfico de Gastos por Categoria */}
          <Card className="border-primary bg-background/50 hover:bg-primary/10">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                <TrendingDown className="text-red-500" size={2} />
                Gastos por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensesByCategoryChart data={chartData} />
            </CardContent>
          </Card>

          {/* Cards financeiros */}
        </div>
      </main>
    </div>
  );
}
