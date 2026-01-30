import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Lock, Smartphone } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/20 mb-20">
      <div className="h-6 bg-primary">
      </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center gap-5">
              <Image src="/logo.svg" alt="FinTrack" width={40} height={40} />
            <h1 className="text-2xl font-bold text-primary">FinTrack</h1>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background">
                  Fazer Login
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button className="bg-primary text-background hover:bg-primary/90">
                  Cadastre-se
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
              Gerencie suas finanças com
              <span className="text-primary block mt-2">simplicidade</span>
            </h2>
            <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto">
              Controle suas receitas e despesas de forma fácil e intuitiva.
              Tenha o controle total do seu dinheiro.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/cadastro">
              <Button size="lg" className="bg-primary text-background hover:bg-primary/90 w-full sm:w-auto">
                Comece Agora Gratuitamente
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background w-full sm:w-auto">
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg border border-primary/20 bg-background/50 text-center flex flex-col items-center">
              <div className="text-primary text-3xl mb-3"><BarChart3 size={32} /></div>
              <h3 className="text-lg font-semibold text-primary mb-2">Controle Total</h3>
              <p className="text-foreground/70 text-sm">
                Visualize todas as suas transações em um só lugar
              </p>
            </div>
            <div className="p-6 rounded-lg border border-primary/20 bg-background/50 text-center flex flex-col items-center">
              <div className="text-primary text-3xl mb-3"><Lock size={32} /></div>
              <h3 className="text-lg font-semibold text-primary mb-2">Seguro</h3>
              <p className="text-foreground/70 text-sm">
                Seus dados protegidos com as melhores tecnologias
              </p>
            </div>
            <div className="p-6 rounded-lg border border-primary/20 bg-background/50 text-center flex flex-col items-center">
              <div className="text-primary text-3xl mb-3"><Smartphone size={32} /></div>
              <h3 className="text-lg font-semibold text-primary mb-2">Responsivo</h3>
              <p className="text-foreground/70 text-sm">
                Acesse de qualquer dispositivo, em qualquer lugar
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-primary mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-background text-sm font-bold">
            © 2025 FinTrack. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}