import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/logoutButton";
import Image from "next/image";
import Link from "next/link";
import { DollarSign, ArrowRight, TrendingDown, Wallet } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-primary/20">
        <div className="bg-primary h-6"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center gap-4">
              <Image src="/logo.svg" alt="FinTrack" width={40} height={40} />
              <h1 className="text-2xl font-bold text-primary">FinTrack</h1>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          
            {/* Welcome Card */}
            <Card className="border-none bg-background ">
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
            </Card>

            {/* Card Saldo */}
            <Card className="border-primary bg-background/50">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <Wallet className="text-foreground" size={24} />
                  Saldo do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-3xl font-bold ${saldoMes >= 0 ? "text-primary" : "text-red-500"}`}
                >
                  {saldoMes.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </CardContent>
            </Card>
          
          {/* Cards financeiros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/home/entradas">
              <Card className="border-primary bg-background/50 hover:ring-2 hover:ring-primary cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground flex items-center gap-2">
                    <DollarSign className="text-primary" size={24} />
                    Entradas do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-primary">
                      {totalMes.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <div className="relative group">
                      <ArrowRight className="text-primary" size={24} />
                      <span className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap rounded bg-primary text-background text-xs font-semibold px-2 py-1 pointer-events-none">
                        Gerenciar Entradas
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/home/gastos">
              <Card className="border-primary bg-background/50 hover:ring-2 hover:ring-primary cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500" size={24} />
                    Gastos do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-red-500">
                      {totalGastosMes.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <div className="relative group">
                      <ArrowRight className="text-red-500" size={24} />
                      <span className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap rounded bg-primary text-background text-xs font-semibold px-2 py-1 pointer-events-none">
                        Gerenciar Gastos
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
