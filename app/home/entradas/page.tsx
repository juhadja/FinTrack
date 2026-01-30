"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, DollarSign, Pencil, Trash2 } from "lucide-react";

interface FonteRenda {
  id: string;
  nome: string;
}

interface Entrada {
  id: string;
  valor: number;
  data: string;
  descricao: string | null;
  fonte_id: string | null;
}

export default function EntradasPage() {
  const supabase = createClient();
  const [totalMes, setTotalMes] = useState(0);
  const [totalAno, setTotalAno] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [fontes, setFontes] = useState<FonteRenda[]>([]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    valor: "",
    fonte_id: "",
    descricao: "",
  });

  const fetchData = useCallback(async () => {
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    const lastDayYear = new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];

    const [mesRes, anoRes, fontesRes, entradasRes] = await Promise.all([
      supabase.from("entradas").select("valor").gte("data", firstDayMonth).lte("data", lastDayMonth),
      supabase.from("entradas").select("valor").gte("data", firstDayYear).lte("data", lastDayYear),
      supabase.from("fontes_renda").select("id, nome").order("nome"),
      supabase.from("entradas").select("*").order("data", { ascending: false }),
    ]);

    setTotalMes(mesRes.data?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0);
    setTotalAno(anoRes.data?.reduce((acc, e) => acc + Number(e.valor), 0) ?? 0);
    setFontes(fontesRes.data ?? []);
    setEntradas(entradasRes.data ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ valor: "", fonte_id: "", descricao: "" });
    setModalOpen(true);
  };

  const openEdit = (entrada: Entrada) => {
    setEditingId(entrada.id);
    setFormData({
      valor: String(entrada.valor),
      fonte_id: entrada.fonte_id ?? "",
      descricao: entrada.descricao ?? "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta entrada?")) return;
    await supabase.from("entradas").delete().eq("id", id);
    fetchData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      valor: parseFloat(formData.valor.replace(",", ".")),
      fonte_id: formData.fonte_id || null,
      descricao: formData.descricao || null,
    };

    if (editingId) {
      await supabase.from("entradas").update(payload).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      await supabase.from("entradas").insert({
        ...payload,
        user_id: user.id,
        data: new Date().toISOString().split("T")[0],
      });
    }

    setModalOpen(false);
    setFormData({ valor: "", fonte_id: "", descricao: "" });
    setEditingId(null);
    setLoading(false);
    fetchData();
  };

  const getFonteNome = (id: string | null) => fontes.find((f) => f.id === id)?.nome ?? "—";
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
            <h2 className="text-3xl font-bold text-foreground">Entradas</h2>
            <div className="flex gap-3">
              <Link href="/home/fontes-renda">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-background ">
                  Gerenciar Fontes de Renda
                </Button>
              </Link>
              <Button onClick={openCreate} className="bg-primary text-background font-semibold hover:bg-primary/90">
                <Plus size={18} className="mr-2" /> Adicionar Entrada
              </Button>
            </div>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-primary border-2 bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <DollarSign className="text-primary" size={20} />
                  Total do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalMes)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <DollarSign className="text-primary" size={20} />
                  Total do Ano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalAno)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de entradas */}
          <Card className="border-primary/20 bg-background">
            <CardContent className="pt-6">
              {entradas.length === 0 ? (
                <p className="text-foreground/50 text-center py-8">Nenhuma entrada cadastrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/20">
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Data</th>
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Valor</th>
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Fonte</th>
                        <th className="text-left py-3 px-4 text-foreground font-semibold">Descrição</th>
                        <th className="text-right py-3 px-4 text-foreground font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entradas.map((entrada) => (
                        <tr key={entrada.id} className="border-b border-primary/10">
                          <td className="py-3 px-4 text-foreground">
                            {new Date(entrada.data + "T00:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 px-4 text-primary font-semibold">
                            {formatCurrency(Number(entrada.valor))}
                          </td>
                          <td className="py-3 px-4 text-foreground">{getFonteNome(entrada.fonte_id)}</td>
                          <td className="py-3 px-4 text-foreground/70">{entrada.descricao || "—"}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit(entrada)} className="border-primary/30 text-primary hover:bg-primary hover:text-background">
                                <Pencil size={16} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(entrada.id)} className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">
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
                <CardTitle className="text-xl text-foreground">{editingId ? "Editar Entrada" : "Nova Entrada"}</CardTitle>
                <button onClick={() => setModalOpen(false)} className="text-foreground/50 hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-foreground">Valor</Label>
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
                  <Label htmlFor="fonte" className="text-foreground">Fonte de Renda</Label>
                  {fontes.length > 0 ? (
                    <Select
                      value={formData.fonte_id}
                      onValueChange={(value) => setFormData({ ...formData, fonte_id: value })}
                    >
                      <SelectTrigger className="w-full bg-background border-primary/30 text-foreground focus:border-primary cursor-pointer">
                        <SelectValue placeholder="Selecione uma fonte" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-primary/30">
                        {fontes.map((f) => (
                          <SelectItem key={f.id} value={f.id} className="cursor-pointer text-primary">
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-foreground/50">
                      Nenhuma fonte cadastrada.{" "}
                      <Link href="/home/fontes-renda" className="text-primary hover:underline font-semibold">
                        Cadastrar fonte de renda
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-foreground">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    type="text"
                    placeholder="Ex: Salário de janeiro"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="bg-background border-primary/30 text-foreground focus:border-primary"
                  />
                </div>

                <Button type="submit" className="w-full bg-primary text-background hover:bg-primary/90 font-semibold" disabled={loading}>
                  {loading ? "Salvando..." : editingId ? "Salvar Alteração" : "Salvar Entrada"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
