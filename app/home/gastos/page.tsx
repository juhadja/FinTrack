"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { ArrowLeft, Plus, X, TrendingDown, Pencil, Trash2 } from "lucide-react";

interface CategoriaGasto {
  id: string;
  nome: string;
}

interface Gasto {
  id: string;
  valor: number;
  data: string;
  descricao: string | null;
  categoria_id: string | null;
}

export default function GastosPage() {
  const supabase = createClient();
  const [totalMes, setTotalMes] = useState(0);
  const [totalAno, setTotalAno] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    valor: "",
    categoria_id: "",
    descricao: "",
  });

  const fetchData = useCallback(async () => {
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    const lastDayYear = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];

    const [mesRes, anoRes, categoriasRes, gastosRes] = await Promise.all([
      supabase.from("gastos").select("valor").gte("data", firstDayMonth).lte("data", lastDayMonth),
      supabase.from("gastos").select("valor").gte("data", firstDayYear).lte("data", lastDayYear),
      supabase.from("categorias_gastos").select("id, nome").order("nome"),
      supabase.from("gastos").select("*").order("data", { ascending: false }),
    ]);

    setTotalMes(mesRes.data?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0);
    setTotalAno(anoRes.data?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0);
    setCategorias(categoriasRes.data ?? []);
    setGastos(gastosRes.data ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ valor: "", categoria_id: "", descricao: "" });
    setModalOpen(true);
  };

  const openEdit = (gasto: Gasto) => {
    setEditingId(gasto.id);
    setFormData({
      valor: String(gasto.valor),
      categoria_id: gasto.categoria_id ?? "",
      descricao: gasto.descricao ?? "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este gasto?")) return;
    await supabase.from("gastos").delete().eq("id", id);
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      valor: parseFloat(formData.valor),
      categoria_id: formData.categoria_id || null,
      descricao: formData.descricao || null,
    };

    if (editingId) {
      await supabase.from("gastos").update(payload).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      await supabase.from("gastos").insert({
        ...payload,
        user_id: user.id,
        data: new Date().toISOString().split("T")[0],
      });
    }

    setModalOpen(false);
    setFormData({ valor: "", categoria_id: "", descricao: "" });
    setEditingId(null);
    setLoading(false);
    fetchData();
  };

  const getCategoriaNome = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? "—";
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-primary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo.svg" alt="FinTrack" width={40} height={40} />
              <h1 className="text-2xl font-bold text-primary">FinTrack</h1>
            </div>
            <Link href="/home">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background">
                <ArrowLeft size={18} className="mr-2" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground">Gastos</h2>
            <div className="flex gap-3">
              <Link href="/home/categorias-gastos">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background">
                  Gerenciar Categorias
                </Button>
              </Link>
              <Button onClick={openCreate} className="bg-primary text-background font-semibold hover:bg-primary/90">
                <Plus size={18} className="mr-2" /> Adicionar Gasto
              </Button>
            </div>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-primary border-2 bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <TrendingDown className="text-red-500" size={20} />
                  Total do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">{formatCurrency(totalMes)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 border-2 bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <TrendingDown className="text-red-500" size={20} />
                  Total do Ano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-500">{formatCurrency(totalAno)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de gastos */}
          <Card className="border-primary/20 bg-background">
            <CardContent className="pt-6">
              {gastos.length === 0 ? (
                <p className="text-foreground/50 text-center py-8">Nenhum gasto cadastrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/20">
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Data</th>
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Valor</th>
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Categoria</th>
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Descrição</th>
                        <th className="text-right py-3 px-4 text-foreground font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map((gasto) => (
                        <tr key={gasto.id} className="border-b border-primary/10">
                          <td className="py-3 px-4 text-foreground">
                            {new Date(gasto.data + "T00:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 px-4 text-red-500 font-semibold">
                            {formatCurrency(Number(gasto.valor))}
                          </td>
                          <td className="py-3 px-4 text-foreground">{getCategoriaNome(gasto.categoria_id)}</td>
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-md border-primary/20 bg-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-foreground">{editingId ? "Editar Gasto" : "Novo Gasto"}</CardTitle>
                <button onClick={() => setModalOpen(false)} className="text-foreground/50 hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-foreground">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="bg-background border-primary/30 text-foreground focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-foreground">Categoria</Label>
                  {categorias.length > 0 ? (
                    <select
                      id="categoria"
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                      className="w-full rounded-md border border-primary/30 bg-background text-foreground px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
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
                  <Label htmlFor="descricao" className="text-foreground">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    type="text"
                    placeholder="Ex: Aluguel, Mercado..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="bg-background border-primary/30 text-foreground focus:border-primary"
                  />
                </div>

                <Button type="submit" className="w-full bg-primary text-background hover:bg-primary/90 font-semibold" disabled={loading}>
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
