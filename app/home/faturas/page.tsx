"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AppHeader } from "@/components/app-header";

interface Fatura {
  id: string;
  nome: string;
  dia_fechamento: number;
  created_at: string;
}

interface Gasto {
  id: string;
  valor: number;
  data: string;
  descricao: string | null;
  categoria_id: string | null;
  forma_pagamento_id: string | null;
  fatura_id: string | null;
  // Campos de parcelamento
  eh_parcelado: boolean;
  numero_parcelas: number | null;
  numero_parcela_atual: number | null;
  valor_total_parcelamento: number | null;
  gasto_parcelado_grupo_id: string | null;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Componente para seletor de mês no mobile
function MobileMonthSelector({
  fatura,
  anoAtual,
  getGastosPorMes,
  calcularTotalMes,
  getPeriodoFatura,
  formatCurrency,
}: {
  fatura: Fatura;
  anoAtual: number;
  getGastosPorMes: (fatura: Fatura, mes: number, ano: number) => Gasto[];
  calcularTotalMes: (fatura: Fatura, mes: number, ano: number) => number;
  getPeriodoFatura: (diaFechamento: number, mes: number, ano: number) => { dataInicio: Date; dataFim: Date };
  formatCurrency: (value: number) => string;
}) {
  const mesAtual = new Date().getMonth();
  const [mesSelecionado, setMesSelecionado] = useState(String(mesAtual));
  const indexMes = parseInt(mesSelecionado);
  const gastosMes = getGastosPorMes(fatura, indexMes, anoAtual);
  const totalMes = calcularTotalMes(fatura, indexMes, anoAtual);
  const { dataInicio, dataFim } = getPeriodoFatura(fatura.dia_fechamento, indexMes, anoAtual);

  return (
    <div className="space-y-3">
      {/* Select de Mês */}
      <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
        <SelectTrigger className="w-full bg-background border-primary/30 text-foreground focus:border-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border-primary/30">
          {MESES.map((mes, index) => (
            <SelectItem key={index} value={String(index)} className="cursor-pointer text-primary">
              {mes}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Conteúdo do Mês */}
      <div className="space-y-2">
        {/* Informação do período */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
          <p className="text-[10px] text-foreground/70">
            Período: {format(dataInicio, "dd/MM/yyyy")} até {format(dataFim, "dd/MM/yyyy")}
          </p>
          <p className="text-base font-bold text-red-500 mt-1">
            Total: {formatCurrency(totalMes)}
          </p>
        </div>

        {/* Tabs de À vista vs Parcelamentos */}
        <Tabs defaultValue="avista" className="w-full">
          <TabsList className="w-full bg-background/50 border border-primary/20 mb-3">
            <TabsTrigger
              value="avista"
              className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs"
            >
              Compras à Vista
            </TabsTrigger>
            <TabsTrigger
              value="parcelamentos"
              className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs"
            >
              Parcelamentos
            </TabsTrigger>
          </TabsList>

          {/* Tab: À Vista */}
          <TabsContent value="avista" className="mt-0">
            {(() => {
              const gastosAvista = gastosMes.filter(g => !g.eh_parcelado || g.eh_parcelado === null || g.eh_parcelado === undefined);
              const totalAvista = gastosAvista.reduce((acc, g) => acc + Number(g.valor), 0);

              return (
                <div className="space-y-2">
                  <p className="text-xs text-foreground/70 px-1">
                    Total à vista: <span className="font-semibold text-red-500">{formatCurrency(totalAvista)}</span>
                  </p>
                  {gastosAvista.length === 0 ? (
                    <p className="text-foreground/50 text-center py-6 text-sm">
                      Nenhuma compra à vista neste período.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {gastosAvista.map((gasto) => (
                        <div
                          key={gasto.id}
                          className="border border-primary/50 rounded-lg p-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">
                              {gasto.descricao || "Sem descrição"}
                            </p>
                            <p className="text-xs text-foreground/60">
                              {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <p className="text-base font-bold text-red-500 shrink-0">
                            {formatCurrency(Number(gasto.valor))}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* Tab: Parcelamentos */}
          <TabsContent value="parcelamentos" className="mt-0">
            {(() => {
              const gastosParcelados = gastosMes.filter(g => g.eh_parcelado === true);
              const totalParcelado = gastosParcelados.reduce((acc, g) => acc + Number(g.valor), 0);

              return (
                <div className="space-y-2">
                  <p className="text-xs text-foreground/70 px-1">
                    Total em parcelas: <span className="font-semibold text-red-500">{formatCurrency(totalParcelado)}</span>
                  </p>
                  {gastosParcelados.length === 0 ? (
                    <p className="text-foreground/50 text-center py-6 text-sm">
                      Nenhum parcelamento neste período.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {gastosParcelados.map((gasto) => (
                        <div
                          key={gasto.id}
                          className="border border-primary/10 rounded-lg p-2.5 flex items-center justify-between gap-2 bg-primary/10"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">
                              {gasto.descricao || "Sem descrição"}
                            </p>
                            <p className="text-[10px] text-foreground/60">
                              {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-[10px] text-primary/70 font-medium mt-0.5">
                              Parcela {gasto.numero_parcela_atual}/{gasto.numero_parcelas}
                              {gasto.valor_total_parcelamento &&
                                ` • Total: ${formatCurrency(gasto.valor_total_parcelamento)}`
                              }
                            </p>
                          </div>
                          <p className="text-base font-bold text-red-500 shrink-0">
                            {formatCurrency(Number(gasto.valor))}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function FaturasPage() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [gastosPorFatura, setGastosPorFatura] = useState<Record<string, Gasto[]>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    dia_fechamento: "1",
  });

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    const supabase = createClient();

    const [faturasRes, gastosRes] = await Promise.all([
      supabase.from("faturas").select("*").order("nome"),
      supabase.from("gastos").select("*").order("data", { ascending: false }),
    ]);

    const faturasData = faturasRes.data ?? [];
    const gastosData = gastosRes.data ?? [];

    setFaturas(faturasData);

    // Agrupar gastos por fatura
    const gastosPorFaturaMap: Record<string, Gasto[]> = {};
    gastosData.forEach((gasto) => {
      if (gasto.fatura_id) {
        if (!gastosPorFaturaMap[gasto.fatura_id]) {
          gastosPorFaturaMap[gasto.fatura_id] = [];
        }
        gastosPorFaturaMap[gasto.fatura_id].push(gasto);
      }
    });

    setGastosPorFatura(gastosPorFaturaMap);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      nome: "",
      dia_fechamento: "1",
    });
    setModalOpen(true);
  };

  const openEdit = (fatura: Fatura) => {
    setEditingId(fatura.id);
    setFormData({
      nome: fatura.nome,
      dia_fechamento: String(fatura.dia_fechamento),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const payload = {
      nome: formData.nome,
      dia_fechamento: parseInt(formData.dia_fechamento),
    };

    if (editingId) {
      await supabase.from("faturas").update(payload).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      await supabase.from("faturas").insert({
        ...payload,
        user_id: user.id,
      });
    }

    setModalOpen(false);
    setFormData({
      nome: "",
      dia_fechamento: "1",
    });
    setEditingId(null);
    setLoading(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fatura?")) return;
    const supabase = createClient();
    await supabase.from("faturas").delete().eq("id", id);
    fetchData();
  };

  // Função para obter o período de uma fatura para um mês específico
  const getPeriodoFatura = (diaFechamento: number, mes: number, ano: number) => {
    // Se a fatura fecha no dia 5, por exemplo:
    // Período de Janeiro: 05/12 até 05/01
    // Período de Fevereiro: 05/01 até 05/02
    const dataFim = new Date(ano, mes, diaFechamento);

    // Data de início é o dia de fechamento do mês anterior
    let mesInicio = mes - 1;
    let anoInicio = ano;

    if (mesInicio < 0) {
      mesInicio = 11;
      anoInicio = ano - 1;
    }

    const dataInicio = new Date(anoInicio, mesInicio, diaFechamento + 1);

    return { dataInicio, dataFim };
  };

  // Função para filtrar gastos de uma fatura por mês
  const getGastosPorMes = (fatura: Fatura, mes: number, ano: number) => {
    const gastos = gastosPorFatura[fatura.id] || [];
    const { dataInicio, dataFim } = getPeriodoFatura(fatura.dia_fechamento, mes, ano);

    return gastos.filter(gasto => {
      const dataGasto = new Date(gasto.data + "T00:00:00");
      return dataGasto > dataInicio && dataGasto <= dataFim;
    });
  };

  const calcularTotalMes = (fatura: Fatura, mes: number, ano: number) => {
    const gastos = getGastosPorMes(fatura, mes, ano);
    return gastos.reduce((acc, gasto) => acc + Number(gasto.valor), 0);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Gerar opções de dias (1 a 31)
  const diasOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  // Obter ano atual
  const anoAtual = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader showBackButton />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Faturas</h2>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openCreate}
                  className="bg-primary text-background font-semibold hover:bg-primary/90 text-sm sm:text-base w-full sm:w-auto"
                >
                  <Plus size={16} className="mr-1 sm:mr-2" />
                  Criar Nova Fatura
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-primary/20 max-w-md w-[calc(100vw-2rem)] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg text-foreground">
                    {editingId ? "Editar Fatura" : "Nova Fatura"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-sm text-foreground">
                      Nome da Fatura
                    </Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Ex: Nubank, Itaú..."
                      required
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      className="bg-background border-primary/30 text-foreground focus:border-primary text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dia_fechamento" className="text-sm text-foreground">
                      Fechamento da Fatura
                    </Label>
                    <Select
                      value={formData.dia_fechamento}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dia_fechamento: value })
                      }
                    >
                      <SelectTrigger className="w-full bg-background border-primary/30 text-foreground focus:border-primary text-sm sm:text-base">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-primary/30 max-h-60">
                        {diasOptions.map((dia) => (
                          <SelectItem
                            key={dia}
                            value={String(dia)}
                            className="cursor-pointer text-primary text-sm"
                          >
                            Dia {dia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-1 sm:pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 border-primary/30 text-foreground hover:bg-background text-sm sm:text-base"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary text-background hover:bg-primary/90 font-semibold text-sm sm:text-base"
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : editingId ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de faturas em tabs */}
          <Card className="border-primary/20 bg-background">
            <CardContent className="pt-6">
              {loadingData ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex gap-2 mb-3 sm:mb-4">
                    <Skeleton className="h-8 sm:h-10 w-24 sm:w-32" />
                    <Skeleton className="h-8 sm:h-10 w-24 sm:w-32" />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 sm:h-16 w-full" />
                    ))}
                  </div>
                </div>
              ) : faturas.length === 0 ? (
                <p className="text-foreground/50 text-center py-8 sm:py-12 text-sm sm:text-base">
                  Nenhuma fatura cadastrada.
                </p>
              ) : (
                <Tabs defaultValue={faturas[0]?.id} className="w-full">
                  <TabsList className="w-full h-auto justify-start overflow-x-auto flex-nowrap bg-background/50 border border-primary/20 mb-3 sm:mb-4 [&>button]:shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-1">
                    {faturas.map((fatura) => (
                      <TabsTrigger
                        key={fatura.id}
                        value={fatura.id}
                        className="data-[state=active]:bg-primary data-[state=active]:text-background whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                      >
                        {fatura.nome}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {faturas.map((fatura) => {
                    return (
                      <TabsContent key={fatura.id} value={fatura.id} className="mt-0">
                        <div className="space-y-3 sm:space-y-4">
                          {/* Informações da fatura */}
                          <div className="border border-primary/60 bg-primary/10 rounded-lg p-3 sm:p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="text-primary shrink-0" size={18} />
                                  <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                                    {fatura.nome}
                                  </h3>
                                </div>
                                <div className="text-xs sm:text-sm text-foreground/70">
                                  <p>
                                    <span className="font-medium">Fechamento:</span> Dia {fatura.dia_fechamento}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEdit(fatura)}
                                  className="border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-background h-8 w-8 sm:h-9 sm:w-9 p-0"
                                >
                                  <Pencil size={14} className="sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(fatura.id)}
                                  className="border-red-500/40  bg-primary/10 text-red-500 hover:bg-red-500 hover:text-white h-8 w-8 sm:h-9 sm:w-9 p-0"
                                >
                                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Gastos por mês */}
                          <div className="space-y-2 sm:space-y-3">
                            <h4 className="text-sm sm:text-base font-semibold text-foreground px-1">
                              Gastos desta Fatura
                            </h4>

                            {/* Mobile: Select de Meses */}
                            <div className="sm:hidden">
                              <MobileMonthSelector
                                fatura={fatura}
                                anoAtual={anoAtual}
                                getGastosPorMes={getGastosPorMes}
                                calcularTotalMes={calcularTotalMes}
                                getPeriodoFatura={getPeriodoFatura}
                                formatCurrency={formatCurrency}
                              />
                            </div>

                            {/* Desktop: Tabs de Meses */}
                            <div className="hidden sm:block">
                              <Tabs defaultValue={String(new Date().getMonth())} className="w-full">
                                <TabsList className="w-full h-auto justify-start overflow-x-auto flex-nowrap bg-background/50 border border-primary/20 mb-4 [&>button]:shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-1">
                                  {MESES.map((mes, index) => (
                                    <TabsTrigger
                                      key={index}
                                      value={String(index)}
                                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap text-xs px-3 py-2"
                                    >
                                      {mes}
                                    </TabsTrigger>
                                  ))}
                                </TabsList>

                                {MESES.map((nomeMes, indexMes) => {
                                  const gastosMes = getGastosPorMes(fatura, indexMes, anoAtual);
                                  const totalMes = calcularTotalMes(fatura, indexMes, anoAtual);
                                  const { dataInicio, dataFim } = getPeriodoFatura(fatura.dia_fechamento, indexMes, anoAtual);

                                  return (
                                    <TabsContent key={indexMes} value={String(indexMes)} className="mt-0">
                                      <div className="space-y-3">
                                        {/* Informação do período */}
                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                          <p className="text-xs text-foreground/70">
                                            Período: {format(dataInicio, "dd/MM/yyyy")} até {format(dataFim, "dd/MM/yyyy")}
                                          </p>
                                          <p className="text-lg font-bold text-red-500 mt-1">
                                            Total: {formatCurrency(totalMes)}
                                          </p>
                                        </div>

                                        {/* Tabs de À vista vs Parcelamentos */}
                                        <Tabs defaultValue="avista" className="w-full">
                                          <TabsList className="w-full bg-background/50 border border-primary/20 mb-3">
                                            <TabsTrigger
                                              value="avista"
                                              className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                                            >
                                              Compras à Vista
                                            </TabsTrigger>
                                            <TabsTrigger
                                              value="parcelamentos"
                                              className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                                            >
                                              Parcelamentos
                                            </TabsTrigger>
                                          </TabsList>

                                          {/* Tab: À Vista */}
                                          <TabsContent value="avista" className="mt-0">
                                            {(() => {
                                              const gastosAvista = gastosMes.filter(g => !g.eh_parcelado || g.eh_parcelado === null || g.eh_parcelado === undefined);
                                              const totalAvista = gastosAvista.reduce((acc, g) => acc + Number(g.valor), 0);

                                              return (
                                                <div className="space-y-2">
                                                  <p className="text-sm text-foreground/70 px-1">
                                                    Total à vista: <span className="font-semibold text-red-500">{formatCurrency(totalAvista)}</span>
                                                  </p>
                                                  {gastosAvista.length === 0 ? (
                                                    <p className="text-foreground/50 text-center py-4 text-sm">
                                                      Nenhuma compra à vista neste período.
                                                    </p>
                                                  ) : (
                                                    <div className="space-y-2">
                                                      {gastosAvista.map((gasto) => (
                                                        <div
                                                          key={gasto.id}
                                                          className="border border-primary/50 rounded-lg p-3 flex items-center justify-between gap-2"
                                                        >
                                                          <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-foreground text-base truncate">
                                                              {gasto.descricao || "Sem descrição"}
                                                            </p>
                                                            <p className="text-sm text-foreground/60">
                                                              {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                                            </p>
                                                          </div>
                                                          <p className="text-lg font-bold text-red-500 shrink-0">
                                                            {formatCurrency(Number(gasto.valor))}
                                                          </p>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </TabsContent>

                                          {/* Tab: Parcelamentos */}
                                          <TabsContent value="parcelamentos" className="mt-0">
                                            {(() => {
                                              const gastosParcelados = gastosMes.filter(g => g.eh_parcelado === true);
                                              const totalParcelado = gastosParcelados.reduce((acc, g) => acc + Number(g.valor), 0);

                                              return (
                                                <div className="space-y-2">
                                                  <p className="text-sm text-foreground/70 px-1">
                                                    Total em parcelas: <span className="font-semibold text-red-500">{formatCurrency(totalParcelado)}</span>
                                                  </p>
                                                  {gastosParcelados.length === 0 ? (
                                                    <p className="text-foreground/50 text-center py-4 text-sm">
                                                      Nenhum parcelamento neste período.
                                                    </p>
                                                  ) : (
                                                    <div className="space-y-2">
                                                      {gastosParcelados.map((gasto) => (
                                                        <div
                                                          key={gasto.id}
                                                          className="border border-primary/10 rounded-lg p-3 flex items-center justify-between gap-2 bg-primary/10"
                                                        >
                                                          <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-foreground text-base truncate">
                                                              {gasto.descricao || "Sem descrição"}
                                                            </p>
                                                            <p className="text-xs text-foreground/60">
                                                              {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                                            </p>
                                                            <p className="text-xs text-primary/70 font-medium mt-1">
                                                              Parcela {gasto.numero_parcela_atual}/{gasto.numero_parcelas}
                                                              {gasto.valor_total_parcelamento &&
                                                                ` • Total: ${formatCurrency(gasto.valor_total_parcelamento)}`
                                                              }
                                                            </p>
                                                          </div>
                                                          <p className="text-lg font-bold text-red-500 shrink-0">
                                                            {formatCurrency(Number(gasto.valor))}
                                                          </p>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </TabsContent>
                                        </Tabs>
                                      </div>
                                    </TabsContent>
                                  );
                                })}
                              </Tabs>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
