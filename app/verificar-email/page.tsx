"use client";

import { useState, useEffect, Suspense } from "react";
import { Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/auth-header";

function VerificarEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Pega o email da URL (se passado pelo login)
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }

    // Verifica se já está autenticado e confirmado
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        // Se já confirmou, redireciona para home
        router.push('/home');
      }
    };

    checkUser();
  }, [searchParams, router]);

  useEffect(() => {
    // Countdown para cooldown
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'E-mail de confirmação enviado com sucesso! Verifique sua caixa de entrada.'
      });

      // Define cooldown de 60 segundos
      setCooldown(60);

    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao enviar e-mail. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 sm:px-6 lg:px-8">
      <AuthHeader />

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="border-primary border-2 bg-background">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Confirme seu e-mail</CardTitle>
            <CardDescription className="text-foreground/70">
              Enviamos um e-mail de confirmação para <span className="font-semibold text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-foreground/80">
                  <p className="font-semibold mb-1">Verifique sua caixa de entrada</p>
                  <p>Clique no link de confirmação enviado para ativar sua conta.</p>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm border ${
                message.type === 'success'
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : message.type === 'error'
                  ? 'bg-red-500/10 text-red-500 border-red-500/30'
                  : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                className="w-full bg-primary text-background font-semibold hover:bg-primary/90"
                disabled={loading || cooldown > 0}
              >
                {loading
                  ? "Enviando..."
                  : cooldown > 0
                  ? `Aguarde ${cooldown}s para reenviar`
                  : "Reenviar e-mail de confirmação"}
              </Button>

              <div className="text-center text-sm text-foreground/70 space-y-1">
                <p>Não recebeu o e-mail? Verifique sua pasta de spam.</p>
                <Link href="/login" className="text-primary hover:underline font-semibold block">
                  Voltar para o login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Carregando...</p>
        </div>
      </div>
    }>
      <VerificarEmailContent />
    </Suspense>
  );
}
