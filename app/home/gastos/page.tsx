"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, TrendingDown, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { AppHeader } from "@/components/app-header";

interface CategoriaGasto {
  id: string;
  nome: string;
}

interface FormaPagamento {
  id: string;
  nome: string;
}

interface Gasto {
  id: string;
  valor: number;
  data: string;
  descricao: string | null;
  categoria_id: string | null;
  forma_pagamento_id: string | null;
}

export default function GastosPage() {
  const [totalMes, setTotalMes] = useState(0);
  const [totalAno, setTotalAno] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    valor: "",
    categoria_id: "",
    forma_pagamento_id: "",
    descricao: "",
    data: new Date(),
  });

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    const supabase = createClient();
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    const lastDayYear = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];

    const [mesRes, anoRes, categoriasRes, formasPagamentoRes, gastosRes] = await Promise.all([
      supabase.from("gastos").select("valor").gte("data", firstDayMonth).lte("data", lastDayMonth),
      supabase.from("gastos").select("valor").gte("data", firstDayYear).lte("data", lastDayYear),
      supabase.from("categorias_gastos").select("id, nome").order("nome"),
      supabase.from("formas_pagamento").select("id, nome").order("nome"),
      supabase.from("gastos").select("*").order("data", { ascending: false }),
    ]);

    setTotalMes(mesRes.data?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0);
    setTotalAno(anoRes.data?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0);
    setCategorias(categoriasRes.data ?? []);
    setFormasPagamento(formasPagamentoRes.data ?? []);
    setGastos(gastosRes.data ?? []);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ valor: "", categoria_id: "", forma_pagamento_id: "", descricao: "", data: new Date() });
    setModalOpen(true);
  };

  const openEdit = (gasto: Gasto) => {
    setEditingId(gasto.id);
    setFormData({
      valor: String(gasto.valor),
      categoria_id: gasto.categoria_id ?? "",
      forma_pagamento_id: gasto.forma_pagamento_id ?? "",
      descricao: gasto.descricao ?? "",
      data: new Date(gasto.data + "T00:00:00"),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este gasto?")) return;
    const supabase = createClient();
    await supabase.from("gastos").delete().eq("id", id);
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const dataFormatted = formData.data.toISOString().split("T")[0];
    const payload = {
      valor: parseFloat(formData.valor.replace(",", ".")),
      categoria_id: formData.categoria_id || null,
      forma_pagamento_id: formData.forma_pagamento_id || null,
      descricao: formData.descricao || null,
      data: dataFormatted,
    };

    if (editingId) {
      await supabase.from("gastos").update(payload).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      await supabase.from("gastos").insert({
        ...payload,
        user_id: user.id,
      });
    }

    setModalOpen(false);
    setFormData({ valor: "", categoria_id: "", forma_pagamento_id: "", descricao: "", data: new Date() });
    setEditingId(null);
    setLoading(false);
    fetchData();
  };

  const getCategoriaNome = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? "—";
  const getFormaPagamentoNome = (id: string | null) => formasPagamento.find((f) => f.id === id)?.nome ?? "—";
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Agrupar gastos por mês
  const gastosPorMes = gastos.reduce((acc, gasto) => {
    const data = new Date(gasto.data + "T00:00:00");
    const mesAno = format(data, "yyyy-MM");
    if (!acc[mesAno]) {
      acc[mesAno] = [];
    }
    acc[mesAno].push(gasto);
    return acc;
  }, {} as Record<string, Gasto[]>);

  // Obter meses ordenados (janeiro primeiro)
  const mesesDisponiveis = Object.keys(gastosPorMes).sort();

  // Obter mês atual como padrão
  const mesAtual = format(new Date(), "yyyy-MM");
  const mesDefault = mesesDisponiveis.includes(mesAtual) ? mesAtual : mesesDisponiveis[0];

  // Formatar nome do mês
  const formatarNomeMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split("-");
    const data = new Date(parseInt(ano), parseInt(mes) - 1);
    const nomeMes = format(data, "MMMM", { locale: ptBR });
    return nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Gastos</h2>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {/* <Link href="/home/categorias-gastos">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background">
                  Gerenciar Categorias
                </Button>
              </Link> */}
              <Button onClick={openCreate} className="bg-primary text-background font-semibold hover:bg-primary/90 text-sm sm:text-base flex-1 sm:flex-none">
                <Plus size={16} className="mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Adicionar </span>Gasto
              </Button>
            </div>
          </div>

          {/* Totais */}
          {loadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Card className="border-primary border-2 bg-background/50">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-40" />
                </CardContent>
              </Card>
              <Card className="border-primary/20 border-2 bg-background/50">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-40" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Card className="border-primary border-2 bg-background/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500" size={18} />
                    Total do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl sm:text-3xl font-bold text-red-500">{formatCurrency(totalMes)}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 border-2 bg-background/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
                    <TrendingDown className="text-red-500" size={18} />
                    Total do Ano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl sm:text-3xl font-bold text-red-500">{formatCurrency(totalAno)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de gastos por mês */}
          <Card className="border-primary/20 bg-background">
            <CardContent className="pt-6">
              {loadingData ? (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              ) : gastos.length === 0 ? (
                <p className="text-foreground/50 text-center py-8">Nenhum gasto cadastrado.</p>
              ) : (
                <Tabs defaultValue={mesDefault} className="w-full **:[[role=tablist]]:overflow-visible [&_button[aria-label]]:hidden">
                  <TabsList className="w-full h-auto justify-start overflow-x-auto flex-nowrap bg-background/50 border border-primary/20 mb-4 [&>button]:shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {mesesDisponiveis.map((mesAno) => (
                      <TabsTrigger
                        key={mesAno}
                        value={mesAno}
                        className="data-[state=active]:bg-primary data-[state=active]:text-background capitalize whitespace-nowrap"
                      >
                        {formatarNomeMes(mesAno)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {mesesDisponiveis.map((mesAno) => (
                    <TabsContent key={mesAno} value={mesAno} className="mt-0">
                      {/* Visualização Desktop - Tabela */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-primary/20">
                              <th className="text-left py-3 px-4 text-foreground font-semibold">Data</th>
                              <th className="text-left py-3 px-4 text-foreground font-semibold">Valor</th>
                              <th className="text-left py-3 px-4 text-foreground font-semibold">Categoria</th>
                              <th className="text-left py-3 px-4 text-foreground font-semibold">Forma de Pagamento</th>
                              <th className="text-left py-3 px-4 text-foreground font-semibold">Descrição</th>
                              <th className="text-right py-3 px-4 text-foreground font-semibold">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gastosPorMes[mesAno].map((gasto) => (
                              <tr key={gasto.id} className="border-b border-primary/10">
                                <td className="py-3 px-4 text-foreground">
                                  {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                </td>
                                <td className="py-3 px-4 text-red-500 font-semibold">
                                  {formatCurrency(Number(gasto.valor))}
                                </td>
                                <td className="py-3 px-4 text-foreground">{getCategoriaNome(gasto.categoria_id)}</td>
                                <td className="py-3 px-4 text-foreground">{getFormaPagamentoNome(gasto.forma_pagamento_id)}</td>
                                <td className="py-3 px-4 text-foreground/70">{gasto.descricao || "—"}</td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(gasto)} className="border-primary/30 text-primary hover:bg-primary hover:text-background">
                                      <Pencil size={16} />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(gasto.id)} className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Visualização Mobile - Cards */}
                      <div className="md:hidden space-y-3">
                        {gastosPorMes[mesAno].map((gasto) => (
                          <div key={gasto.id} className="border border-primary/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-2xl font-bold text-red-500">
                                  {formatCurrency(Number(gasto.valor))}
                                </p>
                                <p className="text-sm text-foreground/60 mt-1">
                                  {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit(gasto)} className="border-primary/30 text-primary hover:bg-primary hover:text-background h-8 w-8 p-0">
                                  <Pencil size={14} />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(gasto.id)} className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white h-8 w-8 p-0">
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-foreground/50 font-medium">Categoria:</span>
                                <span className="text-sm text-foreground">{getCategoriaNome(gasto.categoria_id)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-foreground/50 font-medium">Pagamento:</span>
                                <span className="text-sm text-foreground">{getFormaPagamentoNome(gasto.forma_pagamento_id)}</span>
                              </div>
                              {gasto.descricao && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-foreground/50 font-medium">Descrição:</span>
                                  <span className="text-sm text-foreground/70">{gasto.descricao}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-primary/20 bg-background max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl text-foreground">{editingId ? "Editar Gasto" : "Novo Gasto"}</CardTitle>
                <button onClick={() => setModalOpen(false)} className="text-foreground/50 hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-sm text-foreground">Valor</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-semibold text-sm">R$</span>
                    <Input
                      id="valor"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      required
                      value={formData.valor}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.,]/g, "");
                        setFormData({ ...formData, valor: value });
                      }}
                      className="bg-background border-primary/30 text-foreground focus:border-primary pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-background border-primary/30 text-foreground hover:bg-background hover:text-foreground"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {format(formData.data, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border-primary/30" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.data}
                        onSelect={(date) => date && setFormData({ ...formData, data: date })}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-sm text-foreground">Categoria</Label>
                  {categorias.length > 0 ? (
                    <Select
                      value={formData.categoria_id}
                      onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                    >
                      <SelectTrigger className="w-full bg-background border-primary/30 text-foreground focus:border-primary cursor-pointer">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-primary/30">
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="cursor-pointer text-primary">
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-foreground/50">
                      Nenhuma categoria cadastrada.{" "}
                      <Link href="/home/categorias-gastos" className="text-primary hover:underline font-semibold">
                        Cadastrar categoria de gastos
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento" className="text-sm text-foreground">Forma de Pagamento</Label>
                  {formasPagamento.length > 0 ? (
                    <Select
                      value={formData.forma_pagamento_id}
                      onValueChange={(value) => setFormData({ ...formData, forma_pagamento_id: value })}
                    >
                      <SelectTrigger className="w-full bg-background border-primary/30 text-foreground focus:border-primary cursor-pointer">
                        <SelectValue placeholder="Selecione uma forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-primary/30">
                        {formasPagamento.map((f) => (
                          <SelectItem key={f.id} value={f.id} className="cursor-pointer text-primary">
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-foreground/50">
                      Nenhuma forma de pagamento cadastrada.{" "}
                      <Link href="/home/formas-pagamento" className="text-primary hover:underline font-semibold">
                        Cadastrar forma de pagamento
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-sm text-foreground">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    type="text"
                    placeholder="Ex: Aluguel, Mercado..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="bg-background border-primary/30 text-foreground focus:border-primary"
                  />
                </div>

                <Button type="submit" className="w-full bg-primary text-background hover:bg-primary/90 font-semibold mt-4" disabled={loading}>
                  {loading ? "Salvando..." : editingId ? "Salvar Alteração" : "Salvar Gasto"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
