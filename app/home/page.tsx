import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/logoutButton";
import Image from "next/image";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-primary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center gap-4">
              <Image src="/logo.svg" alt="FinTrack"  width={40} height={40} />
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
          <Card className="border-primary/20 bg-background">
            <CardHeader>
              <CardTitle className="text-3xl text-foreground">
                Bem-vindo, {nome} {sobrenome}! 👋
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 text-lg">
                Sua conta foi configurada com sucesso. Em breve você poderá gerenciar suas finanças aqui.
              </p>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-primary/20 bg-background/50">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <span className="text-primary">📧</span>
                  E-mail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">{user.email}</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-background/50">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <span className="text-primary">✅</span>
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary font-semibold">Conta Ativa</p>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                Em breve...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-foreground/70">
                <li className="flex items-center gap-2">
                  <span className="text-primary">▸</span>
                  Dashboard com visão geral das finanças
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">▸</span>
                  Controle de receitas e despesas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">▸</span>
                  Gráficos e relatórios detalhados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">▸</span>
                  Categorização automática
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}